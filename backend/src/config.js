export function readConfig(env = process.env) {
  for (const name of ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING']) {
    if (typeof env[name] !== 'string' || !env[name].trim()) {
      throw new Error(`Uzupełnij ${name} w pliku backend/.env.`);
    }
  }

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT musi być liczbą całkowitą od 1 do 65535.');
  }

  return {
    host: env.HOST?.trim() || '127.0.0.1',
    port,
    database: {
      user: env.DB_USER.trim(),
      password: env.DB_PASSWORD,
      connectString: env.DB_CONNECT_STRING.trim(),
    },
  };
}
