import { Router } from 'express';
import { requireCsrf, requireUser } from './auth.js';
import { HttpError } from './errors.js';
import { positiveId, validateTicket, validateManagement, validateDeletion, validateFilters } from './ticket-rules.js';

export function createTicketsRouter(database) {
  const router = Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, requireUser(database));
  router.get('/', async (req, res) => res.json(await database.listTickets(req.user, validateFilters(req.query))));
  router.get('/:id', async (req, res) => {
    const ticket = await database.getTicket(positiveId(req.params.id), req.user);
    if (!ticket) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Nie znaleziono zgłoszenia.');
    res.json({ data: ticket });
  });
  router.post('/', requireCsrf, async (req, res) => {
    if (req.user.role !== 'CLIENT') throw new HttpError(403, 'FORBIDDEN', 'Zgłoszenia mogą tworzyć klienci.');
    const ticket = await database.createTicket(req.user, validateTicket(req.body));
    res.status(201).location(`/api/tickets/${ticket.id}`).json({ data: ticket });
  });
  router.patch('/:id', requireCsrf, async (req, res) => {
    const changes = req.user.role === 'STAFF' ? validateManagement(req.body) : validateTicket(req.body, true);
    res.json({ data: await database.updateTicket(positiveId(req.params.id), req.user, changes) });
  });
  router.delete('/:id', requireCsrf, async (req, res) => {
    if (req.user.role !== 'CLIENT') throw new HttpError(403, 'FORBIDDEN', 'Zgłoszenie może usunąć jego klient, dopóki ma status Nowe.');
    await database.deleteTicket(positiveId(req.params.id), req.user, validateDeletion(req.body));
    res.sendStatus(204);
  });
  return router;
}
