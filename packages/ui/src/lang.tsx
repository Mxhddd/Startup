// The language switch. Urdu is the default; English is one tap away and the whole layout flips direction.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LANG, dirOf, otherLang, t, type Lang, type MessageKey } from '@pohnch/messages';
import { fonts } from './theme';

type LangValue = {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: (key: MessageKey) => string;
  toggle: () => void;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children, initial = DEFAULT_LANG }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLang] = useState<Lang>(initial);
  const value = useMemo<LangValue>(
    () => ({
      lang,
      dir: dirOf(lang),
      t: (key) => t(lang, key),
      toggle: () => setLang((l) => otherLang(l)),
      setLang,
    }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const value = useContext(LangContext);
  if (!value) throw new Error('useLang must be used inside <LangProvider>');
  return value;
}

/** The UI font for a language: Noto Sans Arabic for Urdu, Manrope for English. */
export function uiFont(lang: Lang, weight: 'regular' | 'bold' = 'regular'): string {
  return lang === 'ur' ? fonts.urdu[weight] : fonts.latin[weight];
}
