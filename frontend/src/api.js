export class ApiError extends Error {
  constructor(message, status = 0, code = 'NETWORK_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function createApi(fetchRequest = (...args) => fetch(...args)) {
  let csrfToken;
  let pendingCsrf;

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetchRequest(`/api${path}`, { credentials: 'same-origin', ...options });
    } catch {
      throw new ApiError('Nie udało się połączyć z serwisem. Spróbuj ponownie.');
    }
    if (response.status === 204) return null;
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError('Serwis jest chwilowo niedostępny. Spróbuj ponownie.', response.status, 'INVALID_RESPONSE');
    }
    if (!response.ok) throw new ApiError(data.message || 'Nie udało się wykonać operacji.', response.status, data.error);
    return data;
  }

  async function getCsrf() {
    if (csrfToken) return csrfToken;
    if (!pendingCsrf) {
      pendingCsrf = request('/auth/csrf').then((data) => {
        csrfToken = data.csrfToken;
        return csrfToken;
      }).finally(() => { pendingCsrf = undefined; });
    }
    return pendingCsrf;
  }

  async function post(path, body) {
    const token = await getCsrf();
    try {
      return await request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify(body ?? {}),
      });
    } catch (error) {
      if (error.code === 'CSRF_INVALID') {
        csrfToken = undefined;
        throw new ApiError('Sesja formularza wygasła. Wyślij formularz ponownie.', error.status, error.code);
      }
      throw error;
    }
  }

  return {
    me: async () => (await request('/auth/me')).user,
    categories: async () => (await request('/categories')).data,
    summary: async () => (await request('/staff/summary')).data,
    register: async (form) => (await post('/auth/register', form)).user,
    async login(form) {
      const data = await post('/auth/login', form);
      csrfToken = data.csrfToken;
      return data.user;
    },
    async logout() {
      await post('/auth/logout');
      csrfToken = undefined;
    },
    resetSession() { csrfToken = undefined; },
  };
}

export const api = createApi();
