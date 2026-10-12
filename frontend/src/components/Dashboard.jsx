import { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';
import { Brand } from './Brand.jsx';
import { TicketWorkspace } from './Tickets.jsx';

const sections = [
  { route: '/dashboard', label: 'Pulpit', icon: 'home' },
  { route: '/tickets', label: 'Zgłoszenia', icon: 'ticket' },
  { route: '/categories', label: 'Kategorie wsparcia', icon: 'grid' },
  { route: '/account', label: 'Moje konto', icon: 'user' },
];
const categoryIcon = (name) => name.toLowerCase().includes('laptop') ? 'laptop' : name.toLowerCase().includes('drukar') ? 'printer' : name.toLowerCase().includes('komputer') ? 'monitor' : 'tools';
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const searchable = (value) => value.toLocaleLowerCase('pl').normalize('NFD').replace(/\p{Diacritic}/gu, '');

function CategoryCards({ categories }) {
  return <div className="category-grid">{categories.map((category) => <article className="category-card" key={category.id}>
    <span className="category-symbol"><Icon name={categoryIcon(category.name)} size={27} /></span>
    <h3>{category.name}</h3><p>{category.description || 'Wsparcie serwisu w tej kategorii.'}</p>
  </article>)}</div>;
}

function Metric({ icon, label, value, hint }) {
  return <article className="metric-card"><div className="metric-heading"><span>{label}</span><Icon name={icon} /></div><strong className="metric-value">{value}</strong><p>{hint}</p></article>;
}

export function Dashboard({ user, client, route, onSessionExpired, onUserChanged, onLoggedOut }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const ticketView = route === '/tickets' || route.startsWith('/tickets/');
  const activeSection = sections.find((section) => section.route === (ticketView ? '/tickets' : route)) ?? sections[0];
  const staff = user.role === 'STAFF';

  useEffect(() => {
    let active = true;
    setError('');
    setData(null);
    async function load() {
      try {
        const freshUser = await client.me();
        if (!active) return;
        onUserChanged(freshUser);
        const [categories, summary] = await Promise.all([
          client.categories(), freshUser.role === 'STAFF' ? client.summary() : Promise.resolve(null),
        ]);
        if (active) setData({ categories, summary });
      } catch (failure) {
        if (!active) return;
        if (failure.status === 401) onSessionExpired();
        else setError(failure.message);
      }
    }
    load();
    return () => { active = false; };
  }, [client, user.id, user.role, refresh, onSessionExpired, onUserChanged]);

  useEffect(() => {
    const onFocus = () => setRefresh((value) => value + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  async function logout() {
    if (busy) return;
    setBusy(true);
    setActionError('');
    try {
      await client.logout();
      onLoggedOut();
    } catch (failure) {
      if (failure.status === 401) onSessionExpired();
      else setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  const matches = data?.categories.filter((category) => searchable(`${category.name} ${category.description ?? ''}`).includes(searchable(search.trim()))) ?? [];

  return <div className="workspace">
    <aside className="sidebar">
      <Brand light />
      <p className="sidebar-caption">Twoja przestrzeń</p>
      <nav className="main-nav" aria-label="Menu główne">{sections.map((section) => <a href={`#${section.route}`} key={section.route} className={activeSection.route === section.route ? 'active' : ''} aria-current={activeSection.route === section.route ? 'page' : undefined}><Icon name={section.icon} /><span>{section.label}</span></a>)}</nav>
      <div className="sidebar-service"><span className="status-dot" /><span>Serwis komputerowy</span></div>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="avatar">{initials(user.fullName)}</span><div><strong>{user.fullName}</strong><small>{staff ? 'Pracownik serwisu' : 'Konto klienta'}</small></div></div><button className="logout-button" onClick={logout} disabled={busy}><Icon name="logout" />{busy ? 'Wylogowywanie…' : 'Wyloguj się'}</button></div>
    </aside>
    <div className="workspace-main">
      <header className="workspace-header"><span>HelpDesk <span className="breadcrumb-divider">/</span> {activeSection.label}</span><span className="role-badge"><Icon name={staff ? 'tools' : 'user'} size={15} />{staff ? 'Pracownik' : 'Klient'}</span></header>
      <main id="main-content" tabIndex={-1} className="page-content">
        <div className="page-heading"><div><span className="eyebrow">{staff ? 'Panel pracownika' : 'Panel klienta'}</span><h1>{ticketView ? route === '/tickets/new' ? 'Nowe zgłoszenie' : staff ? 'Zgłoszenia serwisowe' : 'Moje zgłoszenia' : activeSection.route === '/dashboard' ? `Cześć, ${user.fullName.trim().split(/\s+/)[0]}!` : activeSection.label}</h1><p>{ticketView ? 'Od opisu problemu do zakończonej naprawy.' : activeSection.route === '/dashboard' ? 'Dobrze Cię widzieć. Oto Twoja przestrzeń w HelpDesk.' : activeSection.route === '/categories' ? 'Sprawdź, w jakich obszarach możemy Ci pomóc.' : 'Podstawowe informacje o Twoim koncie w serwisie.'}</p></div>{!ticketView && <button className="btn btn-outline-secondary refresh-button" onClick={() => setRefresh((value) => value + 1)} disabled={!data && !error}>Odśwież dane</button>}</div>
        {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
        {ticketView ? <TicketWorkspace key={`${user.id}:${user.role}`} route={route} client={client} user={user} onSessionExpired={onSessionExpired} /> : error ? <div className="panel-state"><Icon name="monitor" size={32} /><h2>Nie udało się pobrać danych</h2><p role="alert">{error}</p><button className="btn btn-primary" onClick={() => setRefresh((value) => value + 1)}>Spróbuj ponownie</button></div>
          : !data ? <div className="panel-state"><span className="spinner-border" aria-hidden="true" /><p role="status">Wczytywanie danych Twojego panelu…</p></div>
            : activeSection.route === '/account' ? <section className="account-card"><div className="account-card-heading"><span className="avatar avatar-large">{initials(user.fullName)}</span><div><h2>{user.fullName}</h2><span className="account-role">{staff ? 'Pracownik serwisu' : 'Konto klienta'}</span></div></div><dl className="account-details"><div><dt>Imię i nazwisko</dt><dd>{user.fullName}</dd></div><div><dt>Adres e-mail</dt><dd>{user.email}</dd></div><div><dt>Typ konta</dt><dd>{staff ? 'Pracownik' : 'Klient'}</dd></div></dl><p className="account-note"><Icon name="lock" size={18} /> Dane Twojego konta są dostępne po zalogowaniu.</p></section>
              : activeSection.route === '/categories' ? <section aria-labelledby="category-list-heading"><div className="category-toolbar"><div><h2 id="category-list-heading">Obszary wsparcia</h2><p>{matches.length} z {data.categories.length} kategorii</p></div><div className="search-field"><label htmlFor="category-search">Znajdź kategorię</label><input className="form-control" id="category-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Szukaj po nazwie lub opisie" /></div></div>{matches.length ? <CategoryCards categories={matches} /> : <div className="panel-state"><Icon name="grid" size={32} /><h3>{data.categories.length ? 'Brak pasujących kategorii' : 'Brak dostępnych kategorii'}</h3><p>{data.categories.length ? 'Spróbuj wpisać inną nazwę lub wyczyść wyszukiwanie.' : 'Kategorie wsparcia pojawią się tutaj po ich dodaniu przez serwis.'}</p>{search && <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>Wyczyść wyszukiwanie</button>}</div>}</section>
                : <>
                  <section className="welcome-banner"><div><span className="eyebrow">{staff ? 'Wszystko w jednym miejscu' : 'Dostęp do serwisu'}</span><h2>{staff ? 'Twój serwis w liczbach' : 'Jak możemy Ci pomóc?'}</h2><p>{staff ? 'Sprawdź zgłoszenia klientów i aktualny postęp obsługi.' : 'Opisz problem ze sprzętem. Postęp obsługi sprawdzisz w swoich zgłoszeniach.'}</p><a href={staff ? '#/tickets' : '#/tickets/new'} className="banner-link">{staff ? 'Przejdź do zgłoszeń' : 'Dodaj zgłoszenie'} <Icon name="arrow" size={18} /></a></div><div className="banner-illustration" aria-hidden="true"><Icon name="monitor" size={86} /><span><Icon name="check" size={20} /></span></div></section>
                  <section className="metric-grid" aria-label="Podsumowanie panelu">{staff && <><Metric icon="users" label="Klienci" value={data.summary.clients} hint="Konta klientów w serwisie" /><Metric icon="ticket" label="Zgłoszenia" value={data.summary.tickets} hint="Wszystkie zgłoszenia w serwisie" /></>}<Metric icon="grid" label="Kategorie wsparcia" value={data.categories.length} hint="Dostępne obszary pomocy" />{!staff && <article className="metric-card profile-preview"><span className="metric-label">Twoje konto</span><strong>{user.fullName}</strong><p>{user.email}</p><a href="#/account">Sprawdź swoje dane <Icon name="arrow" size={16} /></a></article>}</section>
                  <section aria-labelledby="overview-categories-heading"><div className="section-heading"><div><h2 id="overview-categories-heading">W czym możemy pomóc?</h2><p>Poznaj dostępne kategorie sprzętu i zakres wsparcia.</p></div><a href="#/categories">Wszystkie kategorie <Icon name="arrow" size={16} /></a></div>{data.categories.length ? <CategoryCards categories={data.categories} /> : <p className="empty-note">Kategorie wsparcia nie zostały jeszcze dodane.</p>}</section>
                </>}
      </main>
      <footer className="workspace-footer"><strong>HelpDesk.</strong><span>Wsparcie dla Twojego sprzętu</span></footer>
    </div>
  </div>;
}
