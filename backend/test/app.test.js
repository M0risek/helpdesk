import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/app.js';

async function startTestServer(t, database) {
  const logs = [];
  const logger = { error: (...args) => logs.push(args) };
  const server = createApp(database, logger).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  return { url: `http://127.0.0.1:${server.address().port}`, logs };
}

test('Kontrola serwera działa niezależnie od dostępności bazy', async (t) => {
  const { url } = await startTestServer(t, {
    checkConnection: async () => { throw new Error('Baza niedostępna'); },
  });
  const response = await fetch(`${url}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'helpdesk-api' });
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('Kontrola bazy potwierdza wykonanie sprawdzenia połączenia', async (t) => {
  let checked = false;
  const { url } = await startTestServer(t, {
    checkConnection: async () => { checked = true; },
  });
  const response = await fetch(`${url}/api/health/database`);
  assert.equal(response.status, 200);
  assert.equal(checked, true);
  assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' });
});

test('API zwraca kategorie dostarczone przez warstwę bazy danych', async (t) => {
  const categories = [
    { id: 9, name: 'Kategoria testowa', description: 'Opis testowy' },
    { id: 15, name: 'Pozostałe', description: null },
  ];
  const { url } = await startTestServer(t, {
    getCategories: async () => categories,
  });
  const response = await fetch(`${url}/api/categories`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: categories });
});

test('Awaria bazy zwraca 503 bez ujawniania szczegółów połączenia', async (t) => {
  const privateMessage = 'Prywatne dane połączenia: TEST_SECRET';
  const error = Object.assign(new Error(privateMessage), { code: 'ORA-01017' });
  const { url, logs } = await startTestServer(t, {
    checkConnection: async () => { throw error; },
    getCategories: async () => { throw error; },
  });
  for (const path of ['/api/health/database', '/api/categories']) {
    const response = await fetch(`${url}${path}`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'DATABASE_UNAVAILABLE',
      message: 'Baza danych jest chwilowo niedostępna.',
    });
  }
  assert.doesNotMatch(JSON.stringify(logs), /TEST_SECRET/);
});

test('Nieistniejąca trasa zwraca 404 w formacie JSON', async (t) => {
  const { url } = await startTestServer(t, {});
  const response = await fetch(`${url}/api/nieistniejaca-trasa`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'NOT_FOUND');
});
