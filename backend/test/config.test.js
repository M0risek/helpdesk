import assert from 'node:assert/strict';
import test from 'node:test';
import { readConfig } from '../src/config.js';

const environment = {
  DB_USER: 'HELPDESK',
  DB_PASSWORD: ' test-password ',
  DB_CONNECT_STRING: 'localhost:1521/FREEPDB1',
};

test('Konfiguracja zachowuje hasło bez zmieniania jego znaków', () => {
  const config = readConfig(environment);
  assert.equal(config.database.password, ' test-password ');
  assert.equal(config.port, 3000);
  assert.equal(config.host, '127.0.0.1');
});

test('Brak wymaganych danych jest wykrywany przed próbą połączenia z Oracle', () => {
  for (const name of ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING']) {
    assert.throws(() => readConfig({ ...environment, [name]: '' }), new RegExp(name));
  }
});

test('Nieprawidłowy port jest odrzucany', () => {
  for (const port of ['abc', '', '0', '1.5', '65536']) {
    assert.throws(() => readConfig({ ...environment, PORT: port }), /PORT/);
  }
});

test('Port z konfiguracji jest używany przez serwer', () => {
  assert.equal(readConfig({ ...environment, PORT: '3100' }).port, 3100);
});
