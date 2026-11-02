import type { Locale } from '../../../lib/i18n/locales';
import { createTranslator as createRootTranslator } from '../../../lib/i18n/translate';
import type { Params } from '../../../lib/i18n/translate';
import { enUS } from './messages/en-US';
import type { MessageKey } from './messages/en-US';
import { zhCN } from './messages/zh-CN';
import { zhTW } from './messages/zh-TW';

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { 'zh-TW': zhTW, 'zh-CN': zhCN, 'en-US': enUS };

export type Translator = {
  (key: MessageKey, params?: Params): string;
  locale: Locale;
  // Gesture, error, and cause names come from the main message files.
  term: (group: 'gesture' | 'error' | 'cause', id: string) => string;
  list: (items: string[]) => string;
  number: (n: number, digits?: number) => string;
};

const fill = (text: string, params: Params = {}) =>
  text.replace(/\{(\w+)\}/g, (hole, name: string) => (name in params ? String(params[name]) : hole));

export function createTranslator(locale: Locale): Translator {
  const messages = MESSAGES[locale];
  const root = createRootTranslator(locale);
  return Object.assign((key: MessageKey, params?: Params) => fill(messages[key] ?? key, params), {
    locale,
    term: root.term,
    list: root.list,
    number: (n: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n),
  });
}
