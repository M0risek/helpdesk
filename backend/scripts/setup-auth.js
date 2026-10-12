import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const envPath = new URL('../.env', import.meta.url);
let contents;
try {
  contents = await readFile(envPath, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  contents = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
}
if (!parseEnv(contents).SESSION_SECRET?.trim()) {
  const line = `SESSION_SECRET="${randomBytes(32).toString('hex')}"`;
  contents = /^[ \t]*SESSION_SECRET[ \t]*=.*$/m.test(contents)
    ? contents.replace(/^[ \t]*SESSION_SECRET[ \t]*=.*$/m, line)
    : `${contents.trimEnd()}\n${line}\n`;
  await writeFile(envPath, contents, 'utf8');
  console.log('Wygenerowano lokalny klucz sesji w backend/.env. Hasło Oracle pozostawiono bez zmian.');
} else {
  console.log('Klucz sesji jest już ustawiony.');
}
