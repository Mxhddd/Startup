// All words on screen come from ur.json and en.json. Components ask for a key, never hard-code text.
import en from './en.json';
import ur from './ur.json';

export type Lang = 'ur' | 'en';
export type MessageKey = keyof typeof en;

const tables: Record<Lang, Record<MessageKey, string>> = { ur, en };

export const DEFAULT_LANG: Lang = 'ur';

export function t(lang: Lang, key: MessageKey): string {
  return tables[lang][key];
}

/** Urdu reads right to left; English left to right. */
export function dirOf(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ur' ? 'rtl' : 'ltr';
}

export function otherLang(lang: Lang): Lang {
  return lang === 'ur' ? 'en' : 'ur';
}

export { en, ur };
