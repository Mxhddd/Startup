// All words on screen come from ur.json and en.json. Components ask for a key, never hard-code text.
import en from './en.json';
import ur from './ur.json';

export type Lang = 'ur' | 'en';
export type MessageKey = keyof typeof en;
export type Vars = Record<string, string | number>;

const tables: Record<Lang, Record<MessageKey, string>> = { ur, en };

export const DEFAULT_LANG: Lang = 'ur';

/** Looks up a key and fills placeholders like {min} or {name}. */
export function t(lang: Lang, key: MessageKey, vars?: Vars): string {
  const text = tables[lang][key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** Urdu reads right to left; English left to right. */
export function dirOf(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ur' ? 'rtl' : 'ltr';
}

export function otherLang(lang: Lang): Lang {
  return lang === 'ur' ? 'en' : 'ur';
}

export { en, ur };
