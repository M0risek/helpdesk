import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';

const statuses = { NEW: 'Nowe', IN_PROGRESS: 'W trakcie', CLOSED: 'Zamknięte' };
const navigate = (path) => { window.location.hash = path; };
const date = (value) => new Intl.DateTimeFormat('pl', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export function TicketStatus({ status }) {
  return <span className={`ticket-status status-${status.toLowerCase()}`}><span />{statuses[status] ?? status}</span>;
}
function Failure({ message, retry }) {
  return <div className="panel-state"><Icon name="ticket" size={32} /><h2>Nie udało się pobrać zgłoszeń</h2><p role="alert">{message}</p><button className="btn btn-primary" onClick={retry}>Spróbuj ponownie</button></div>;
}
function Loading() { return <div className="panel-state"><span className="spinner-border" aria-hidden="true" /><p role="status">Wczytywanie zgłoszeń…</p></div>; }

function TicketList({ client, user, expired, notice, clearNotice }) {
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [draft, setDraft] = useState({ search: '', status: '', categoryId: '', assignment: 'all' });
  const [filters, setFilters] = useState({ ...draft, page: 1 });
  const staff = user.role === 'STAFF';
  useEffect(() => {
    let active = true;
    setError(''); setResult(null);
    Promise.all([client.tickets(filters), client.categories()]).then(([tickets, list]) => {
      if (active) { setResult(tickets); setCategories(list); }
    }).catch((failure) => {
      if (!active) return;
      if (failure.status === 401) expired(); else setError(failure.message);
    });
    return () => { active = false; };
  }, [client, filters, refresh, expired]);
  function field(name, value) { setDraft((previous) => ({ ...previous, [name]: value })); }
  return <section aria-label="Lista zgłoszeń">
    <div className="ticket-toolbar"><p>{staff ? 'Wszystkie zgłoszenia klientów serwisu.' : 'Śledź postęp naprawy i zarządzaj swoimi zgłoszeniami.'}</p><div className="ticket-actions"><button className="btn btn-outline-secondary" onClick={() => setRefresh((value) => value + 1)}>Odśwież zgłoszenia</button>{!staff && <a className="btn btn-primary" href="#/tickets/new"><Icon name="plus" size={18} /> Nowe zgłoszenie</a>}</div></div>
    {notice && <div className="alert alert-success ticket-notice" role="status"><span>{notice}</span><button type="button" className="notice-close" onClick={clearNotice} aria-label="Zamknij komunikat">×</button></div>}
    <form className="ticket-filters" onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft, page: 1 }); }}>
      <div className="ticket-search"><label htmlFor="ticket-search">Szukaj zgłoszenia</label><input className="form-control" id="ticket-search" type="search" maxLength={100} placeholder="Tytuł lub kategoria" value={draft.search} onChange={(event) => field('search', event.target.value)} /></div>
      <div><label htmlFor="ticket-status-filter">Status</label><select className="form-select" id="ticket-status-filter" value={draft.status} onChange={(event) => field('status', event.target.value)}><option value="">Wszystkie statusy</option>{Object.entries(statuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div>
      <div><label htmlFor="ticket-category-filter">Kategoria</label><select className="form-select" id="ticket-category-filter" value={draft.categoryId} onChange={(event) => field('categoryId', event.target.value)}><option value="">Wszystkie kategorie</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></div>
      {staff && <div><label htmlFor="ticket-assignment-filter">Przypisanie</label><select className="form-select" id="ticket-assignment-filter" value={draft.assignment} onChange={(event) => field('assignment', event.target.value)}><option value="all">Wszyscy pracownicy</option><option value="mine">Przypisane do mnie</option><option value="unassigned">Nieprzypisane</option></select></div>}
      <button className="btn btn-primary" type="submit">Filtruj</button><button type="button" className="btn btn-outline-secondary" onClick={() => { const empty = { search: '', status: '', categoryId: '', assignment: 'all' }; setDraft(empty); setFilters({ ...empty, page: 1 }); }}>Wyczyść filtry</button>
    </form>
    {error ? <Failure message={error} retry={() => setRefresh((value) => value + 1)} /> : !result ? <Loading /> : <>
      <div className="ticket-results-heading"><h2>{staff ? 'Zgłoszenia serwisowe' : 'Twoje zgłoszenia'}</h2><span>{result.pagination.total} zgłoszeń</span></div>
      {result.data.length ? <div className="ticket-list">{result.data.map((ticket) => <article className="ticket-row" key={ticket.id}>
        <div className="ticket-row-main"><span className="ticket-number">ZGŁOSZENIE #{ticket.id}</span><h3><a href={`#/tickets/${ticket.id}`}>{ticket.title}</a></h3><div className="ticket-row-meta"><span>{ticket.categoryName}</span><span>{date(ticket.createdAt)}</span>{staff && <span>Klient: {ticket.clientName}</span>}</div></div>
        <div className="ticket-row-status"><TicketStatus status={ticket.status} /><small>{ticket.assignedName || 'Oczekuje na przypisanie'}</small></div><a className="ticket-open" href={`#/tickets/${ticket.id}`} aria-label={`Otwórz zgłoszenie: ${ticket.title}`}><Icon name="arrow" /></a>
      </article>)}</div> : <div className="panel-state"><Icon name="ticket" size={38} /><h3>{result.pagination.total ? 'Brak zgłoszeń na tej stronie' : 'Brak zgłoszeń do wyświetlenia'}</h3><p>{!staff && !filters.search && !filters.status && !filters.categoryId ? 'Dodaj pierwsze zgłoszenie i opisz problem ze sprzętem.' : 'Zmień filtry lub wróć do pierwszej strony.'}</p>{!staff && <a className="btn btn-primary" href="#/tickets/new">Dodaj zgłoszenie</a>}</div>}
      {result.pagination.totalPages > 1 && <nav className="ticket-pagination" aria-label="Strony zgłoszeń"><button className="btn btn-outline-secondary" disabled={filters.page <= 1} onClick={() => setFilters((previous) => ({ ...previous, page: previous.page - 1 }))}>Poprzednia</button><span>Strona {filters.page} z {result.pagination.totalPages}</span><button className="btn btn-outline-secondary" disabled={filters.page >= result.pagination.totalPages} onClick={() => setFilters((previous) => ({ ...previous, page: previous.page + 1 }))}>Następna</button></nav>}
    </>}
  </section>;
}

function TicketForm({ initial, categories, submit, cancel, submitting }) {
  const [form, setForm] = useState({ title: initial?.title ?? '', categoryId: String(initial?.categoryId ?? ''), description: initial?.description ?? '' });
  const [errors, setErrors] = useState({});
  const root = useRef(null);
  function field(key, value) { setForm((previous) => ({ ...previous, [key]: value })); }
  async function save(event) {
    event.preventDefault();
    const problems = {};
    if ([...form.title.trim()].length < 3 || [...form.title.trim()].length > 200) problems.title = 'Tytuł powinien mieć od 3 do 200 znaków.';
    if (!form.categoryId) problems.categoryId = 'Wybierz kategorię sprzętu.';
    if ([...form.description.trim()].length < 10 || [...form.description.trim()].length > 5000) problems.description = 'Opis powinien mieć od 10 do 5000 znaków.';
    setErrors(problems);
    if (Object.keys(problems).length) { root.current?.querySelector(`[name="${Object.keys(problems)[0]}"]`)?.focus(); return; }
    await submit({ title: form.title.trim(), categoryId: Number(form.categoryId), description: form.description.trim(), ...(initial ? { revision: initial.revision } : {}) });
  }
  return <form className="ticket-form" ref={root} onSubmit={save} noValidate><fieldset disabled={submitting}><legend>{initial ? 'Edytuj zgłoszenie' : 'Opisz problem'}</legend><p className="form-note">Podaj objawy usterki i informacje, które pomogą serwisowi. Wszystkie pola są wymagane.</p>
    <div className="ticket-form-row"><div className="field-group"><label htmlFor="ticket-title">Tytuł zgłoszenia</label><input className="form-control" name="title" id="ticket-title" value={form.title} maxLength={200} onChange={(event) => field('title', event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'ticket-title-error' : undefined} placeholder="Np. Laptop nie uruchamia się" />{errors.title && <p className="field-error" id="ticket-title-error">{errors.title}</p>}</div>
    <div className="field-group"><label htmlFor="ticket-category">Kategoria sprzętu</label><select className="form-select" name="categoryId" id="ticket-category" value={form.categoryId} onChange={(event) => field('categoryId', event.target.value)} aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? 'ticket-category-error' : undefined}><option value="">Wybierz kategorię</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>{errors.categoryId && <p className="field-error" id="ticket-category-error">{errors.categoryId}</p>}</div></div>
    <div className="field-group"><label htmlFor="ticket-description">Opis problemu</label><textarea className="form-control" name="description" id="ticket-description" rows={7} value={form.description} maxLength={5000} onChange={(event) => field('description', event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'ticket-description-error ticket-description-hint' : 'ticket-description-hint'} placeholder="Co się dzieje? Od kiedy występuje problem? Co zostało już sprawdzone?" /><div className="description-hint" id="ticket-description-hint"><span>Minimum 10 znaków.</span><span>{[...form.description].length} / 5000</span></div>{errors.description && <p className="field-error" id="ticket-description-error">{errors.description}</p>}</div>
    <div className="ticket-actions"><button className="btn btn-primary" type="submit" disabled={!categories.length}>{submitting ? 'Zapisywanie…' : initial ? 'Zapisz zmiany' : 'Wyślij zgłoszenie'}</button><button className="btn btn-outline-secondary" type="button" onClick={cancel}>Anuluj</button></div>
    {!categories.length && <p role="alert" className="field-error">Brak dostępnych kategorii. Skontaktuj się z serwisem.</p>}
  </fieldset></form>;
}

function NewTicket({ client, user, expired, created }) {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    client.categories().then((data) => { if (active) setCategories(data); }).catch((failure) => {
      if (!active) return;
      if (failure.status === 401) expired(); else setError(failure.message);
    });
    return () => { active = false; };
  }, [client, expired, refresh]);
  if (user.role !== 'CLIENT') return <div className="panel-state"><h2>Zgłoszenia tworzą klienci</h2><a className="btn btn-primary" href="#/tickets">Wróć do zgłoszeń</a></div>;
  async function submit(form) {
    if (busy) return;
    setBusy(true); setActionError('');
    try { created(await client.createTicket(form)); }
    catch (failure) { if (failure.status === 401) expired(); else setActionError(failure.message); }
    finally { setBusy(false); }
  }
  return error ? <Failure message={error} retry={() => setRefresh((value) => value + 1)} /> : !categories ? <Loading /> : <>
    <a className="ticket-back" href="#/tickets"><Icon name="back" size={17} /> Wszystkie zgłoszenia</a>
    {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
    <TicketForm categories={categories} submit={submit} submitting={busy} cancel={() => navigate('/tickets')} />
  </>;
}

function Management({ ticket, staffUsers, user, save, busy }) {
  const [assignedTo, setAssignedTo] = useState(String(ticket.assignedTo ?? ''));
  const [status, setStatus] = useState(ticket.status);
  const [error, setError] = useState('');
  return <form className="ticket-management" onSubmit={(event) => {
    event.preventDefault();
    if (status !== 'NEW' && !assignedTo) { setError('Wybierz pracownika przed rozpoczęciem obsługi.'); return; }
    setError(''); save({ assignedTo: assignedTo ? Number(assignedTo) : null, status, revision: ticket.revision });
  }}><fieldset disabled={busy}><legend>Obsługa zgłoszenia</legend><div className="ticket-form-row">
    <div className="field-group"><label htmlFor="assigned-worker">Pracownik prowadzący</label><select className="form-select" id="assigned-worker" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Nieprzypisane</option>{staffUsers.map((worker) => <option value={worker.id} key={worker.id}>{worker.fullName}{worker.id === user.id ? ' (ja)' : ''}</option>)}</select></div>
    <div className="field-group"><label htmlFor="managed-status">Status zgłoszenia</label><select className="form-select" id="managed-status" value={status} onChange={(event) => setStatus(event.target.value)}>{(ticket.status === 'NEW' ? ['NEW', 'IN_PROGRESS'] : ['IN_PROGRESS', 'CLOSED']).map((key) => <option value={key} key={key}>{statuses[key]}</option>)}</select></div>
  </div>{error && <p className="field-error" role="alert">{error}</p>}<div className="ticket-actions"><button className="btn btn-primary" type="submit">{busy ? 'Zapisywanie…' : 'Zapisz obsługę'}</button><button className="btn btn-outline-secondary" type="button" onClick={() => setAssignedTo(String(user.id))}>Przypisz do mnie</button></div></fieldset></form>;
}

function TicketDetail({ id, client, user, expired, notice, changed, removed, clearNotice }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelDelete = useRef(null);
  const staff = user.role === 'STAFF';
  useEffect(() => {
    let active = true;
    setError(''); setData(null); setEditing(false); setDeleting(false); setActionError(''); setConflict(false);
    Promise.all([client.ticket(id), client.categories(), staff ? client.staffUsers() : Promise.resolve([])]).then(([ticket, categories, staffUsers]) => {
      if (active) setData({ ticket, categories, staffUsers });
    }).catch((failure) => {
      if (!active) return;
      if (failure.status === 401) expired(); else setError(failure.message);
    });
    return () => { active = false; };
  }, [id, client, staff, expired, refresh]);
  useEffect(() => { if (deleting) cancelDelete.current?.focus(); }, [deleting]);
  async function action(operation, after) {
    if (busy) return;
    setBusy(true); setActionError(''); setConflict(false);
    try { after(await operation()); }
    catch (failure) {
      if (failure.status === 401) expired();
      else { setActionError(failure.message); setConflict(failure.status === 409); }
    } finally { setBusy(false); }
  }
  function save(form) { return action(() => client.updateTicket(id, form), (ticket) => { setData((previous) => ({ ...previous, ticket })); setEditing(false); changed('Zmiany zostały zapisane.'); }); }
  if (error) return <><a className="ticket-back" href="#/tickets"><Icon name="back" size={17} /> Wszystkie zgłoszenia</a><Failure message={error} retry={() => setRefresh((value) => value + 1)} /></>;
  if (!data) return <Loading />;
  const { ticket, categories, staffUsers } = data;
  return <section aria-label="Szczegóły zgłoszenia">
    <div className="ticket-detail-toolbar"><a className="ticket-back" href="#/tickets"><Icon name="back" size={17} /> Wszystkie zgłoszenia</a><button className="btn btn-outline-secondary" onClick={() => setRefresh((value) => value + 1)} disabled={busy || editing || deleting}>Odśwież zgłoszenie</button></div>
    {notice && <div className="alert alert-success ticket-notice" role="status"><span>{notice}</span><button className="notice-close" onClick={clearNotice} aria-label="Zamknij komunikat">×</button></div>}
    {actionError && <div className="alert alert-danger" role="alert"><p className="mb-0">{actionError}</p>{conflict && <button className="btn btn-outline-secondary mt-3" disabled={busy} onClick={() => setRefresh((value) => value + 1)}>Pobierz aktualne zgłoszenie</button>}</div>}
    <article className="ticket-detail"><div className="ticket-detail-heading"><div><span className="ticket-number">ZGŁOSZENIE #{ticket.id}</span><h2>{ticket.title}</h2></div><TicketStatus status={ticket.status} /></div>
      <dl className="ticket-details"><div><dt>Kategoria</dt><dd>{ticket.categoryName}</dd></div><div><dt>Klient</dt><dd>{ticket.clientName}</dd></div><div><dt>Pracownik prowadzący</dt><dd>{ticket.assignedName || 'Jeszcze nie przypisano'}</dd></div><div><dt>Dodano</dt><dd>{date(ticket.createdAt)}</dd></div><div><dt>Ostatnia zmiana</dt><dd>{date(ticket.updatedAt)}</dd></div></dl>
      <div className="ticket-description"><h3>Opis problemu</h3><p>{ticket.description}</p></div>
      {!staff && ticket.status === 'NEW' && !editing && !deleting && <div className="ticket-actions"><button className="btn btn-outline-secondary" onClick={() => { setEditing(true); clearNotice(); }}>Edytuj zgłoszenie</button><button className="btn btn-outline-danger" onClick={() => { setDeleting(true); clearNotice(); }}>Usuń zgłoszenie</button></div>}
      {!staff && ticket.status !== 'NEW' && <p className="account-note"><Icon name="lock" size={18} /> Serwis rozpoczął obsługę. Zgłoszenie jest dostępne do odczytu.</p>}
      {staff && ticket.status === 'CLOSED' && <p className="account-note"><Icon name="check" size={18} /> Obsługa została zakończona. Zgłoszenie jest dostępne do odczytu.</p>}
    </article>
    {editing && <TicketForm key={ticket.revision} initial={ticket} categories={categories} submit={save} submitting={busy} cancel={() => setEditing(false)} />}
    {staff && ticket.status !== 'CLOSED' && <Management key={ticket.revision} ticket={ticket} staffUsers={staffUsers} user={user} save={save} busy={busy} />}
    {deleting && <div className="delete-confirmation" role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-description"><h3 id="delete-title">Usunąć zgłoszenie?</h3><p id="delete-description">Zgłoszenie „{ticket.title}” zostanie trwale usunięte.</p><div className="ticket-actions"><button className="btn btn-outline-secondary" ref={cancelDelete} onClick={() => setDeleting(false)} disabled={busy}>Zachowaj zgłoszenie</button><button className="btn btn-danger" disabled={busy} onClick={() => action(() => client.deleteTicket(id, ticket.revision), removed)}>{busy ? 'Usuwanie…' : 'Potwierdź usunięcie'}</button></div></div>}
  </section>;
}

export function TicketWorkspace({ route, client, user, onSessionExpired }) {
  const [notice, setNotice] = useState('');
  const common = { client, user, expired: onSessionExpired, notice, clearNotice: () => setNotice('') };
  if (route === '/tickets') return <TicketList {...common} />;
  if (route === '/tickets/new') return <NewTicket {...common} created={(ticket) => { setNotice('Zgłoszenie zostało dodane.'); navigate(`/tickets/${ticket.id}`); }} />;
  const match = /^\/tickets\/([1-9]\d*)$/.exec(route);
  if (!match || !Number.isSafeInteger(Number(match[1]))) return <div className="panel-state"><h2>Nie znaleziono zgłoszenia</h2><a href="#/tickets">Wróć do listy</a></div>;
  return <TicketDetail key={match[1]} id={Number(match[1])} {...common} changed={setNotice} removed={() => { setNotice('Zgłoszenie zostało usunięte.'); navigate('/tickets'); }} />;
}
