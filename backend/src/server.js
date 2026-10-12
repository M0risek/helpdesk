import { once } from 'node:events';
import { createApp } from './app.js';
import { readConfig } from './config.js';
import { createDatabase } from './database.js';

let database;
let server;
let stopping = false;

async function stop() {
  if (stopping) return;
  stopping = true;
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  if (database) await database.close();
}

try {
  const config = readConfig();
  database = await createDatabase(config.database);
  await database.verifySchema();
  await database.verifyAuthSchema();
  server = createApp(database, console, config.auth).listen(config.port, config.host);
  await once(server, 'listening');
  console.log(`HelpDesk API działa: http://localhost:${config.port}/api/health`);
  console.log(`Kategorie z Oracle: http://localhost:${config.port}/api/categories`);
  console.log('Zatrzymanie serwera: Ctrl+C.');

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (stopping) return;
      const timeout = setTimeout(() => {
        console.error('Przekroczono czas zamykania serwera.');
        process.exit(1);
      }, 10000);
      timeout.unref();
      stop().then(() => {
        clearTimeout(timeout);
        process.exit(0);
      }).catch(() => {
        console.error('Nie udało się poprawnie zamknąć połączeń.');
        process.exit(1);
      });
    });
  }
} catch (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('Port jest zajęty. Zatrzymaj drugi serwer albo zmień PORT w backend/.env.');
  } else if (error.code) {
    console.error(`Nie udało się uruchomić API (${error.code}). Sprawdź dane w backend/.env i działanie Oracle.`);
  } else {
    console.error(error.message);
  }
  await stop().catch(() => console.error('Nie udało się zamknąć połączenia z Oracle.'));
  process.exitCode = 1;
}
