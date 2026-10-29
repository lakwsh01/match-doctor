import { LOCALES } from './locales';
import type { Locale } from './locales';
import type { MessageKey } from './messages/en-US';

export type Params = Record<string, string | number>;

// Ids that come from the data, not from the code. Each group has one message per id: `gesture.backhand_dink`.
export type TermGroup = 'gesture' | 'error' | 'cause' | 'side' | 'end';

export type Translator = {
  (key: MessageKey, params?: Params): string;
  locale: Locale;
  // The message for a data id, or the id itself spelled out when no message names it yet.
  term: (group: TermGroup, id: string) => string;
  // "P1 and P2" in English, "P1和P2" in Chinese.
  list: (items: string[]) => string;
  number: (n: number) => string;
};

// "around_the_post" -> "Around the post"
const humanize = (id: string) => id.charAt(0).toUpperCase() + id.slice(1).replaceAll('_', ' ');

// Fills each {name} with its param and leaves a hole without one as written, so a typo shows up on screen.
const fill = (text: string, params: Params = {}) =>
  text.replace(/\{(\w+)\}/g, (hole, name: string) => (name in params ? String(params[name]) : hole));

export function createTranslator(locale: Locale): Translator {
  const messages: Record<string, string | undefined> = LOCALES[locale].messages;
  const lists = new Intl.ListFormat(locale, { type: 'conjunction' });
  const numbers = new Intl.NumberFormat(locale);

  return Object.assign((key: MessageKey, params?: Params) => fill(messages[key] ?? key, params), {
    locale,
    term: (group: TermGroup, id: string) => messages[`${group}.${id}`] ?? humanize(id),
    list: (items: string[]) => lists.format(items),
    number: (n: number) => numbers.format(n),
  });
}
