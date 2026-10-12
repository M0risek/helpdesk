import { expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.jsx';
import { ApiError } from '../src/api.js';

const clientUser = { id: 1, fullName: 'Jan Kowalski', email: 'jan@example.com', role: 'CLIENT' };
const staffUser = { id: 2, fullName: 'Anna Serwisowa', email: 'anna@example.com', role: 'STAFF' };
const categories = [
  { id: 1, name: 'Laptop', description: 'Problemy z laptopami' },
  { id: 2, name: 'Drukarka', description: 'Problemy z drukarkami' },
  { id: 3, name: 'Komputer stacjonarny', description: 'Problemy z komputerami stacjonarnymi' },
  { id: 4, name: 'Inne', description: 'Pozostałe problemy ze sprzętem' },
];

function fakeClient(initialUser = null) {
  let current = initialUser;
  return {
    me: vi.fn(async () => {
      if (!current) throw new ApiError('Zaloguj się', 401, 'AUTH_REQUIRED');
      return current;
    }),
    categories: vi.fn(async () => categories),
    summary: vi.fn(async () => ({ clients: 3, tickets: 5 })),
    register: vi.fn(async () => clientUser),
    login: vi.fn(async () => { current = clientUser; return current; }),
    logout: vi.fn(async () => { current = null; }),
    resetSession: vi.fn(),
  };
}

async function fillLogin(user) {
  await user.type(screen.getByLabelText('Adres e-mail'), 'jan@example.com');
  await user.type(screen.getByLabelText('Hasło', { exact: true }), 'Przykladowe haslo 123');
}

test('Rejestracja sprawdza powtórzone hasło, wysyła tylko wymagane pola i kieruje do logowania', async () => {
  const client = fakeClient();
  const user = userEvent.setup();
  window.location.hash = '/register';
  render(<App client={client} />);
  await screen.findByRole('heading', { name: 'Utwórz swoje konto' });
  await user.type(screen.getByLabelText('Imię i nazwisko'), 'Jan Kowalski');
  await fillLogin(user);
  await user.type(screen.getByLabelText('Powtórz hasło'), 'inne haslo 123');
  await user.click(screen.getByRole('button', { name: 'Utwórz konto' }));
  expect(screen.getByText('Wpisane hasła muszą być identyczne.')).toBeTruthy();
  expect(client.register).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Powtórz hasło'));
  await user.type(screen.getByLabelText('Powtórz hasło'), 'Przykladowe haslo 123');
  await user.click(screen.getByRole('button', { name: 'Utwórz konto' }));
  await screen.findByRole('heading', { name: 'Zaloguj się' });
  expect(screen.getByRole('status').textContent).toContain('Konto zostało utworzone');
  expect(client.register).toHaveBeenCalledWith({ fullName: 'Jan Kowalski', email: 'jan@example.com', password: 'Przykladowe haslo 123' });
});

test('Niepoprawne pola blokują wysłanie i kierują fokus do pierwszego błędu', async () => {
  const client = fakeClient();
  const user = userEvent.setup();
  render(<App client={client} />);
  await screen.findByRole('heading', { name: 'Zaloguj się' });
  await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));
  expect(screen.getByText('Podaj poprawny adres e-mail.')).toBeTruthy();
  expect(screen.getByLabelText('Adres e-mail')).toBe(document.activeElement);
  expect(client.login).not.toHaveBeenCalled();
});

test('Błąd logowania jest widoczny; poprawna próba otwiera panel klienta, a wylogowanie wraca do formularza', async () => {
  const client = fakeClient();
  client.login.mockRejectedValueOnce(new ApiError('Nieprawidłowy e-mail lub hasło.', 401, 'INVALID_CREDENTIALS'));
  const user = userEvent.setup();
  render(<App client={client} />);
  await screen.findByRole('heading', { name: 'Zaloguj się' });
  await fillLogin(user);
  await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Nieprawidłowy e-mail lub hasło.');
  await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));
  await screen.findByRole('heading', { name: 'Cześć, Jan!' });
  await screen.findByRole('heading', { name: 'Laptop' });
  expect(client.summary).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Wyloguj się' }));
  await screen.findByRole('heading', { name: 'Zaloguj się' });
  expect(screen.getByRole('status').textContent).toContain('Zostałeś wylogowany.');
});

