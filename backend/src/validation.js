import { HttpError } from './errors.js';

function invalid(message) {
  throw new HttpError(400, 'INVALID_INPUT', message);
}

export function validateCredentials(body, registration = false) {
  const allowed = registration ? ['fullName', 'email', 'password'] : ['email', 'password'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key))) {
    invalid('Prześlij tylko wymagane pola formularza.');
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    invalid('Podaj poprawny adres e-mail (maksymalnie 254 znaki).');
  }
  if (typeof body.password !== 'string' || [...body.password].length < 12 || [...body.password].length > 128 || !body.password.trim()) {
    invalid('Hasło musi mieć od 12 do 128 znaków.');
  }
  const result = { email, password: body.password };
  if (registration) {
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    if ([...fullName].length < 2 || [...fullName].length > 120) {
      invalid('Imię i nazwisko musi mieć od 2 do 120 znaków.');
    }
    result.fullName = fullName;
  }
  return result;
}
