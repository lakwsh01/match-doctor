import { enUS } from './messages/en-US';
import { zhCN } from './messages/zh-CN';
import { zhTW } from './messages/zh-TW';

// Each language is named in itself, so a person can find theirs whatever language the page is in.
export const LOCALES = {
  'zh-TW': { name: '繁體中文', messages: zhTW },
  'zh-CN': { name: '简体中文', messages: zhCN },
  'en-US': { name: 'English', messages: enUS },
};

export type Locale = keyof typeof LOCALES;

export const DEFAULT_LOCALE: Locale = 'zh-TW';

export const LOCALE_OPTIONS = (Object.keys(LOCALES) as Locale[]).map((value) => ({ value, label: LOCALES[value].name }));

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && value in LOCALES;
