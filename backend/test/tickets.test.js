import assert from 'node:assert/strict';
import test from 'node:test';
import { checkTicketChange, positiveId, validateTicket, validateManagement, validateDeletion, validateFilters } from '../src/ticket-rules.js';
import { testServer, browserClient } from './helpers.js';
import { hashPassword } from '../src/passwords.js';

const revision = '2026-10-12T10:00:00.123456Z';
const form = { title: 'Laptop nie działa', categoryId: 1, description: 'Laptop nie uruchamia się po podłączeniu zasilania.' };
const clientUser = { id: 1, role: 'CLIENT' };
const staffUser = { id: 2, role: 'STAFF' };
const ticket = { clientId: 1, status: 'NEW', assignedTo: null, revision };
const errorCode = (code) => (error) => error.code === code;

test('Dane zgłoszenia są przycinane i sprawdzane; klient nie nada właściciela ani statusu', () => {
  assert.deepEqual(validateTicket({ ...form, title: '  Laptop nie działa  ', categoryId: '1' }), form);
  for (const extra of [{ clientId: 2 }, { assignedTo: 2 }, { status: 'CLOSED' }, { revision }]) {
    assert.throws(() => validateTicket({ ...form, ...extra }), errorCode('INVALID_TICKET'));
  }
  for (const body of [null, [], { ...form, title: 'ab' }, { ...form, description: 'krótki' }, { ...form, description: 'x'.repeat(5001) }, { ...form, categoryId: -1 }]) {
    assert.throws(() => validateTicket(body), errorCode('INVALID_TICKET'));
  }
  assert.equal(validateTicket({ ...form, revision }, true).revision, revision);
  assert.throws(() => validateTicket(form, true), errorCode('INVALID_TICKET'));
});

test('Filtry i identyfikatory odrzucają niepoprawne rozmiary, tablice i fragmenty SQL', () => {
  assert.equal(validateFilters({ status: 'NEW', page: '2', pageSize: '20' }).page, 2);
  assert.equal(validateFilters({ search: "' OR 1=1 --" }).search, "' OR 1=1 --");
  for (const input of [{ pageSize: '51' }, { page: '0' }, { page: '100001' }, { categoryId: '1 OR 1=1' }, { status: ['NEW', 'CLOSED'] }, { search: ['a', 'b'] }, { assignment: 'everyone' }, { sort: 'DROP TABLE users' }]) {
    assert.throws(() => validateFilters(input), errorCode('INVALID_TICKET'));
  }
  for (const id of ['1;DELETE', '1.5', '9007199254740992', '-1', '0']) assert.throws(() => positiveId(id), errorCode('INVALID_TICKET'));
});

test('Zapis i usunięcie wymagają aktualnej wersji; cudze zgłoszenie pozostaje niewidoczne', () => {
  checkTicketChange(ticket, clientUser, revision);
  assert.throws(() => checkTicketChange(ticket, { id: 3, role: 'CLIENT' }, revision), errorCode('TICKET_NOT_FOUND'));
  assert.throws(() => checkTicketChange(null, staffUser, revision), errorCode('TICKET_NOT_FOUND'));
  assert.throws(() => checkTicketChange(ticket, clientUser, '2026-10-12T10:00:00.111111Z'), errorCode('TICKET_CHANGED'));
  assert.throws(() => checkTicketChange({ ...ticket, status: 'IN_PROGRESS' }, clientUser, revision), errorCode('TICKET_LOCKED'));
  assert.equal(validateDeletion({ revision }), revision);
  assert.throws(() => validateDeletion({ revision, status: 'NEW' }), errorCode('INVALID_TICKET'));
});

test('Pracownik musi być przypisany przy obsłudze; statusy idą kolejno, a zamknięcie jest końcowe', () => {
  const changes = { assignedTo: 2, status: 'IN_PROGRESS', revision };
  assert.deepEqual(validateManagement(changes), changes);
  assert.throws(() => validateManagement({ ...changes, assignedTo: null }), errorCode('INVALID_TICKET'));
  assert.throws(() => validateManagement({ ...changes, title: 'nowy tytuł' }), errorCode('INVALID_TICKET'));
  checkTicketChange(ticket, staffUser, revision, changes);
  assert.throws(() => checkTicketChange(ticket, staffUser, revision, { ...changes, status: 'CLOSED' }), errorCode('INVALID_TICKET'));
  assert.throws(() => checkTicketChange({ ...ticket, status: 'IN_PROGRESS' }, staffUser, revision, { ...changes, status: 'NEW' }), errorCode('INVALID_TICKET'));
  checkTicketChange({ ...ticket, status: 'IN_PROGRESS' }, staffUser, revision, { ...changes, status: 'CLOSED' });
  assert.throws(() => checkTicketChange({ ...ticket, status: 'CLOSED' }, staffUser, revision, changes), errorCode('TICKET_CLOSED'));
});

