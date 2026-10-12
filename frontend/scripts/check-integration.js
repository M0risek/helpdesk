import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createApp } from '../../backend/src/app.js';
import { createDatabase } from '../../backend/src/database.js';
import { readConfig } from '../../backend/src/config.js';
import { hashPassword } from '../../backend/src/passwords.js';

const runId = randomUUID();
const clientEmail = `frontend-client-${runId}@example.invalid`;
const staffEmail = `frontend-staff-${runId}@example.invalid`;
const otherEmail = `frontend-other-${runId}@example.invalid`;
const password = `Test-${randomUUID()}`;
const sessions = new Set();
let database;
let backendServer;
let vite;
let step = 'konfiguracja';

function browserSession(origin) {
  let cookie = '';
  let token = '';
  return {
    get cookie() { return cookie; },
    async request(path, { method = 'GET', body, cookieOverride, csrf = true } = {}) {
      const headers = {};
      if (cookieOverride ?? cookie) headers.Cookie = cookieOverride ?? cookie;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (csrf && token) headers['X-CSRF-Token'] = token;
      const result = await fetch(`${origin}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      const setCookie = result.headers.get('set-cookie');
      if (setCookie) {
        cookie = setCookie.split(';')[0];
        const value = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
        if (value.startsWith('s:') && value.includes('.')) sessions.add(value.slice(2, value.lastIndexOf('.')));
      }
      const data = result.status === 204 ? null : await result.json();
      if (data?.csrfToken) token = data.csrfToken;
      return { status: result.status, data };
    },
  };
}

try {
  process.loadEnvFile(new URL('../../backend/.env', import.meta.url));
  const config = readConfig();
  if (config.auth.secureCookies) throw new Error('Test lokalny wymaga NODE_ENV=development.');
  database = await createDatabase(config.database);
  await database.verifySchema();
  await database.verifyAuthSchema();
  const baseline = await database.getStaffSummary();
  backendServer = createApp(database, console, config.auth).listen(0, '127.0.0.1');
  await once(backendServer, 'listening');
  vite = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    logLevel: 'error',
    server: {
      host: '127.0.0.1', port: 0, strictPort: false,
      proxy: { '/api': { target: `http://127.0.0.1:${backendServer.address().port}`, changeOrigin: false, cookieDomainRewrite: '' } },
    },
  });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const client = browserSession(origin);

  step = 'strona i API przez proxy Vite';
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>HelpDesk/);
  const categories = await client.request('/categories');
  assert.equal(categories.status, 200);
  assert.deepEqual(categories.data.data, await database.getCategories());
  console.log('OK: strona HelpDesk i rzeczywiste kategorie Oracle przez proxy Vite.');

  step = 'rejestracja i logowanie przez frontend';
  assert.equal((await client.request('/auth/me')).status, 401);
  await client.request('/auth/csrf');
  const form = { fullName: 'Klient testu frontendu', email: clientEmail, password };
  assert.equal((await client.request('/auth/register', { method: 'POST', body: form })).status, 201);
  assert.equal((await client.request('/auth/register', { method: 'POST', body: form })).status, 409);
  assert.equal((await client.request('/auth/login', { method: 'POST', body: { email: clientEmail, password } })).status, 200);
  const authenticatedCookie = client.cookie;
  const profile = await client.request('/auth/me');
  assert.equal(profile.data.user.email, clientEmail);
  assert.equal(profile.data.user.role, 'CLIENT');
  assert.equal((await client.request('/staff/summary')).status, 403);
  assert.equal((await browserSession(origin).request('/auth/me', { cookieOverride: authenticatedCookie })).status, 200);
  console.log('OK: rejestracja, duplikat e-maila, logowanie, odtworzenie sesji i uprawnienia klienta.');

  step = 'panel pracownika przez frontend';
  const staffAccount = await database.createUser({ fullName: 'Pracownik testu frontendu', email: staffEmail, passwordHash: await hashPassword(password), role: 'STAFF' });
  const staff = browserSession(origin);
  await staff.request('/auth/csrf');
  assert.equal((await staff.request('/auth/login', { method: 'POST', body: { email: staffEmail, password } })).status, 200);
  const summary = await staff.request('/staff/summary');
  assert.equal(summary.status, 200);
  assert.deepEqual(summary.data.data, { clients: baseline.clients + 1, tickets: baseline.tickets });
  console.log('OK: panel pracownika otrzymuje rzeczywiste liczniki z Oracle.');

  step = 'tworzenie, odczyt i edycja zgłoszeń w Oracle';
  const ticketForm = { title: `Test zgłoszenia ${runId}`, categoryId: categories.data.data[0].id, description: 'Zażółć gęślą jaźń.\nLaptop nie uruchamia się po podłączeniu zasilania.' };
  assert.equal((await browserSession(origin).request('/tickets')).status, 401);
  assert.equal((await client.request('/tickets', { method: 'POST', body: { ...ticketForm, clientId: 999 } })).status, 400);
  assert.equal((await client.request('/tickets', { method: 'POST', body: { ...ticketForm, categoryId: 9007199254740991 } })).status, 400);
  const created = await client.request('/tickets', { method: 'POST', body: ticketForm });
  assert.equal(created.status, 201);
  let ticket = created.data.data;
  assert.equal(ticket.clientId, profile.data.user.id);
  assert.equal(ticket.status, 'NEW');
  assert.equal(ticket.assignedTo, null);
  assert.equal(ticket.description, ticketForm.description);
  assert.match(ticket.revision, /^\d{4}-\d{2}-\d{2}T.*\.\d{6}Z$/);
  assert.equal((await staff.request('/tickets', { method: 'POST', body: ticketForm })).status, 403);
  const originalRevision = ticket.revision;
  const edit = { ...ticketForm, title: `${ticketForm.title} — poprawione`, revision: originalRevision };
  assert.equal((await client.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: edit, csrf: false })).status, 403);
  const edited = await client.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: edit });
  assert.equal(edited.status, 200);
  ticket = edited.data.data;
  assert.notEqual(ticket.revision, originalRevision);
  assert.equal((await client.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: edit })).status, 409);
  const second = await client.request('/tickets', { method: 'POST', body: { ...ticketForm, title: `${ticketForm.title} do usunięcia`, description: '🔧'.repeat(5000) } });
  assert.equal(second.status, 201);
  assert.equal([...second.data.data.description].length, 5000);
  const pageOne = await client.request(`/tickets?search=${encodeURIComponent(ticketForm.title)}&pageSize=1`);
  assert.equal(pageOne.data.pagination.total, 2);
  assert.equal(pageOne.data.data.length, 1);
  assert.equal((await client.request('/tickets?search=%27%20OR%201%3D1%20--')).data.pagination.total, 0);
  console.log('OK: CRUD, tekst polski i CLOB, CSRF, walidacja kategorii, paginacja i ochrona przed nadpisaniem.');

  step = 'izolacja zgłoszeń między klientami';
  const other = browserSession(origin);
  await other.request('/auth/csrf');
  assert.equal((await other.request('/auth/register', { method: 'POST', body: { fullName: 'Inny klient testowy', email: otherEmail, password } })).status, 201);
  assert.equal((await other.request('/auth/login', { method: 'POST', body: { email: otherEmail, password } })).status, 200);
  assert.equal((await other.request('/tickets')).data.pagination.total, 0);
  assert.equal((await other.request(`/tickets/${ticket.id}`)).status, 404);
  assert.equal((await other.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...ticketForm, revision: ticket.revision } })).status, 404);
  assert.equal((await other.request(`/tickets/${ticket.id}`, { method: 'DELETE', body: { revision: ticket.revision } })).status, 404);
  assert.equal((await client.request('/staff/users')).status, 403);
  const workers = await staff.request('/staff/users');
  assert.equal(workers.status, 200);
  assert.ok(workers.data.data.some((worker) => worker.id === staffAccount.id));
  assert.ok(!workers.data.data.some((worker) => worker.id === profile.data.user.id));
  console.log('OK: klient nie odczyta, nie zmieni i nie usunie cudzego zgłoszenia.');

  step = 'przypisanie pracownika, transakcje i równoczesny zapis';
  const management = { assignedTo: staffAccount.id, status: 'IN_PROGRESS', revision: ticket.revision };
  assert.equal((await client.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: management })).status, 400);
  assert.equal((await staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...management, assignedTo: profile.data.user.id } })).status, 400);
  assert.equal((await staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...management, assignedTo: null } })).status, 400);
  assert.equal((await staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...management, status: 'CLOSED' } })).status, 400);
  assert.equal((await staff.request(`/tickets/${ticket.id}`)).data.data.revision, ticket.revision);
  const concurrent = await Promise.all([
    staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: management }),
    staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: management }),
  ]);
  assert.deepEqual(concurrent.map((result) => result.status).sort(), [200, 409]);
  ticket = concurrent.find((result) => result.status === 200).data.data;
  assert.equal(ticket.status, 'IN_PROGRESS');
  assert.equal(ticket.assignedTo, staffAccount.id);
  assert.equal((await client.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...ticketForm, revision: ticket.revision } })).status, 409);
  assert.equal((await client.request(`/tickets/${ticket.id}`, { method: 'DELETE', body: { revision: ticket.revision } })).status, 409);
  assert.equal((await staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...management, status: 'NEW', revision: ticket.revision } })).status, 400);
  const closed = await staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...management, status: 'CLOSED', revision: ticket.revision } });
  assert.equal(closed.status, 200);
  ticket = closed.data.data;
  assert.equal((await client.request(`/tickets/${ticket.id}`)).data.data.status, 'CLOSED');
  const filtered = await staff.request(`/tickets?status=CLOSED&assignment=mine&categoryId=${ticket.categoryId}&search=${encodeURIComponent(ticketForm.title)}`);
  assert.equal(filtered.data.pagination.total, 1);
  assert.equal(filtered.data.data[0].id, ticket.id);
  assert.equal((await staff.request(`/tickets/${ticket.id}`, { method: 'PATCH', body: { ...management, revision: ticket.revision } })).status, 409);
  assert.equal((await staff.request(`/tickets/${ticket.id}`, { method: 'DELETE', body: { revision: ticket.revision } })).status, 403);
  assert.equal((await client.request(`/tickets/${second.data.data.id}`, { method: 'DELETE', body: { revision: second.data.data.revision } })).status, 204);
  assert.equal((await client.request(`/tickets/${second.data.data.id}`)).status, 404);
  assert.deepEqual((await staff.request('/staff/summary')).data.data, { clients: baseline.clients + 2, tickets: baseline.tickets + 1 });
  console.log('OK: tylko pracownik obsługuje zgłoszenie; równoczesny zapis kończy się 200 + 409; usunięcie nowego zgłoszenia działa.');
  assert.equal((await other.request('/auth/logout', { method: 'POST', body: {} })).status, 204);
  assert.equal((await staff.request('/auth/logout', { method: 'POST', body: {} })).status, 204);

  step = 'wylogowanie przez frontend';
  assert.equal((await client.request('/auth/logout', { method: 'POST', body: {} })).status, 204);
  assert.equal((await client.request('/auth/me', { cookieOverride: authenticatedCookie })).status, 401);
  console.log('OK: wylogowanie przez Vite usuwa sesję w Oracle.');
} catch (error) {
  console.error(`Test integracji nie powiódł się: ${step}${error.code ? ` (${error.code})` : ''}.`);
  if (error.code === 'ERR_ASSERTION') console.error(error.message);
  process.exitCode = 1;
} finally {
  await vite?.close();
  if (backendServer) await new Promise((resolve) => backendServer.close(resolve));
  if (database) {
    try {
      for (const id of sessions) await database.destroySession(id);
      await database.execute('DELETE FROM tickets WHERE client_id IN (SELECT id FROM users WHERE email IN (:clientEmail, :otherEmail))', { clientEmail, otherEmail }, { autoCommit: true });
      await database.execute('DELETE FROM users WHERE email IN (:clientEmail, :staffEmail, :otherEmail)', { clientEmail, staffEmail, otherEmail }, { autoCommit: true });
      console.log('Usunięto wyłącznie zgłoszenia, konta i sesje utworzone przez ten test.');
    } catch (error) {
      console.error(`Sprzątanie danych testowych nie powiodło się (${error.code || 'INTERNAL_ERROR'}).`);
      process.exitCode = 1;
    }
    await database.close();
  }
}
if (!process.exitCode) console.log('Integracja frontend → backend → Oracle działa poprawnie (test HTTP, bez przeglądarki).');
