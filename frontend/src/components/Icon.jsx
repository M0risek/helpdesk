const paths = {
  plus: <path d="M12 4v16M4 12h16" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-8h6v8" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v2" /></>,
  logout: <><path d="M9 4H4v16h5m5-12 4 4-4 4m-5-4h12" /></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  laptop: <><rect x="5" y="3" width="14" height="13" rx="1.5" /><path d="m5 16-3 4h20l-3-4" /></>,
  printer: <><path d="M6 8V3h12v5M6 17H3V8h18v9h-3" /><rect x="6" y="13" width="12" height="8" /><path d="M17 10h1" /></>,
  tools: <><path d="m14 6 4 4m-8 4-7 7m0-18 18 18M4 3 3 4l4 4 1-1m3 7 6-6a5 5 0 0 0 5-5l-4 3-3-3 3-3a5 5 0 0 0-5 5l-6 6" /></>,
  ticket: <><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z" /><path d="M15 5v3m0 3v2m0 3v3" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7" /><circle cx="12" cy="12" r="3" /></>,
};

export function Icon({ name, size = 20, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.tools}</svg>;
}
