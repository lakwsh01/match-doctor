import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE } from '../../lib/i18n/locales';
import { createTranslator } from '../lib/i18n/translate';
import type { Translator } from '../lib/i18n/translate';

// Gives v2 `features/` their words. The v2 app provides the translator; presentational components never read it.
export const I18nContext = createContext<Translator>(createTranslator(DEFAULT_LOCALE));

export const useT = () => useContext(I18nContext);
