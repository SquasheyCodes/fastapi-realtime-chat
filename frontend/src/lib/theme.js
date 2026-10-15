import { useCallback, useEffect, useState } from 'react';

const KEY = 'chatten_theme';

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function storedTheme() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Follows the system theme until the person flips the toggle, then remembers
 * their choice. index.html applies the saved choice before first paint.
 */
export function useTheme() {
  const [choice, setChoice] = useState(storedTheme);
  const [system, setSystem] = useState(systemTheme);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystem(e.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (choice) root.dataset.theme = choice;
    else delete root.dataset.theme;
  }, [choice]);

  const theme = choice ?? system;

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setChoice(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // storage unavailable: the choice still applies for this visit
    }
  }, [theme]);

  return { theme, toggle };
}
