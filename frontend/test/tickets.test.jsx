import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.jsx';
import { ApiError } from '../src/api.js';

const account = { id: 1, fullName: 'Jan Klient', email: 'jan@example.com', role: 'CLIENT' };
const categories = [{ id: 1, name: 'Laptop', description: 'Problemy z laptopami' }];
const initial = { id: 7, title: 'Laptop nie uruchamia się', description: 'Po podłączeniu zasilacza ekran pozostaje czarny.', categoryId: 1, categoryName: 'Laptop', clientId: 1, clientName: account.fullName,
  assignedTo: null, assignedName: null, status: 'NEW', createdAt: '2026-10-12T10:00:00.123456Z', updatedAt: '2026-10-12T10:00:00.123456Z', revision: '2026-10-12T10:00:00.123456Z' };
const page = (data = [initial], total = data.length, current = 1) => ({ data, pagination: { page: current, pageSize: 10, total, totalPages: Math.ceil(total / 10) } });
function fakeClient(role = 'CLIENT') {
  return {
    me: vi.fn(async () => ({ ...account, role })), categories: vi.fn(async () => categories), summary: vi.fn(async () => ({ clients: 1, tickets: 1 })),
    ticket: vi.fn(async () => initial), tickets: vi.fn(async () => page()), staffUsers: vi.fn(async () => [{ id: 1, fullName: 'Jan Pracownik' }]),
    createTicket: vi.fn(async (form) => ({ ...initial, ...form })), updateTicket: vi.fn(async (id, form) => ({ ...initial, ...form, revision: '2026-10-12T11:00:00.123456Z' })),
    deleteTicket: vi.fn(async () => null), logout: vi.fn(), resetSession: vi.fn(),
  };
}
function open(client, route) { window.location.hash = route; render(<App client={client} />); }

test('Nowe zgłoszenie sprawdza pola i po zapisie otwiera rzeczywiste szczegóły', async () => {
  const client = fakeClient(); const user = userEvent.setup(); open(client, '/tickets/new');
  await screen.findByLabelText('Tytuł zgłoszenia');
  await user.click(screen.getByRole('button', { name: 'Wyślij zgłoszenie' }));
  expect(screen.getByText('Tytuł powinien mieć od 3 do 200 znaków.')).toBeTruthy();
  expect(client.createTicket).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Tytuł zgłoszenia')).toBe(document.activeElement);
  await user.type(screen.getByLabelText('Tytuł zgłoszenia'), initial.title);
  await user.selectOptions(screen.getByLabelText('Kategoria sprzętu'), '1');
  await user.type(screen.getByLabelText('Opis problemu'), initial.description);
  await user.click(screen.getByRole('button', { name: 'Wyślij zgłoszenie' }));
  await screen.findByRole('heading', { name: initial.title });
  expect(client.createTicket).toHaveBeenCalledWith({ title: initial.title, categoryId: 1, description: initial.description });
  expect(screen.getByRole('status').textContent).toContain('Zgłoszenie zostało dodane');
  expect(window.location.hash).toBe('#/tickets/7');
});

