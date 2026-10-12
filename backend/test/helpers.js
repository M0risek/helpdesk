import { once } from 'node:events';
import session from 'express-session';
import { createApp } from '../src/app.js';

export function fakeDatabase() {
  const users = new Map();
  let nextId = 1;
  return {
    users,
    async createUser(user) {
      if ([...users.values()].some((value) => value.email === user.email)) {
        throw Object.assign(new Error('DUPLICATE'), { errorNum: 1, code: 'ORA-00001' });
      }
      const saved = { ...user, id: nextId++ };
      users.set(saved.id, saved);
      return saved;
    },
    async findUserByEmail(email) { return [...users.values()].find((value) => value.email === email) ?? null; },
    async findUserById(id) { return users.get(id) ?? null; },
    async getStaffSummary() { return { clients: [...users.values()].filter((user) => user.role === 'CLIENT').length, tickets: 0 }; },
  };
}

export async function testServer(t, database = fakeDatabase(), options = {}) {
  const logs = [];
  const store = new session.MemoryStore();
  const server = createApp(database, { error: (...args) => logs.push(args) }, {
    secret: 'test-secret-with-at-least-32-characters', sessionStore: store, ...options,
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  return { url: `http://127.0.0.1:${server.address().port}`, database, logs, store };
}

export function browserClient(url) {
  let cookie = '';
  let token = '';
  return {
    get cookie() { return cookie; },
    get token() { return token; },
    async request(path, { method = 'GET', body, csrf = true, raw, cookieOverride } = {}) {
      const headers = {};
      if (cookieOverride ?? cookie) headers.Cookie = cookieOverride ?? cookie;
      if (csrf && token) headers['X-CSRF-Token'] = token;
      if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetch(`${url}${path}`, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      const data = response.status === 204 ? null : await response.json();
      if (data?.csrfToken) token = data.csrfToken;
      return { status: response.status, data, headers: response.headers };
    },
    async initialize() { return this.request('/api/auth/csrf'); },
  };
}
