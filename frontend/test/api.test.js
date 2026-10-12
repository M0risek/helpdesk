import { expect, test, vi } from 'vitest';
import { ApiError, createApi } from '../src/api.js';

const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('Formularz przesyła cookie i token CSRF; po logowaniu używa nowego tokenu do wylogowania', async () => {
  const fetchRequest = vi.fn()
    .mockResolvedValueOnce(response({ csrfToken: 'initial-token' }))
    .mockResolvedValueOnce(response({ user: { id: 1, role: 'CLIENT' }, csrfToken: 'rotated-token' }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const client = createApi(fetchRequest);
  const credentials = { email: 'jan@example.com', password: 'Przykladowe haslo 123' };
  expect((await client.login(credentials)).role).toBe('CLIENT');
  await client.logout();
  expect(fetchRequest).toHaveBeenCalledTimes(3);
  expect(fetchRequest.mock.calls[1][1].credentials).toBe('same-origin');
  expect(fetchRequest.mock.calls[1][1].headers['X-CSRF-Token']).toBe('initial-token');
  expect(JSON.parse(fetchRequest.mock.calls[1][1].body)).toEqual(credentials);
  expect(fetchRequest.mock.calls[2][1].headers['X-CSRF-Token']).toBe('rotated-token');
  expect(window.localStorage.length).toBe(0);
  expect(window.sessionStorage.length).toBe(0);
});

test('Wygaśnięcie tokenu nie ponawia automatycznie zapisu; następna próba pobiera nowy token', async () => {
  const fetchRequest = vi.fn()
    .mockResolvedValueOnce(response({ csrfToken: 'expired-token' }))
    .mockResolvedValueOnce(response({ error: 'CSRF_INVALID', message: 'Błędny token' }, 403))
    .mockResolvedValueOnce(response({ csrfToken: 'fresh-token' }))
    .mockResolvedValueOnce(response({ user: { id: 1 } }, 201));
  const client = createApi(fetchRequest);
  await expect(client.register({})).rejects.toMatchObject({ code: 'CSRF_INVALID' });
  expect(fetchRequest).toHaveBeenCalledTimes(2);
  await client.register({});
  expect(fetchRequest.mock.calls[3][1].headers['X-CSRF-Token']).toBe('fresh-token');
});

test('Błędy HTTP zachowują kod i komunikat, a brak serwera lub niepoprawna odpowiedź dają czytelny błąd', async () => {
  const client = createApi(vi.fn().mockResolvedValue(response({ error: 'AUTH_REQUIRED', message: 'Zaloguj się' }, 401)));
  await expect(client.me()).rejects.toMatchObject({ status: 401, code: 'AUTH_REQUIRED', message: 'Zaloguj się' });
  await expect(createApi(vi.fn().mockRejectedValue(new Error('private network data'))).me()).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  await expect(createApi(vi.fn().mockResolvedValue(new Response('<html>Error</html>', { status: 502 }))).me()).rejects.toBeInstanceOf(ApiError);
});
