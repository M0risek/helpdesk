import oracledb from 'oracledb';

export async function createDatabase(config) {
  const pool = await oracledb.createPool({
    ...config,
    poolMin: 1,
    poolMax: 4,
    poolIncrement: 1,
    poolTimeout: 60,
    queueTimeout: 5000,
  });

  async function execute(sql, binds = {}, options = {}) {
    const connection = await pool.getConnection();
    try {
      connection.callTimeout = 5000;
      return await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options,
      });
    } finally {
      await connection.close();
    }
  }

  async function query(sql, binds = {}, options = {}) {
    return (await execute(sql, binds, options)).rows;
  }

  function userFromRow(row, includeHash = false) {
    if (!row) return null;
    const user = { id: row.ID, fullName: row.FULL_NAME, email: row.EMAIL, role: row.USER_ROLE };
    if (includeHash) user.passwordHash = row.PASSWORD_HASH;
    return user;
  }

  const sessionBinds = (id, data, ttlSeconds) => ({
    id,
    data: { val: JSON.stringify(data), type: oracledb.CLOB },
    ttlSeconds,
  });

  return {
    execute,
    async checkConnection() {
      await query('SELECT 1 AS connection_test FROM dual');
    },

    async verifySchema() {
      const rows = await query(`
        SELECT table_name
        FROM user_tables
        WHERE table_name IN ('USERS', 'CATEGORIES', 'TICKETS')
        ORDER BY table_name
      `);
      if (rows.length !== 3) {
        throw new Error('Brakuje tabel projektu. Sprawdź konto HELPDESK i skrypt 01_schema.sql.');
      }
      return rows.map((row) => row.TABLE_NAME);
    },

    async getCategories() {
      const rows = await query(`
        SELECT id, name, description
        FROM categories
        ORDER BY name
      `);
      return rows.map((row) => ({
        id: row.ID,
        name: row.NAME,
        description: row.DESCRIPTION,
      }));
    },

    async verifyAuthSchema() {
      const rows = await query(`
        SELECT column_name, data_type FROM user_tab_columns
        WHERE table_name = 'AUTH_SESSIONS'
          AND column_name IN ('SESSION_ID', 'SESSION_DATA', 'EXPIRES_AT')
      `);
      const types = Object.fromEntries(rows.map((row) => [row.COLUMN_NAME, row.DATA_TYPE]));
      const indexes = await query(`
        SELECT index_name FROM user_indexes
        WHERE index_name = 'IDX_AUTH_SESSIONS_EXPIRY' AND status = 'VALID'
      `);
      if (types.SESSION_ID !== 'VARCHAR2' || types.SESSION_DATA !== 'CLOB' || !/^TIMESTAMP(?:\(\d+\))? WITH TIME ZONE$/.test(types.EXPIRES_AT ?? '') || indexes.length !== 1) {
        throw new Error('Brakuje tabeli sesji. Uruchom npm.cmd run db:migrate w folderze backend.');
      }
    },

    async findUserByEmail(email) {
      const rows = await query('SELECT id, full_name, email, user_role, password_hash FROM users WHERE email = :email', { email });
      return userFromRow(rows[0], true);
    },

    async findUserById(id) {
      const rows = await query('SELECT id, full_name, email, user_role FROM users WHERE id = :id', { id });
      return userFromRow(rows[0]);
    },

    async createUser({ fullName, email, passwordHash, role = 'CLIENT' }) {
      const result = await execute(`
        INSERT INTO users (full_name, email, password_hash, user_role)
        VALUES (:fullName, :email, :passwordHash, :role)
        RETURNING id INTO :id
      `, {
        fullName, email, passwordHash, role,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }, { autoCommit: true });
      return { id: result.outBinds.id[0], fullName, email, role };
    },

    async getStaffSummary() {
      const rows = await query(`
        SELECT (SELECT COUNT(*) FROM users WHERE user_role = 'CLIENT') AS clients,
               (SELECT COUNT(*) FROM tickets) AS tickets
        FROM dual
      `);
      return { clients: rows[0].CLIENTS, tickets: rows[0].TICKETS };
    },

    async getSession(id) {
      const rows = await query(`
        SELECT session_data FROM auth_sessions
        WHERE session_id = :id AND expires_at > SYSTIMESTAMP
      `, { id }, { fetchInfo: { SESSION_DATA: { type: oracledb.STRING } } });
      return rows.length ? JSON.parse(rows[0].SESSION_DATA) : null;
    },

    async setSession(id, data, ttlSeconds) {
      await execute(`
        MERGE INTO auth_sessions target
        USING (SELECT :id AS session_id FROM dual) source
        ON (target.session_id = source.session_id)
        WHEN MATCHED THEN UPDATE SET session_data = :data,
          expires_at = SYSTIMESTAMP + NUMTODSINTERVAL(:ttlSeconds, 'SECOND')
        WHEN NOT MATCHED THEN INSERT (session_id, session_data, expires_at)
          VALUES (:id, :data, SYSTIMESTAMP + NUMTODSINTERVAL(:ttlSeconds, 'SECOND'))
      `, sessionBinds(id, data, ttlSeconds), { autoCommit: true });
      await execute('DELETE FROM auth_sessions WHERE expires_at <= SYSTIMESTAMP', {}, { autoCommit: true });
    },

    async touchSession(id, data, ttlSeconds) {
      await execute(`
        UPDATE auth_sessions SET session_data = :data,
          expires_at = SYSTIMESTAMP + NUMTODSINTERVAL(:ttlSeconds, 'SECOND')
        WHERE session_id = :id AND expires_at > SYSTIMESTAMP
      `, sessionBinds(id, data, ttlSeconds), { autoCommit: true });
    },

    async destroySession(id) {
      await execute('DELETE FROM auth_sessions WHERE session_id = :id', { id }, { autoCommit: true });
    },

    async close() {
      await pool.close(5);
    },
  };
}
