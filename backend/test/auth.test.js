import assert from 'node:assert/strict';
import test from 'node:test';
import { browserClient, testServer } from './helpers.js';
import { hashPassword } from '../src/passwords.js';

const form = { fullName: 'Jan Testowy', email: 'JAN@EXAMPLE.COM', password: 'Moje haslo testowe 123' };

test('Rejestracja, logowanie, zmiana ID sesji, profil i unieważnienie starego cookie po wylogowaniu', async (t) => {
  const { url, database } = await testServer(t);
  const client = browserClient(url);
  assert.equal((await client.request('/api/auth/me')).status, 401);
  const initialized = await client.initialize();
  assert.equal(initialized.status, 200);
  assert.match(initialized.headers.get('set-cookie'), /HttpOnly/);
  assert.match(initialized.headers.get('set-cookie'), /SameSite=Lax/);
  const anonymousCookie = client.cookie;
  const registered = await client.request('/api/auth/register', { method: 'POST', body: form });
  assert.equal(registered.status, 201);
  assert.deepEqual(registered.data.user, { id: 1, fullName: 'Jan Testowy', email: 'jan@example.com', role: 'CLIENT' });
  assert.match(database.users.get(1).passwordHash, /^\$scrypt\$/);
  assert.equal((await client.request('/api/auth/me')).status, 401);
  assert.equal((await client.request('/api/auth/register', { method: 'POST', body: form })).status, 409);
  const login = await client.request('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } });
  assert.equal(login.status, 200);
  assert.notEqual(client.cookie, anonymousCookie);
  assert.equal((await client.request('/api/auth/me')).status, 200);
  assert.equal((await client.request('/api/staff/summary')).status, 403);
  const authenticatedCookie = client.cookie;
  assert.equal((await client.request('/api/auth/logout', { method: 'POST' })).status, 204);
  assert.equal((await client.request('/api/auth/me', { cookieOverride: authenticatedCookie })).status, 401);
  assert.equal((await client.request('/api/auth/me', { cookieOverride: anonymousCookie })).status, 401);
});

test('Rejestracja nie pozwala nadać roli, a zapisy wymagają tokenu CSRF', async (t) => {
  const { url, database } = await testServer(t);
  const client = browserClient(url);
  assert.equal((await client.request('/api/auth/register', { method: 'POST', body: form })).data.error, 'CSRF_INVALID');
  await client.initialize();
  assert.equal((await client.request('/api/auth/register', { method: 'POST', body: { ...form, role: 'STAFF' } })).status, 400);
  assert.equal((await client.request('/api/auth/register', { method: 'POST', body: form, csrf: false })).status, 403);
  assert.equal(database.users.size, 0);
  assert.equal((await client.request('/api/auth/logout', { method: 'POST', csrf: false })).status, 403);
});

test('Nieznane konto i błędne hasło dają ten sam komunikat; limit blokuje dalsze próby', async (t) => {
  const { url, database } = await testServer(t, undefined, { rateLimitMax: 2 });
  await database.createUser({ fullName: form.fullName, email: 'jan@example.com', passwordHash: await hashPassword(form.password), role: 'CLIENT' });
  const client = browserClient(url);
  await client.initialize();
  const wrong = await client.request('/api/auth/login', { method: 'POST', body: { email: form.email, password: 'Inne haslo testowe 123' } });
  const unknown = await client.request('/api/auth/login', { method: 'POST', body: { email: 'unknown@example.com', password: form.password } });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong.data, unknown.data);
  assert.equal((await client.request('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } })).status, 429);
});

test('Pracownik ma dostęp do podsumowania, a zmiana roli i usunięcie konta są uwzględniane w aktywnej sesji', async (t) => {
  const { url, database } = await testServer(t);
  const user = await database.createUser({ fullName: form.fullName, email: 'jan@example.com', passwordHash: await hashPassword(form.password), role: 'STAFF' });
  const client = browserClient(url);
  await client.initialize();
  assert.equal((await client.request('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } })).status, 200);
  const summary = await client.request('/api/staff/summary');
  assert.equal(summary.status, 200);
  assert.deepEqual(summary.data, { data: { clients: 0, tickets: 0 } });
  database.users.get(user.id).role = 'CLIENT';
  assert.equal((await client.request('/api/staff/summary')).status, 403);
  database.users.delete(user.id);
  assert.equal((await client.request('/api/auth/me')).status, 401);
});

test('Nieprawidłowy JSON i za duże żądanie są odrzucane', async (t) => {
  const { url } = await testServer(t);
  const client = browserClient(url);
  assert.equal((await client.request('/api/auth/register', { method: 'POST', raw: '{broken' })).status, 400);
  assert.equal((await client.request('/api/auth/register', { method: 'POST', body: { ...form, fullName: 'A'.repeat(17000) } })).status, 413);
});

test('Awaria zapisu sesji nie zwraca udanego logowania ani szczegółów Oracle', async (t) => {
  const failingStore = { get: (id, cb) => cb(null, null), set: (id, value, cb) => cb(Object.assign(new Error('SECRET'), { code: 'ORA-01017' })) };
  const { url, logs, store } = await testServer(t);
  store.set = failingStore.set;
  const response = await browserClient(url).initialize();
  assert.equal(response.status, 503);
  assert.equal(response.data.error, 'DATABASE_UNAVAILABLE');
  assert.doesNotMatch(JSON.stringify(logs), /SECRET/);
});

test('Token CSRF zmienia się po logowaniu, a sesja wygasa po upływie czasu', async (t) => {
  const { url, database, store } = await testServer(t);
  await database.createUser({ fullName: form.fullName, email: 'jan@example.com', passwordHash: await hashPassword(form.password), role: 'CLIENT' });
  const client = browserClient(url);
  await client.initialize();
  const oldToken = client.token;
  await client.request('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } });
  assert.notEqual(client.token, oldToken);
  const stale = await fetch(`${url}/api/auth/logout`, { method: 'POST', headers: { Cookie: client.cookie, 'X-CSRF-Token': oldToken } });
  assert.equal(stale.status, 403);
  const id = decodeURIComponent(client.cookie.split('=')[1]).slice(2).split('.')[0];
  const stored = JSON.parse(store.sessions[id]);
  stored.cookie.expires = new Date(Date.now() - 1000).toISOString();
  store.sessions[id] = JSON.stringify(stored);
  assert.equal((await client.request('/api/auth/me')).status, 401);
});

test('W trybie produkcyjnym cookie ma Secure przy połączeniu HTTPS przez zadeklarowane proxy', async (t) => {
  const { url } = await testServer(t, undefined, { secureCookies: true, trustProxy: 1 });
  const response = await fetch(`${url}/api/auth/csrf`, { headers: { 'X-Forwarded-Proto': 'https' } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /; Secure/);
});
