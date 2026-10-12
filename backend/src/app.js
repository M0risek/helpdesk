import express from 'express';
import session from 'express-session';
import { randomBytes } from 'node:crypto';
import { createAuthRouter, requireUser, requireStaff } from './auth.js';
import { HttpError } from './errors.js';
import { OracleSessionStore, SESSION_COOKIE, SESSION_DURATION_MS } from './session-store.js';
import { createTicketsRouter } from './tickets.js';

export function createApp(database, logger = console, options = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (options.trustProxy) app.set('trust proxy', options.trustProxy);
  app.use('/api/tickets', express.json({ limit: '32kb' }));
  app.use(express.json({ limit: '16kb' }));

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

  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: options.secureCookies ?? false, path: '/' };
  app.use(['/api/auth', '/api/staff', '/api/tickets'], session({
    name: SESSION_COOKIE,
    secret: options.secret ?? randomBytes(32).toString('hex'),
    store: options.sessionStore ?? new OracleSessionStore(database),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { ...cookieOptions, maxAge: SESSION_DURATION_MS },
  }));
  app.use('/api/auth', createAuthRouter(database, cookieOptions, options));
  app.use('/api/tickets', createTicketsRouter(database));
  app.get('/api/staff/users', requireUser(database), requireStaff, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ data: await database.getStaffUsers() });
  });
  app.get('/api/staff/summary', requireUser(database), requireStaff, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ data: await database.getStaffSummary() });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Nie znaleziono takiego adresu API.' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.code, message: error.message });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'INVALID_JSON', message: 'Nieprawidłowy format JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'BODY_TOO_LARGE', message: 'Formularz jest zbyt duży.' });
    const databaseError = /^(ORA|NJS|DPI)-/.test(error.code ?? '');
    logger.error('Błąd API:', error.code || 'INTERNAL_ERROR');
    res.status(databaseError ? 503 : 500).json({
      error: databaseError ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_ERROR',
      message: databaseError ? 'Baza danych jest chwilowo niedostępna.' : 'Nie udało się wykonać operacji.',
    });
  });

  return app;
}
