import { readConfig } from '../src/config.js';
import { createDatabase } from '../src/database.js';

let database;
try {
  const config = readConfig();
  database = await createDatabase(config.database);
  await database.checkConnection();
  const tables = await database.verifySchema();
  const categories = await database.getCategories();
  console.log(JSON.stringify({ status: 'ok', tables, categoriesCount: categories.length }, null, 2));
} catch (error) {
  if (error.code) {
    console.error(`Połączenie z Oracle nie powiodło się (${error.code}). Sprawdź backend/.env i działanie bazy.`);
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
} finally {
  if (database) {
    await database.close().catch(() => {
      console.error('Nie udało się zamknąć połączenia z Oracle.');
      process.exitCode = 1;
    });
  }
}
