import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { api } from './api.js';
import { AuthForm } from './components/AuthForm.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Brand } from './components/Brand.jsx';

function subscribeRoute(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
const currentRoute = () => window.location.hash.slice(1) || '/login';
const navigate = (route) => { window.location.hash = route; };

export function App({ client = api }) {
  const route = useSyncExternalStore(subscribeRoute, currentRoute);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');
  const [connectionError, setConnectionError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('checking');
    client.me().then((savedUser) => {
      if (active) { setUser(savedUser); setStatus('ready'); }
    }).catch((error) => {
      if (!active) return;
      if (error.status === 401) { setUser(null); setStatus('ready'); }
      else { setConnectionError(error.message); setStatus('unavailable'); }
    });
    return () => { active = false; };
  }, [client, attempt]);

  useEffect(() => {
    if (status !== 'ready') return;
    if (user && ['/login', '/register'].includes(route)) navigate('/dashboard');
    else if (!user && !['/login', '/register'].includes(route)) navigate('/login');
  }, [route, status, user]);

  useEffect(() => {
    if (status !== 'ready') return;
    const titles = { '/login': 'Logowanie', '/register': 'Rejestracja', '/dashboard': 'Pulpit', '/categories': 'Kategorie wsparcia', '/account': 'Moje konto' };
    document.title = `${route.startsWith('/tickets') ? route === '/tickets/new' ? 'Nowe zgłoszenie' : 'Zgłoszenia' : titles[route] ?? 'Panel'} — HelpDesk`;
    document.getElementById('main-content')?.focus();
  }, [route, status]);

  const sessionExpired = useCallback(() => {
    client.resetSession();
    setUser(null);
    setNotice('Twoja sesja wygasła. Zaloguj się ponownie.');
    navigate('/login');
  }, [client]);

  if (status !== 'ready') return <main className="connection-screen" id="main-content"><Brand /><div className="connection-card">
    {status === 'checking' ? <><span className="spinner-border" aria-hidden="true" /><h1>Otwieramy Twój panel…</h1><p role="status">Sprawdzanie sesji</p></> : <><span className="eyebrow">Połączenie z serwisem</span><h1>Spróbujmy jeszcze raz</h1><p role="alert">{connectionError}</p><button className="btn btn-primary" onClick={() => setAttempt((value) => value + 1)}>Spróbuj ponownie</button></>}
  </div></main>;

  return <><a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Przejdź do treści</a>
    {user ? <Dashboard user={user} client={client} route={route} onSessionExpired={sessionExpired}
      onUserChanged={setUser} onLoggedOut={() => { setUser(null); setNotice('Zostałeś wylogowany.'); navigate('/login'); }} />
      : <AuthForm key={route === '/register' ? 'register' : 'login'} mode={route === '/register' ? 'register' : 'login'} client={client} notice={notice}
        onLogin={(savedUser) => { setUser(savedUser); setNotice(''); navigate('/dashboard'); }}
        onRegistered={() => { setNotice('Konto zostało utworzone. Teraz możesz się zalogować.'); navigate('/login'); }} />}
  </>;
}
