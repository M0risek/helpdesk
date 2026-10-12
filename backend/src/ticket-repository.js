import oracledb from 'oracledb';
import { HttpError } from './errors.js';
import { checkTicketChange } from './ticket-rules.js';

const dateSql = (column) => `TO_CHAR(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF6"Z"')`;
const columns = `t.id, t.title, t.description, t.category_id, c.name AS category_name,
  t.client_id, client.full_name AS client_name, t.assigned_to, worker.full_name AS assigned_name,
  t.status, ${dateSql('t.created_at')} AS created_at, ${dateSql('t.updated_at')} AS revision`;
const joins = 'FROM tickets t JOIN categories c ON c.id = t.category_id JOIN users client ON client.id = t.client_id LEFT JOIN users worker ON worker.id = t.assigned_to';
const access = '( :isStaff = 1 OR t.client_id = :userId )';
const actor = (user) => ({ isStaff: user.role === 'STAFF' ? 1 : 0, userId: user.id });
const fetchDescription = { fetchInfo: { DESCRIPTION: { type: oracledb.STRING } } };
const ticketFromRow = (row) => row ? { id: row.ID, title: row.TITLE, description: row.DESCRIPTION,
  categoryId: row.CATEGORY_ID, categoryName: row.CATEGORY_NAME, clientId: row.CLIENT_ID, clientName: row.CLIENT_NAME,
  assignedTo: row.ASSIGNED_TO, assignedName: row.ASSIGNED_NAME, status: row.STATUS,
  createdAt: row.CREATED_AT, updatedAt: row.REVISION, revision: row.REVISION } : null;

export function createTicketRepository({ query, transaction }) {
  async function readTicket(queryRows, id, user) {
    return ticketFromRow((await queryRows(`SELECT ${columns} ${joins} WHERE t.id = :id AND ${access}`, { id, ...actor(user) }, fetchDescription))[0]);
  }
  async function checkCategory(queryRows, categoryId) {
    if (!(await queryRows('SELECT id FROM categories WHERE id = :categoryId', { categoryId })).length) {
      throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'Wybrana kategoria nie istnieje.');
    }
  }
  async function lockedTicket(tx, id, user) {
    const row = (await tx.query(`SELECT id, client_id, status, assigned_to, ${dateSql('updated_at')} AS revision
      FROM tickets WHERE id = :id AND (:isStaff = 1 OR client_id = :userId) FOR UPDATE WAIT 3`, { id, ...actor(user) }))[0];
    return row ? { clientId: row.CLIENT_ID, status: row.STATUS, assignedTo: row.ASSIGNED_TO, revision: row.REVISION } : null;
  }
  return {
    async getStaffUsers() {
      return (await query("SELECT id, full_name FROM users WHERE user_role = 'STAFF' ORDER BY full_name, id")).map((row) => ({ id: row.ID, fullName: row.FULL_NAME }));
    },
    getTicket: (id, user) => readTicket(query, id, user),
    async listTickets(user, filters) {
      const binds = { ...actor(user), status: filters.status, categoryId: filters.categoryId, search: filters.search };
      const where = `WHERE ${access} AND (:status IS NULL OR t.status = :status)
        AND (:categoryId IS NULL OR t.category_id = :categoryId)
        AND (:search IS NULL OR INSTR(LOWER(t.title), LOWER(:search)) > 0 OR INSTR(LOWER(c.name), LOWER(:search)) > 0)`;
      const assignment = user.role === 'STAFF' && filters.assignment === 'mine' ? ' AND t.assigned_to = :userId'
        : user.role === 'STAFF' && filters.assignment === 'unassigned' ? ' AND t.assigned_to IS NULL' : '';
      const total = (await query(`SELECT COUNT(*) AS total ${joins} ${where}${assignment}`, binds))[0].TOTAL;
      const rows = await query(`SELECT ${columns} ${joins} ${where}${assignment} ORDER BY t.created_at DESC, t.id DESC
        OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, { ...binds, offset: (filters.page - 1) * filters.pageSize, pageSize: filters.pageSize }, fetchDescription);
      return { data: rows.map(ticketFromRow), pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.ceil(total / filters.pageSize) } };
    },
    async createTicket(user, form) {
      return transaction(async (tx) => {
        await checkCategory(tx.query, form.categoryId);
        const result = await tx.execute(`INSERT INTO tickets (title, description, category_id, client_id)
          VALUES (:title, :description, :categoryId, :clientId) RETURNING id INTO :id`, {
          title: form.title, description: { val: form.description, type: oracledb.CLOB }, categoryId: form.categoryId, clientId: user.id,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        });
        return readTicket(tx.query, result.outBinds.id[0], user);
      });
    },
    async updateTicket(id, user, form) {
      return transaction(async (tx) => {
        const ticket = await lockedTicket(tx, id, user);
        checkTicketChange(ticket, user, form.revision, user.role === 'STAFF' ? form : null);
        if (user.role === 'STAFF') {
          if (form.assignedTo !== null && !(await tx.query("SELECT id FROM users WHERE id = :id AND user_role = 'STAFF'", { id: form.assignedTo })).length) {
            throw new HttpError(400, 'STAFF_NOT_FOUND', 'Przypisz zgłoszenie do konta pracownika.');
          }
          await tx.execute("UPDATE tickets SET assigned_to = :assignedTo, status = :status, updated_at = GREATEST(SYSTIMESTAMP, updated_at + NUMTODSINTERVAL(0.000001, 'SECOND')) WHERE id = :id", { id, assignedTo: form.assignedTo, status: form.status });
        } else {
          await checkCategory(tx.query, form.categoryId);
          await tx.execute("UPDATE tickets SET title = :title, description = :description, category_id = :categoryId, updated_at = GREATEST(SYSTIMESTAMP, updated_at + NUMTODSINTERVAL(0.000001, 'SECOND')) WHERE id = :id", {
            id, title: form.title, description: { val: form.description, type: oracledb.CLOB }, categoryId: form.categoryId,
          });
        }
        return readTicket(tx.query, id, user);
      });
    },
    async deleteTicket(id, user, revision) {
      return transaction(async (tx) => {
        checkTicketChange(await lockedTicket(tx, id, user), user, revision);
        await tx.execute('DELETE FROM tickets WHERE id = :id', { id });
      });
    },
  };
}
