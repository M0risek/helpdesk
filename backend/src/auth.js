import { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { HttpError } from './errors.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { validateCredentials } from './validation.js';
import { SESSION_COOKIE } from './session-store.js';

const csrfToken = () => randomBytes(32).toString('hex');
const sessionAction = (req, action) => new Promise((resolve, reject) => {
  req.session[action]((error) => error ? reject(error) : resolve());
});
const publicUser = ({ id, fullName, email, role }) => ({ id, fullName, email, role });

export function requireCsrf(req, res, next) {
  const expected = req.session.csrfToken;
  const provided = req.get('X-CSRF-Token');
  if (typeof expected !== 'string' || !/^[a-f0-9]{64}$/.test(expected) || typeof provided !== 'string' || !/^[a-f0-9]{64}$/.test(provided) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
    return next(new HttpError(403, 'CSRF_INVALID', 'Odśwież formularz i spróbuj ponownie.'));
  }
  next();
}

export function requireUser(database) {
  return async (req, res, next) => {
    const user = req.session.userId ? await database.findUserById(req.session.userId) : null;
    if (!user) throw new HttpError(401, 'AUTH_REQUIRED', 'Zaloguj się, aby skorzystać z tej funkcji.');
    req.user = publicUser(user);
    next();
  };
}

export function requireStaff(req, res, next) {
  if (req.user.role !== 'STAFF') return next(new HttpError(403, 'FORBIDDEN', 'Ta funkcja jest dostępna dla pracowników.'));
  next();
}

export function createAuthRouter(database, cookieOptions, { rateLimitMax = 20 } = {}) {
  const router = Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const attempts = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: rateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'TOO_MANY_ATTEMPTS', message: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.' },
  });

  router.get('/csrf', async (req, res) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = csrfToken();
      await sessionAction(req, 'save');
    }
    res.json({ csrfToken: req.session.csrfToken });
  });

  router.post('/register', attempts, requireCsrf, async (req, res) => {
    const { fullName, email, password } = validateCredentials(req.body, true);
    const passwordHash = await hashPassword(password);
    try {
      const user = await database.createUser({ fullName, email, passwordHash, role: 'CLIENT' });
      res.status(201).json({ user: publicUser(user) });
    } catch (error) {
      if (error.errorNum === 1) throw new HttpError(409, 'EMAIL_EXISTS', 'Konto z tym adresem e-mail już istnieje.');
      throw error;
    }
  });

  router.post('/login', attempts, requireCsrf, async (req, res) => {
    const { email, password } = validateCredentials(req.body);
    const user = await database.findUserByEmail(email);
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!user || !valid) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Nieprawidłowy e-mail lub hasło.');
    await sessionAction(req, 'regenerate');
    req.session.userId = user.id;
    req.session.csrfToken = csrfToken();
    await sessionAction(req, 'save');
    res.json({ user: publicUser(user), csrfToken: req.session.csrfToken });
  });

  router.get('/me', requireUser(database), (req, res) => res.json({ user: req.user }));

  router.post('/logout', requireCsrf, async (req, res) => {
    await sessionAction(req, 'destroy');
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.sendStatus(204);
  });
  return router;
}
