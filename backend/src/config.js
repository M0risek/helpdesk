export function readConfig(env = process.env) {
  for (const name of ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING', 'SESSION_SECRET']) {
    if (typeof env[name] !== 'string' || !env[name].trim()) {
      throw new Error(`Uzupełnij ${name} w pliku backend/.env.`);
    }
  }

  if (env.SESSION_SECRET.trim().length < 32) {
    throw new Error('SESSION_SECRET musi mieć przynajmniej 32 znaki. Uruchom npm.cmd run auth:setup.');
  }
  const trustProxy = Number(env.TRUST_PROXY ?? 0);
  if (![0, 1].includes(trustProxy)) {
    throw new Error('TRUST_PROXY musi mieć wartość 0 lub 1.');
  }
  if (!['development', 'test', 'production'].includes(env.NODE_ENV ?? 'development')) {
    throw new Error('NODE_ENV musi mieć wartość development, test lub production.');
  }

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT musi być liczbą całkowitą od 1 do 65535.');
  }

  return {
    host: env.HOST?.trim() || '127.0.0.1',
    port,
    auth: {
      secret: env.SESSION_SECRET,
      secureCookies: env.NODE_ENV === 'production',
      trustProxy,
    },
    database: {
      user: env.DB_USER.trim(),
      password: env.DB_PASSWORD,
      connectString: env.DB_CONNECT_STRING.trim(),
    },
  };
}
