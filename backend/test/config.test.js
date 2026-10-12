import assert from 'node:assert/strict';
import test from 'node:test';
import { readConfig } from '../src/config.js';

const environment = {
  DB_USER: 'HELPDESK',
  DB_PASSWORD: ' test-password ',
  DB_CONNECT_STRING: 'localhost:1521/FREEPDB1',
  SESSION_SECRET: 'test-secret-with-at-least-32-characters',
};

test('Konfiguracja zachowuje hasło bez zmieniania jego znaków', () => {
  const config = readConfig(environment);
  assert.equal(config.database.password, ' test-password ');
  assert.equal(config.port, 3000);
  assert.equal(config.host, '127.0.0.1');
});

test('Brak wymaganych danych jest wykrywany przed próbą połączenia z Oracle', () => {
  for (const name of ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING', 'SESSION_SECRET']) {
    assert.throws(() => readConfig({ ...environment, [name]: '' }), new RegExp(name));
  }
});

test('Klucz sesji, ciasteczka HTTPS i konfiguracja proxy są weryfikowane', () => {
  assert.throws(() => readConfig({ ...environment, SESSION_SECRET: 'short' }), /SESSION_SECRET/);
  assert.throws(() => readConfig({ ...environment, TRUST_PROXY: 'true' }), /TRUST_PROXY/);
  assert.throws(() => readConfig({ ...environment, NODE_ENV: 'prod' }), /NODE_ENV/);
  assert.equal(readConfig({ ...environment, NODE_ENV: 'production', TRUST_PROXY: '1' }).auth.secureCookies, true);
  assert.equal(readConfig(environment).auth.secureCookies, false);
});

test('Nieprawidłowy port jest odrzucany', () => {
  for (const port of ['abc', '', '0', '1.5', '65536']) {
    assert.throws(() => readConfig({ ...environment, PORT: port }), /PORT/);
  }
});

test('Port z konfiguracji jest używany przez serwer', () => {
  assert.equal(readConfig({ ...environment, PORT: '3100' }).port, 3100);
});