test('Po odświeżeniu sesja pracownika jest odtwarzana i widoczne są rzeczywiste liczniki API', async () => {
  const client = fakeClient(staffUser);
  window.location.hash = '/dashboard';
  render(<App client={client} />);
  await screen.findByText('Wszystkie zgłoszenia w serwisie');
  const main = within(screen.getByRole('main'));
  expect(main.getByText('3')).toBeTruthy();
  expect(main.getByText('5')).toBeTruthy();
  expect(main.getByText('Panel pracownika')).toBeTruthy();
  expect(client.login).not.toHaveBeenCalled();
  expect(client.summary).toHaveBeenCalledTimes(1);
});

test('Kategorie można filtrować; pusty wynik ma działający przycisk wyczyszczenia', async () => {
  const client = fakeClient(clientUser);
  const user = userEvent.setup();
  window.location.hash = '/categories';
  render(<App client={client} />);
  await screen.findByRole('heading', { name: 'Laptop' });
  await user.type(screen.getByLabelText('Znajdź kategorię'), 'druk');
  expect(screen.getByRole('heading', { name: 'Drukarka' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Laptop' })).toBeNull();
  await user.clear(screen.getByLabelText('Znajdź kategorię'));
  await user.type(screen.getByLabelText('Znajdź kategorię'), 'nieistniejący sprzęt');
  expect(screen.getByRole('heading', { name: 'Brak pasujących kategorii' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Wyczyść wyszukiwanie' }));
  expect(screen.getByRole('heading', { name: 'Laptop' })).toBeTruthy();
});

test('Wygaśnięcie sesji podczas odświeżania usuwa panel i prosi o ponowne logowanie', async () => {
  const client = fakeClient(clientUser);
  const user = userEvent.setup();
  window.location.hash = '/dashboard';
  render(<App client={client} />);
  await screen.findByRole('heading', { name: 'Laptop' });
  client.me.mockRejectedValueOnce(new ApiError('Zaloguj się', 401, 'AUTH_REQUIRED'));
  await user.click(screen.getByRole('button', { name: 'Odśwież dane' }));
  await screen.findByRole('heading', { name: 'Zaloguj się' });
  expect(screen.getByRole('status').textContent).toContain('Twoja sesja wygasła');
  expect(client.resetSession).toHaveBeenCalledTimes(1);
});

test('Awaria API ma przycisk ponowienia; po błędzie wylogowania sesja pozostaje widoczna', async () => {
  const client = fakeClient(clientUser);
  client.me.mockRejectedValueOnce(new ApiError('Serwis jest niedostępny', 503));
  const user = userEvent.setup();
  render(<App client={client} />);
  expect((await screen.findByRole('alert')).textContent).toBe('Serwis jest niedostępny');
  await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
  await screen.findByRole('heading', { name: 'Laptop' });
  client.logout.mockRejectedValueOnce(new ApiError('Wylogowanie nie powiodło się', 503));
  await user.click(screen.getByRole('button', { name: 'Wyloguj się' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Wylogowanie nie powiodło się');
  expect(screen.getByRole('heading', { name: 'Cześć, Jan!' })).toBeTruthy();
});

test('Przy niedostępnych danych panel nie wyświetla zmyślonych liczników i pozwala ponowić pobranie', async () => {
  const client = fakeClient(staffUser);
  client.summary.mockRejectedValueOnce(new ApiError('Baza danych jest chwilowo niedostępna.', 503));
  const user = userEvent.setup();
  window.location.hash = '/dashboard';
  render(<App client={client} />);
  await screen.findByRole('alert');
  expect(screen.queryByText('Wszystkie zgłoszenia w serwisie')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
  await screen.findByText('Wszystkie zgłoszenia w serwisie');
});

test('Moje konto pokazuje profil; niezalogowany użytkownik chronionego adresu trafia na logowanie', async () => {
  const client = fakeClient(clientUser);
  const user = userEvent.setup();
  window.location.hash = '/account';
  render(<App client={client} />);
  await screen.findByText('Adres e-mail');
  expect(screen.getByText('jan@example.com')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Wyloguj się' }));
  await screen.findByRole('heading', { name: 'Zaloguj się' });
  window.location.hash = '/account';
  await waitFor(() => expect(window.location.hash).toBe('#/login'));
});
