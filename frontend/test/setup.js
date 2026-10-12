import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
  window.localStorage.clear();
  window.sessionStorage.clear();
});
