import session from 'express-session';

export const SESSION_DURATION_MS = 60 * 60 * 1000;
export const SESSION_COOKIE = 'helpdesk.sid';

export class OracleSessionStore extends session.Store {
  constructor(database) {
    super();
    this.database = database;
  }

  get(id, callback) {
    this.database.getSession(id).then((data) => callback(null, data), callback);
  }

  set(id, data, callback) {
    this.database.setSession(id, data, this.ttl(data)).then(() => callback?.(), callback);
  }

  destroy(id, callback) {
    this.database.destroySession(id).then(() => callback?.(), callback);
  }

  touch(id, data, callback) {
    this.database.touchSession(id, data, this.ttl(data)).then(() => callback?.(), callback);
  }

  ttl(data) {
    const expires = data.cookie?.expires ? new Date(data.cookie.expires).getTime() : Date.now() + SESSION_DURATION_MS;
    return Math.max(0, Math.ceil((expires - Date.now()) / 1000));
  }
}
