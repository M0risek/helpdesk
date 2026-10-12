import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { readConfig } from '../src/config.js';
import { createDatabase } from '../src/database.js';
import { hashPassword } from '../src/passwords.js';
import { validateCredentials } from '../src/validation.js';
import { HttpError } from '../src/errors.js';

let database;
let input;
let muted = false;
try {
  if (!process.stdin.isTTY) throw new Error('Uruchom to polecenie w interaktywnym terminalu VS Code.');
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    },
  });
  input = createInterface({ input: process.stdin, output, terminal: true });
  const fullName = await input.question('Imię i nazwisko pracownika: ');
  const email = await input.question('E-mail pracownika: ');
  process.stdout.write('Hasło (12–128 znaków; znaki są ukryte): ');
  muted = true;
  const password = await input.question('');
  muted = false;
  process.stdout.write('\nPowtórz hasło: ');
  muted = true;
  const repeated = await input.question('');
  muted = false;
  process.stdout.write('\n');
  if (password !== repeated) throw new Error('Hasła nie są identyczne. Konto nie zostało utworzone.');
  const credentials = validateCredentials({ fullName, email, password }, true);
  database = await createDatabase(readConfig().database);
  await database.verifySchema();
  await database.createUser({
    fullName: credentials.fullName,
    email: credentials.email,
    passwordHash: await hashPassword(credentials.password),
    role: 'STAFF',
  });
  console.log('Utworzono konto pracownika (STAFF). Można się nim zalogować w aplikacji.');
} catch (error) {
  muted = false;
  process.stderr.write('\n');
  console.error(error.errorNum === 1 ? 'Ten e-mail jest już zajęty. Nie zmieniono istniejącego konta.'
    : error instanceof HttpError ? error.message : error.code ? `Nie udało się utworzyć konta (${error.code}).` : error.message);
  process.exitCode = 1;
} finally {
  input?.close();
  await database?.close();
}