async function loggedIn(server, role = 'CLIENT') {
  const password = 'Hasło testu zgłoszeń 123';
  const account = await server.database.createUser({ fullName: 'Test zgłoszeń', email: `${role.toLowerCase()}@example.invalid`, passwordHash: await hashPassword(password), role });
  const browser = browserClient(server.url);
  await browser.initialize();
  assert.equal((await browser.request('/api/auth/login', { method: 'POST', body: { email: account.email, password } })).status, 200);
  return { browser, account };
}

test('API wymaga sesji i CSRF; identyfikator klienta pochodzi z sesji', async (t) => {
  const server = await testServer(t);
  let saved;
  server.database.createTicket = async (user, data) => { saved = { user, data }; return { id: 7, ...data, clientId: user.id, status: 'NEW', revision }; };
  assert.equal((await browserClient(server.url).request('/api/tickets')).status, 401);
  const { browser, account } = await loggedIn(server);
  assert.equal((await browser.request('/api/tickets', { method: 'POST', body: form, csrf: false })).status, 403);
  assert.equal((await browser.request('/api/tickets', { method: 'POST', body: { ...form, clientId: 999 } })).status, 400);
  assert.equal(saved, undefined);
  const created = await browser.request('/api/tickets', { method: 'POST', body: form });
  assert.equal(created.status, 201);
  assert.equal(created.headers.get('location'), '/api/tickets/7');
  assert.equal(created.headers.get('cache-control'), 'no-store');
  assert.equal(saved.user.id, account.id);
  assert.deepEqual(saved.data, form);
});

test('API przekazuje rolę do odczytu i zapisu, odrzuca pola obsługi klienta oraz zwraca 404 bez wycieku', async (t) => {
  const server = await testServer(t);
  const { browser, account } = await loggedIn(server);
  let changes;
  server.database.getTicket = async (id, user) => id === 7 && user.id === account.id ? { id, ...form, revision } : null;
  server.database.updateTicket = async (id, user, data) => { changes = { id, user, data }; return { id, ...data }; };
  assert.equal((await browser.request('/api/tickets/99')).data.error, 'TICKET_NOT_FOUND');
  assert.equal((await browser.request('/api/tickets/nope')).status, 400);
  assert.equal((await browser.request('/api/staff/users')).status, 403);
  assert.equal((await browser.request('/api/tickets/7', { method: 'PATCH', body: { assignedTo: 2, status: 'CLOSED', revision } })).status, 400);
  assert.equal(changes, undefined);
  assert.equal((await browser.request('/api/tickets/7', { method: 'PATCH', body: { ...form, revision } })).status, 200);
  assert.equal(changes.user.role, 'CLIENT');
  assert.deepEqual(changes.data, { ...form, revision });
  assert.equal((await browser.request('/api/tickets/7', { method: 'DELETE', body: { revision }, csrf: false })).status, 403);
});

test('API pracownika udostępnia pracowników i obsługę, ale blokuje tworzenie oraz usuwanie zgłoszeń', async (t) => {
  const server = await testServer(t);
  const { browser, account } = await loggedIn(server, 'STAFF');
  server.database.getStaffUsers = async () => [{ id: account.id, fullName: account.fullName }];
  let changed;
  server.database.updateTicket = async (id, user, data) => { changed = { id, role: user.role, ...data }; return changed; };
  assert.equal((await browser.request('/api/staff/users')).status, 200);
  assert.equal((await browser.request('/api/tickets', { method: 'POST', body: form })).status, 403);
  assert.equal((await browser.request('/api/tickets/7', { method: 'DELETE', body: { revision } })).status, 403);
  assert.equal((await browser.request('/api/tickets/7', { method: 'PATCH', body: { assignedTo: account.id, status: 'IN_PROGRESS', revision } })).status, 200);
  assert.equal(changed.role, 'STAFF');
  server.database.users.get(account.id).role = 'CLIENT';
  assert.equal((await browser.request('/api/staff/users')).status, 403);
  assert.equal((await browser.request('/api/tickets/7', { method: 'PATCH', body: { assignedTo: account.id, status: 'CLOSED', revision } })).status, 400);
});
