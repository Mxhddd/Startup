// The home page (v14 "the city journey"), in either language. The server gathers every word from
// packages/messages and hands them to the client journey (Journey.tsx), which flies a camera over a
// paper map of Karachi through seven scenes of a school day. The same words are also written out as a
// plain article for screen readers and search engines.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { href } from './_lib/links';
import { Journey } from './_journey/Journey';
import type { JourneyCopy } from './_journey/engine';

const SCALAR = ['cta', 'now', 'unit', 'driver', 's0k', 's0h', 's0s', 's0p', 's0go', 's1k', 's1t', 's1h', 's1p', 's1n', 's2k', 's2t', 's2h', 's2p', 's3k', 's3t', 's3h', 's3p', 'hold', 'holdS', 'done', 'undo', 'undone', 's4k', 's4h', 's4p', 's5k', 's5t', 's5h', 's5p', 's5n', 's6k', 's6t', 's6h', 's6p', 's6go', 'faq.title', 'get.title', 'get.lead', 'get.join', 'get.soon', 'get.drivers', 'again', 'next', 'label'] as const;

export function journeyCopy(lang: Lang): JourneyCopy {
  const j = (k: string) => t(lang, `journey.${k}` as MessageKey);
  const copy: Record<string, unknown> = {};
  for (const k of SCALAR) copy[k] = j(k);
  copy.p = [1, 2, 3, 4, 5, 6, 7].map((n) => [j(`p.${n}`), j(`p.${n}.b`)]);
  copy.rail = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => j(`rail.${n}`));
  return copy as JourneyCopy;
}

export function Landing({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  const copy = journeyCopy(lang);
  const j = (k: string) => t(lang, `journey.${k}` as MessageKey);
  const qa: [string, string][] = [1, 2, 3, 4, 5].map((n) => [j(`qa.${n}.q`), j(`qa.${n}.a`)]);
  const wa = `https://wa.me/${PILOT_WHATSAPP.waNumber}`;
  const story = (
    <>
      <h1>{copy.s0h} {copy.s0s}</h1>
      <p>{copy.s0p}</p>
      {([1, 2, 3, 5, 6] as const).map((n) => (
        <section key={n}><h2>{j(`s${n}t`)} · {j(`s${n}h`)}</h2><p>{j(`s${n}p`)}</p></section>
      ))}
      <section><h2>{copy.s4h}</h2><ul>{copy.p.map(([f, b]) => <li key={f}><strong>{f}</strong>: {b}</li>)}</ul></section>
    </>
  );
  return (
    <Journey
      lang={lang}
      copy={copy}
      qa={qa}
      story={story}
      nav={{ safety: t(lang, 'site.nav.safety'), drivers: t(lang, 'site.nav.drivers'), questions: t(lang, 'site.nav.faq'), switchLang: t(lang, 'lang.switch'), otherHref: ur ? '/en' : '/', home: t(lang, 'site.nav.home'), homeHref: href(lang, '/'), download: t(lang, 'site.nav.download') }}
      links={{ safety: href(lang, '/safety'), drivers: href(lang, '/drivers'), privacy: href(lang, '/privacy'), terms: href(lang, '/terms'), delete: href(lang, '/delete-account'), download: href(lang, '/download') }}
      foot={{ safety: t(lang, 'site.nav.safety'), drivers: t(lang, 'site.nav.drivers'), privacy: t(lang, 'web.footer.privacy'), terms: t(lang, 'site.foot.terms'), delete: t(lang, 'site.foot.delete'), whatsapp: t(lang, 'site.foot.contact'), whatsappHref: wa, whatsappNumber: PILOT_WHATSAPP.display }}
    />
  );
}
