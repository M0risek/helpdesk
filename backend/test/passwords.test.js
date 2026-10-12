import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../src/passwords.js';
import { validateCredentials } from '../src/validation.js';

test('Hasło jest haszowane z losową solą i weryfikowane bez przycinania spacji', async () => {
  const password = '  testowe hasło 123  ';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(first.length <= 255);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password.trim(), first), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, '$scrypt$32768$8$3$bad$bad'), false);
});

test('Rejestracja normalizuje e-mail, odrzuca nadanie roli i niepoprawne pola', () => {
  const form = { fullName: ' Jan Kowalski ', email: ' JAN@EXAMPLE.COM ', password: 'Dlugie haslo 123' };
  assert.equal(validateCredentials(form, true).email, 'jan@example.com');
  assert.equal(validateCredentials(form, true).fullName, 'Jan Kowalski');
  for (const body of [null, [], { ...form, role: 'STAFF' }, { ...form, password: 'short' },
    { ...form, fullName: 'A' }, { ...form, email: 'invalid' }, { ...form, password: ' '.repeat(12) }]) {
    assert.throws(() => validateCredentials(body, true), { status: 400 });
  }
});
