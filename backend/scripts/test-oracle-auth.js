import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { createDatabase } from '../src/database.js';
import { hashPassword } from '../src/passwords.js';
import { browserClient } from '../test/helpers.js';

const runId = randomUUID();
const clientEmail = `test-client-${runId}@example.invalid`;
const staffEmail = `test-staff-${runId}@example.invalid`;
const password = `Test-${randomUUID()}`;
const sessions = new Set();
const servers = [];
let database;
let step = 'konfiguracja';

function trackCookie(cookie) {
  if (!cookie) return;
  const value = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
  if (value.startsWith('s:') && value.includes('.')) sessions.add(value.slice(2, value.lastIndexOf('.')));
}

async function request(client, path, options) {
  const result = await client.request(path, options);
  trackCookie(client.cookie);
  return result;
}

async function startServer(config) {
  const server = createApp(database, console, config.auth).listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

try {
  const config = readConfig();
  if (config.auth.secureCookies) throw new Error('Test lokalny wymaga NODE_ENV=development (HTTP na 127.0.0.1).');
  database = await createDatabase(config.database);
  await database.verifySchema();
  await database.verifyAuthSchema();
  const url = await startServer(config);
  const client = browserClient(url);

  step = 'token CSRF i rejestracja klienta';
  assert.equal((await request(client, '/api/auth/csrf')).status, 200);
  const form = { fullName: 'Klient testu integracyjnego', email: clientEmail, password };
  assert.equal((await request(client, '/api/auth/register', { method: 'POST', body: form, csrf: false })).status, 403);
  assert.equal((await request(client, '/api/auth/register', { method: 'POST', body: { ...form, role: 'STAFF' } })).status, 400);
  const registered = await request(client, '/api/auth/register', { method: 'POST', body: form });
  assert.equal(registered.status, 201);
  assert.equal(registered.data.user.role, 'CLIENT');
  assert.equal((await request(client, '/api/auth/register', { method: 'POST', body: form })).status, 409);
  const saved = await database.findUserByEmail(clientEmail);
  assert.match(saved.passwordHash, /^\$scrypt\$/);
  assert.notEqual(saved.passwordHash, password);
  console.log('OK: rejestracja, walidacja roli, CSRF, unikalny e-mail i hasz hasła w Oracle.');

  step = 'logowanie i uprawnienia klienta';
  const anonymousCookie = client.cookie;
  const credentials = { email: clientEmail, password };
  assert.equal((await request(client, '/api/auth/login', { method: 'POST', body: { ...credentials, password: `${password}-wrong` } })).status, 401);
  assert.equal((await request(client, '/api/auth/login', { method: 'POST', body: credentials })).status, 200);
  assert.notEqual(client.cookie, anonymousCookie);
  assert.equal((await request(client, '/api/auth/me')).data.user.email, clientEmail);
  assert.equal((await request(client, '/api/staff/summary')).status, 403);
  console.log('OK: logowanie, nowe ID sesji, profil klienta i odmowa dostępu do panelu pracownika.');

  step = 'sesja odczytana przez drugi serwer';
  const secondUrl = await startServer(config);
  const secondClient = browserClient(secondUrl);
  assert.equal((await request(secondClient, '/api/auth/me', { cookieOverride: client.cookie })).status, 200);
  console.log('OK: drugi serwer odczytuje sesję z Oracle z tym samym kluczem.');

  step = 'konto i uprawnienia pracownika';
  await database.createUser({ fullName: 'Pracownik testu integracyjnego', email: staffEmail, passwordHash: await hashPassword(password), role: 'STAFF' });
  const staff = browserClient(url);
  await request(staff, '/api/auth/csrf');
  assert.equal((await request(staff, '/api/auth/login', { method: 'POST', body: { email: staffEmail, password } })).status, 200);
  const summary = await request(staff, '/api/staff/summary');
  assert.equal(summary.status, 200);
  assert.equal(typeof summary.data.data.tickets, 'number');
  assert.equal((await request(staff, '/api/auth/logout', { method: 'POST' })).status, 204);
  console.log('OK: pracownik może odczytać podsumowanie.');

  step = 'wylogowanie i wygaśnięcie sesji';
  const oldCookie = client.cookie;
  assert.equal((await request(client, '/api/auth/logout', { method: 'POST' })).status, 204);
  assert.equal((await request(secondClient, '/api/auth/me', { cookieOverride: oldCookie })).status, 401);
  const expiredId = `expired-${runId}`;
  sessions.add(expiredId);
  await database.setSession(expiredId, { userId: saved.id, cookie: {} }, 3600);
  await database.execute(`UPDATE auth_sessions SET expires_at = SYSTIMESTAMP - INTERVAL '1' SECOND WHERE session_id = :id`, { id: expiredId }, { autoCommit: true });
  assert.equal(await database.getSession(expiredId), null);
  await database.touchSession(expiredId, { userId: saved.id, cookie: {} }, 3600);
  assert.equal(await database.getSession(expiredId), null);
  const remaining = await database.execute('SELECT COUNT(*) AS total FROM auth_sessions WHERE session_id = :id', { id: expiredId });
  assert.equal(remaining.rows[0].TOTAL, 1);
  console.log('OK: wylogowanie unieważnia sesję także na drugim serwerze; wygasła sesja nie jest odnawiana.');
} catch (error) {
  console.error(`Test Oracle nie powiódł się: ${step}${error.code ? ` (${error.code})` : ''}.`);
  process.exitCode = 1;
} finally {
  for (const server of servers) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (database) {
    try {
      for (const id of sessions) await database.destroySession(id);
      await database.execute('DELETE FROM users WHERE email IN (:clientEmail, :staffEmail)', { clientEmail, staffEmail }, { autoCommit: true });
      console.log('Usunięto wyłącznie konta i sesje utworzone przez ten test.');
    } catch (error) {
      console.error(`Sprzątanie danych testowych nie powiodło się (${error.code || 'INTERNAL_ERROR'}).`);
      process.exitCode = 1;
    }
    await database.close();
  }
}
if (!process.exitCode) console.log('Cały test integracyjny z Oracle zakończony poprawnie.');
