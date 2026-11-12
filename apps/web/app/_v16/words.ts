// Every web.* word for one language, keyed without the "web." prefix (as the home page and the inner
// pages use them). The words themselves live in packages/messages.
import { en, t, type Lang, type MessageKey } from '@pohnch/messages';

export function webWords(lang: Lang): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(en) as MessageKey[]) if (key.startsWith('web.')) out[key.slice(4)] = t(lang, key);
  return out;
}
