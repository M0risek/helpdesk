import { HttpError } from './errors.js';

export const ticketStatuses = ['NEW', 'IN_PROGRESS', 'CLOSED'];
const invalid = (message) => new HttpError(400, 'INVALID_TICKET', message);

export function positiveId(value, label = 'Identyfikator') {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw invalid(`${label} jest nieprawidłowy.`);
  return Number(value);
}

function object(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !fields.includes(key))) {
    throw invalid('Formularz zawiera nieprawidłowe pola.');
  }
}

function text(value, min, max, label) {
  if (typeof value !== 'string') throw invalid(`${label} jest wymagany.`);
  const trimmed = value.trim();
  const length = [...trimmed].length;
  if (length < min || length > max) throw invalid(`${label}: wpisz od ${min} do ${max} znaków.`);
  return trimmed;
}

function revision(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value)) throw invalid('Odśwież zgłoszenie przed zapisaniem zmian.');
  return value;
}

export function validateTicket(body, editing = false) {
  object(body, ['title', 'description', 'categoryId', ...(editing ? ['revision'] : [])]);
  return {
    title: text(body.title, 3, 200, 'Tytuł'),
    description: text(body.description, 10, 5000, 'Opis'),
    categoryId: positiveId(body.categoryId, 'Kategoria'),
    ...(editing ? { revision: revision(body.revision) } : {}),
  };
}

export function validateManagement(body) {
  object(body, ['assignedTo', 'status', 'revision']);
  if (!ticketStatuses.includes(body.status)) throw invalid('Wybierz poprawny status.');
  const assignedTo = body.assignedTo === null ? null : positiveId(body.assignedTo, 'Pracownik');
  if (body.status !== 'NEW' && assignedTo === null) throw invalid('Przypisz pracownika przed rozpoczęciem obsługi.');
  return { assignedTo, status: body.status, revision: revision(body.revision) };
}

export function validateDeletion(body) {
  object(body, ['revision']);
  return revision(body.revision);
}

export function validateFilters(query) {
  object(query, ['status', 'categoryId', 'search', 'page', 'pageSize', 'assignment']);
  if (query.status && !ticketStatuses.includes(query.status)) throw invalid('Nieprawidłowy filtr statusu.');
  if (query.assignment && !['all', 'mine', 'unassigned'].includes(query.assignment)) throw invalid('Nieprawidłowy filtr pracownika.');
  if (query.search !== undefined && (typeof query.search !== 'string' || [...query.search].length > 100)) throw invalid('Wyszukiwanie może mieć do 100 znaków.');
  const page = query.page === undefined ? 1 : positiveId(query.page, 'Numer strony');
  const pageSize = query.pageSize === undefined ? 10 : positiveId(query.pageSize, 'Rozmiar strony');
  if (page > 100000 || pageSize > 50) throw invalid('Nieprawidłowy rozmiar strony.');
  return { status: query.status || null, categoryId: query.categoryId ? positiveId(query.categoryId, 'Kategoria') : null,
    search: query.search?.trim() || null, assignment: query.assignment || 'all', page, pageSize };
}

export function checkTicketChange(ticket, user, expectedRevision, management) {
  if (!ticket || (user.role !== 'STAFF' && ticket.clientId !== user.id)) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Nie znaleziono zgłoszenia.');
  if (ticket.revision !== expectedRevision) throw new HttpError(409, 'TICKET_CHANGED', 'Zgłoszenie zostało zmienione. Odśwież dane przed kolejną zmianą.');
  if (user.role === 'CLIENT' && ticket.status !== 'NEW') throw new HttpError(409, 'TICKET_LOCKED', 'Możesz zmieniać i usuwać tylko nowe zgłoszenia.');
  if (management) {
    if (ticket.status === 'CLOSED') throw new HttpError(409, 'TICKET_CLOSED', 'Zamknięte zgłoszenie jest dostępne tylko do odczytu.');
    const allowed = ticket.status === 'NEW' ? ['NEW', 'IN_PROGRESS'] : ['IN_PROGRESS', 'CLOSED'];
    if (!allowed.includes(management.status)) throw invalid('Kolejność obsługi: Nowe → W trakcie → Zamknięte.');
  }
}
