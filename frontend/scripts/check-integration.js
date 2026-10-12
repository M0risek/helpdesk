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
    async request(path, { method = 'GET', body, cookieOverride } = {}) {
      const headers = {};
      if (cookieOverride ?? cookie) headers.Cookie = cookieOverride ?? cookie;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (token) headers['X-CSRF-Token'] = token;
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
  await database.createUser({ fullName: 'Pracownik testu frontendu', email: staffEmail, passwordHash: await hashPassword(password), role: 'STAFF' });
  const staff = browserSession(origin);
  await staff.request('/auth/csrf');
  assert.equal((await staff.request('/auth/login', { method: 'POST', body: { email: staffEmail, password } })).status, 200);
  const summary = await staff.request('/staff/summary');
  assert.equal(summary.status, 200);
  assert.deepEqual(summary.data.data, { clients: baseline.clients + 1, tickets: baseline.tickets });
  assert.equal((await staff.request('/auth/logout', { method: 'POST', body: {} })).status, 204);
  console.log('OK: panel pracownika otrzymuje rzeczywiste liczniki z Oracle.');

  step = 'wylogowanie przez frontend';
  assert.equal((await client.request('/auth/logout', { method: 'POST', body: {} })).status, 204);
  assert.equal((await client.request('/auth/me', { cookieOverride: authenticatedCookie })).status, 401);
  console.log('OK: wylogowanie przez Vite usuwa sesję w Oracle.');
} catch (error) {
  console.error(`Test integracji nie powiódł się: ${step}${error.code ? ` (${error.code})` : ''}.`);
  process.exitCode = 1;
} finally {
  await vite?.close();
  if (backendServer) await new Promise((resolve) => backendServer.close(resolve));
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
if (!process.exitCode) console.log('Integracja frontend → backend → Oracle działa poprawnie (test HTTP, bez przeglądarki).');
