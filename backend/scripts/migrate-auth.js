import { readFile } from 'node:fs/promises';
import { readConfig } from '../src/config.js';
import { createDatabase } from '../src/database.js';

let database;
try {
  database = await createDatabase(readConfig().database);
  await database.verifySchema();
  const { rows } = await database.execute('SELECT USER AS username FROM dual');
  if (rows[0].USERNAME !== 'HELPDESK') throw new Error('Migracja wymaga połączenia jako HELPDESK.');
  const sql = await readFile(new URL('../../database/04_auth_sessions.sql', import.meta.url), 'utf8');
  const statements = sql.split(';').map((part) => part.trim()).filter(Boolean);
  for (const statement of statements) {
    const table = statement.startsWith('CREATE TABLE');
    const objectName = table ? 'AUTH_SESSIONS' : 'IDX_AUTH_SESSIONS_EXPIRY';
    const objectType = table ? 'TABLE' : 'INDEX';
    const existing = await database.execute(`
      SELECT object_name FROM user_objects WHERE object_name = :name AND object_type = :type
    `, { name: objectName, type: objectType });
    if (existing.rows.length) {
      console.log(`${objectName}: już istnieje.`);
    } else {
      await database.execute(statement);
      console.log(`${objectName}: utworzono.`);
    }
  }
  await database.verifyAuthSchema();
  console.log('Migracja sesji zakończona.');
} catch (error) {
  console.error(error.code ? `Migracja nie powiodła się (${error.code}).` : error.message);
  process.exitCode = 1;
} finally {
  await database?.close();
}
