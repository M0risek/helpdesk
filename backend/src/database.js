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

  async function query(sql) {
    const connection = await pool.getConnection();
    try {
      connection.callTimeout = 5000;
      const result = await connection.execute(sql, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return result.rows;
    } finally {
      await connection.close();
    }
  }

  return {
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

    async close() {
      await pool.close(5);
    },
  };
}