test('Awaria zapisu nie usuwa wpisanego opisu; formularz można wysłać ponownie', async () => {
  const client = fakeClient(); client.createTicket.mockRejectedValueOnce(new ApiError('Baza jest niedostępna.', 503));
  const user = userEvent.setup(); open(client, '/tickets/new');
  await screen.findByLabelText('Tytuł zgłoszenia');
  await user.type(screen.getByLabelText('Tytuł zgłoszenia'), initial.title);
  await user.selectOptions(screen.getByLabelText('Kategoria sprzętu'), '1');
  await user.type(screen.getByLabelText('Opis problemu'), initial.description);
  await user.click(screen.getByRole('button', { name: 'Wyślij zgłoszenie' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Baza jest niedostępna.');
  expect(screen.getByLabelText('Opis problemu').value).toBe(initial.description);
  expect(screen.getByRole('button', { name: 'Wyślij zgłoszenie' }).disabled).toBe(false);
});

test('Filtry trafiają do API, zmiana filtra wraca na stronę 1, a pusty wynik jest czytelny', async () => {
  const client = fakeClient(); client.tickets.mockResolvedValueOnce(page([initial], 12));
  const user = userEvent.setup(); open(client, '/tickets');
  await screen.findByRole('heading', { name: initial.title });
  await user.click(screen.getByRole('button', { name: 'Następna' }));
  await waitFor(() => expect(client.tickets.mock.lastCall[0].page).toBe(2));
  await user.selectOptions(screen.getByLabelText('Status'), 'CLOSED');
  await user.type(screen.getByLabelText('Szukaj zgłoszenia'), 'drukarka');
  client.tickets.mockResolvedValueOnce(page([]));
  await user.click(screen.getByRole('button', { name: 'Filtruj' }));
  await screen.findByRole('heading', { name: 'Brak zgłoszeń do wyświetlenia' });
  expect(client.tickets.mock.lastCall[0]).toMatchObject({ page: 1, search: 'drukarka', status: 'CLOSED' });
  await user.click(screen.getByRole('button', { name: 'Wyczyść filtry' }));
  await screen.findByRole('heading', { name: initial.title });
  expect(client.tickets.mock.lastCall[0]).toMatchObject({ search: '', status: '', page: 1 });
});

test('Edycja zachowuje szkic przy zmianie fokusu i konflikcie; odświeżenie pokazuje blokadę obsługi', async () => {
  const client = fakeClient(); const user = userEvent.setup(); open(client, '/tickets/7');
  await screen.findByRole('heading', { name: initial.title });
  await user.click(screen.getByRole('button', { name: 'Edytuj zgłoszenie' }));
  await user.type(screen.getByLabelText('Opis problemu'), ' Dodatkowy objaw.');
  fireEvent(window, new Event('focus'));
  await waitFor(() => expect(client.me.mock.calls.length).toBeGreaterThan(2));
  expect(screen.getByLabelText('Opis problemu').value).toContain('Dodatkowy objaw.');
  client.updateTicket.mockRejectedValueOnce(new ApiError('Zgłoszenie zostało zmienione.', 409, 'TICKET_CHANGED'));
  await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Opis problemu').value).toContain('Dodatkowy objaw.');
  expect(client.updateTicket.mock.lastCall[1].revision).toBe(initial.revision);
  client.ticket.mockResolvedValueOnce({ ...initial, status: 'IN_PROGRESS', assignedTo: 2, assignedName: 'Anna Pracownik' });
  await user.click(screen.getByRole('button', { name: 'Pobierz aktualne zgłoszenie' }));
  await screen.findByText('Serwis rozpoczął obsługę. Zgłoszenie jest dostępne do odczytu.');
  expect(screen.queryByRole('button', { name: 'Edytuj zgłoszenie' })).toBeNull();
});

test('Usunięcie wymaga potwierdzenia; anulowanie nie wysyła żądania, a sukces wraca do listy', async () => {
  const client = fakeClient(); client.tickets.mockResolvedValue(page([]));
  const user = userEvent.setup(); open(client, '/tickets/7');
  await screen.findByRole('heading', { name: initial.title });
  await user.click(screen.getByRole('button', { name: 'Usuń zgłoszenie' }));
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Zachowaj zgłoszenie' })).toBe(document.activeElement);
  await user.click(screen.getByRole('button', { name: 'Zachowaj zgłoszenie' }));
  expect(client.deleteTicket).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Usuń zgłoszenie' }));
  await user.click(screen.getByRole('button', { name: 'Potwierdź usunięcie' }));
  await screen.findByRole('heading', { name: 'Brak zgłoszeń do wyświetlenia' });
  expect(client.deleteTicket).toHaveBeenCalledWith(7, initial.revision);
  expect(screen.getByRole('status').textContent).toContain('Zgłoszenie zostało usunięte');
});

test('Pracownik przypisuje obsługę, rozpoczyna ją i zamyka; zamknięcie usuwa formularz zmian', async () => {
  const client = fakeClient('STAFF'); const user = userEvent.setup(); open(client, '/tickets/7');
  await screen.findByLabelText('Pracownik prowadzący');
  expect(screen.queryByRole('button', { name: 'Usuń zgłoszenie' })).toBeNull();
  await user.selectOptions(screen.getByLabelText('Status zgłoszenia'), 'IN_PROGRESS');
  await user.click(screen.getByRole('button', { name: 'Zapisz obsługę' }));
  expect(screen.getByRole('alert').textContent).toContain('Wybierz pracownika');
  expect(client.updateTicket).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Przypisz do mnie' }));
  await user.click(screen.getByRole('button', { name: 'Zapisz obsługę' }));
  await screen.findByRole('status');
  expect(client.updateTicket).toHaveBeenCalledWith(7, { assignedTo: 1, status: 'IN_PROGRESS', revision: initial.revision });
  await user.selectOptions(screen.getByLabelText('Status zgłoszenia'), 'CLOSED');
  await user.click(screen.getByRole('button', { name: 'Zapisz obsługę' }));
  await screen.findByText('Obsługa została zakończona. Zgłoszenie jest dostępne do odczytu.');
  expect(screen.queryByLabelText('Status zgłoszenia')).toBeNull();
});

test('Wygaśnięcie sesji na liście wraca do logowania zamiast pokazywać pustą listę', async () => {
  const client = fakeClient(); client.tickets.mockRejectedValueOnce(new ApiError('Zaloguj się', 401, 'AUTH_REQUIRED'));
  open(client, '/tickets');
  await screen.findByRole('heading', { name: 'Zaloguj się' });
  expect(client.resetSession).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('status').textContent).toContain('Twoja sesja wygasła');
});
