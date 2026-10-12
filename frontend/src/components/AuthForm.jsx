import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { Brand } from './Brand.jsx';

const characterCount = (value) => [...value].length;

export function AuthForm({ mode, client, onLogin, onRegistered, notice }) {
  const registering = mode === 'register';
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const alertRef = useRef(null);
  useEffect(() => { if (error) alertRef.current?.focus(); }, [error]);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = {};
    if (registering && (characterCount(form.fullName.trim()) < 2 || characterCount(form.fullName.trim()) > 120)) nextErrors.fullName = 'Podaj imię i nazwisko (2–120 znaków).';
    if (form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Podaj poprawny adres e-mail.';
    if (characterCount(form.password) < 12 || characterCount(form.password) > 128 || !form.password.trim()) nextErrors.password = 'Hasło musi mieć od 12 do 128 znaków.';
    if (registering && form.confirmation !== form.password) nextErrors.confirmation = 'Wpisane hasła muszą być identyczne.';
    setErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) {
      document.getElementById(`auth-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const credentials = { email: form.email.trim(), password: form.password };
      if (registering) {
        await client.register({ ...credentials, fullName: form.fullName.trim() });
        onRegistered();
      } else {
        onLogin(await client.login(credentials));
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  function field(name, label, { type = 'text', autoComplete, hint } = {}) {
    const password = name === 'password';
    const messageId = `auth-${name}-message`;
    return <div className="form-field">
      <label className="form-label" htmlFor={`auth-${name}`}>{label}</label>
      <div className={password ? 'password-control' : undefined}>
        <input className={`form-control ${errors[name] ? 'is-invalid' : ''}`} id={`auth-${name}`} name={name}
          type={password && showPassword ? 'text' : type} value={form[name]} onChange={change}
          autoComplete={autoComplete} required aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] || hint ? messageId : undefined} />
        {password && <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'} aria-pressed={showPassword}><Icon name="eye" size={19} /></button>}
      </div>
      {(errors[name] || hint) && <div id={messageId} className={errors[name] ? 'field-error' : 'field-hint'}>{errors[name] || hint}</div>}
    </div>;
  }

  return <div className="auth-layout">
    <aside className="auth-story" aria-label="O serwisie HelpDesk">
      <Brand light />
      <div className="story-content">
        <span className="eyebrow story-eyebrow"><span className="status-dot" /> Twój sprzęt, nasze wsparcie</span>
        <h2 className="story-title">Spokojnie.<br />Jesteś w dobrym<br /><em>miejscu.</em></h2>
        <p>Twoje konto w serwisie komputerowym. Poznaj dostępne obszary wsparcia i miej swoje dane pod ręką.</p>
        <div className="story-devices" aria-hidden="true"><span><Icon name="laptop" /> Laptopy</span><span><Icon name="monitor" /> Komputery</span><span><Icon name="printer" /> Drukarki</span></div>
        <div className="story-divider" />
        <div className="story-note"><span className="story-note-icon"><Icon name="lock" /></span><div><strong>Własne konto. Wygodny dostęp.</strong><p>Zaloguj się do swojego panelu w dowolnym momencie.</p></div></div>
      </div>
      <footer>HelpDesk <span>•</span> Serwis komputerowy</footer>
    </aside>
    <main className="auth-main" id="main-content" tabIndex={-1}>
      <div className="auth-mobile-brand"><Brand /></div>
      <div className="auth-top-note">{registering ? 'Masz już konto?' : 'Pierwszy raz u nas?'} <a href={registering ? '#/login' : '#/register'}>{registering ? 'Zaloguj się' : 'Utwórz konto'} <Icon name="arrow" size={16} /></a></div>
      <div className="auth-form-wrap">
        <span className="eyebrow">{registering ? 'Dołącz do HelpDesk' : 'Witaj ponownie'}</span>
        <h1>{registering ? 'Utwórz swoje konto' : 'Zaloguj się'}</h1>
        <p className="auth-description">{registering ? 'Wypełnij formularz, aby założyć konto klienta.' : 'Wpisz swoje dane, aby przejść do panelu.'}</p>
        {notice && <div className="alert alert-success auth-notice" role="status"><Icon name="check" />{notice}</div>}
        {error && <div className="alert alert-danger" role="alert" tabIndex={-1} ref={alertRef}>{error}</div>}
        <form onSubmit={submit} noValidate aria-label={registering ? 'Formularz rejestracji' : 'Formularz logowania'} aria-busy={busy}>
          <fieldset disabled={busy}>
            {registering && field('fullName', 'Imię i nazwisko', { autoComplete: 'name' })}
            {field('email', 'Adres e-mail', { type: 'email', autoComplete: 'email' })}
            {field('password', 'Hasło', { type: 'password', autoComplete: registering ? 'new-password' : 'current-password', hint: registering ? 'Od 12 do 128 znaków. Możesz użyć kilku słów.' : undefined })}
            {registering && field('confirmation', 'Powtórz hasło', { type: 'password', autoComplete: 'new-password' })}
            <button className="btn btn-primary auth-submit" type="submit">{busy ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" />{registering ? 'Tworzenie konta…' : 'Logowanie…'}</> : <>{registering ? 'Utwórz konto' : 'Zaloguj się'}<Icon name="arrow" /></>}</button>
          </fieldset>
        </form>
        <div className="auth-bottom-note"><Icon name="lock" size={16} /> Twoje hasło pozostaje prywatne.</div>
      </div>
      <footer className="auth-footer">Pomoc dla Twojego komputera zaczyna się tutaj.</footer>
    </main>
  </div>;
}
