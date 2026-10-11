import express from 'express';

export function createApp(database, logger = console) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'helpdesk-api' });
  });

  app.get('/api/health/database', async (req, res) => {
    await database.checkConnection();
    res.json({ status: 'ok', database: 'connected' });
  });

  app.get('/api/categories', async (req, res) => {
    const categories = await database.getCategories();
    res.json({ data: categories });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Nie znaleziono takiego adresu API.' });
  });

  app.use((error, req, res, next) => {
    logger.error('Błąd dostępu do bazy:', error.code || 'DATABASE_ERROR');
    res.status(503).json({
      error: 'DATABASE_UNAVAILABLE',
      message: 'Baza danych jest chwilowo niedostępna.',
    });
  });

  return app;
}
