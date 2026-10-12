import { Icon } from './Icon.jsx';

export function Brand({ light = false }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="#/login" aria-label="HelpDesk — strona główna">
    <span className="brand-symbol"><Icon name="monitor" size={24} /></span>
    <span><strong>HelpDesk<span className="brand-dot">.</span></strong><small>serwis komputerowy</small></span>
  </a>;
}
