import assert from 'node:assert/strict';
import test from 'node:test';
import { promisify } from 'node:util';
import { OracleSessionStore } from '../src/session-store.js';

test('Magazyn Oracle przekazuje dane sesji, czas wygaśnięcia i osobne operacje odnowienia/usunięcia', async () => {
  const calls = [];
  const data = { userId: 7, cookie: { expires: new Date(Date.now() + 60000) } };
  const store = new OracleSessionStore({
    async getSession(id) { calls.push(['get', id]); return data; },
    async setSession(...args) { calls.push(['set', ...args]); },
    async touchSession(...args) { calls.push(['touch', ...args]); },
    async destroySession(id) { calls.push(['destroy', id]); },
  });
  assert.equal(await promisify(store.get.bind(store))('test-id'), data);
  await promisify(store.set.bind(store))('test-id', data);
  await promisify(store.touch.bind(store))('test-id', data);
  await promisify(store.destroy.bind(store))('test-id');
  assert.deepEqual(calls.map((call) => call[0]), ['get', 'set', 'touch', 'destroy']);
  assert.ok(calls[1][3] > 0 && calls[1][3] <= 60);
  assert.equal(store.ttl({ cookie: { expires: new Date(Date.now() - 1000) } }), 0);
});

test('Błąd Oracle jest przekazywany do obsługi błędów Express', async () => {
  const error = Object.assign(new Error('private'), { code: 'ORA-01017' });
  const store = new OracleSessionStore({ getSession: async () => { throw error; } });
  await assert.rejects(promisify(store.get.bind(store))('test-id'), { code: 'ORA-01017' });
});
