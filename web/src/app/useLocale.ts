import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, isLocale } from '../lib/i18n/locales';
import type { Locale } from '../lib/i18n/locales';

const STORAGE_KEY = 'match-doctor.locale';

// Storage can be missing or blocked (private windows), so every access falls back to the default.
function stored(): Locale {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

// The chosen language, kept across visits and mirrored to <html lang> so browsers pick the right fonts and hyphenation.
export function useLocale(): [Locale, (locale: Locale) => void] {
  const [locale, setLocale] = useState(stored);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const choose = (next: Locale) => {
    setLocale(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
  };

  return [locale, choose];
}
