// The home page (v15 "choose your road"), in either language. The server gathers every word from
// packages/messages and hands them to the client journey (Journey.tsx), which flies a camera over a
// paper map of Karachi: what Pohnch is, the 7 am phone call, the school morning, then a fork ("Interested
// yet?") with three roads. The same story is also written out as a plain article: screen readers and
// search engines read it, and slow phones (lite mode) or "Read as a page" show it instead of the map.
import { AREA_IDS, AREA_SPOTS, PILOT_WHATSAPP } from '@pohnch/core';
import { en, t, type Lang, type MessageKey } from '@pohnch/messages';
import { href } from './_lib/links';
import { Journey } from './_journey/Journey';
import type { Area, Words } from './_journey/Panel';

/** Every journey.* word in one language, without the prefix (the client looks words up by short key). */
export function journeyWords(lang: Lang): Words {
  const out: Words = {};
  for (const key of Object.keys(en) as MessageKey[]) if (key.startsWith('journey.')) out[key.slice(8)] = t(lang, key);
  return out;
}

export function areasFor(lang: Lang): Area[] {
  return AREA_IDS.map((id) => ({ id, label: t(lang, `area.${id}` as MessageKey), spot: id === 'other' ? null : AREA_SPOTS[id] }));
}

export function Landing({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  const w = journeyWords(lang);
  const qa: [string, string][] = [1, 2, 3, 4, 5].map((n) => [w[`qa.${n}.q`]!, w[`qa.${n}.a`]!]);
  const wa = `https://wa.me/${PILOT_WHATSAPP.waNumber}`;
  const scene = (id: string, timed = true) => (
    <section key={id}><h2>{timed ? `${w[`${id}.t`]} · ` : ''}{w[`${id}.h`]}</h2><p>{w[`${id}.p`]}</p></section>
  );
  const story = (
    <>
      <header className="st-head">
        <p className="kick">{w['hero.k']}</p>
        <h1>{w['hero.h']}</h1>
        <p className="lede">{w['hero.s']}</p>
        <p className="facts">{w['hero.f']}</p>
        <p><a className="pill" href="#join">{w.cta}</a></p>
      </header>
      <section><h2>{w['calls.h']}</h2><p>{w['calls.p']}</p><p className="note">{w['calls.n']}</p></section>
      {scene('left')}
      {scene('door')}
      {scene('van')}
      <section id="r-how"><h2>{w['how.h']}</h2><ol>{[1, 2, 3].map((n) => <li key={n}>{w[`how.${n}`]}</li>)}</ol><p>{w['how.p']}</p></section>
      <section id="r-doubts"><h2>{w['doubts.h']}</h2><dl>{[1, 2, 3, 4, 5, 6].map((n) => <div key={n}><dt>{w[`doubts.${n}`]}</dt><dd>{w[`doubts.${n}.b`]}</dd></div>)}</dl></section>
      <section id="r-safe"><h2>{w['promises.h']}</h2><dl>{[1, 2, 3, 4, 5, 6, 7].map((n) => <div key={n}><dt>{w[`p.${n}`]}</dt><dd>{w[`p.${n}.b`]}</dd></div>)}</dl></section>
      {scene('school')}
      {scene('home')}
      <section id="r-drivers"><h2>{w['drvCalls.h']}</h2><p>{w['drvCalls.p']}</p><h3>{w['drvStart.h']}</h3><ol>{[1, 2, 3].map((n) => <li key={n}>{w[`drvStart.${n}`]}</li>)}</ol></section>
    </>
  );
  return (
    <Journey
      lang={lang}
      w={w}
      areas={areasFor(lang)}
      qa={qa}
      story={story}
      nav={{ switchLang: t(lang, 'lang.switch'), otherHref: ur ? '/en' : '/', home: t(lang, 'site.nav.home'), homeHref: href(lang, '/'), download: t(lang, 'site.nav.download') }}
      links={{ safety: href(lang, '/safety'), drivers: href(lang, '/drivers'), privacy: href(lang, '/privacy'), terms: href(lang, '/terms'), delete: href(lang, '/delete-account'), download: href(lang, '/download') }}
      foot={{ safety: t(lang, 'site.nav.safety'), drivers: t(lang, 'site.nav.drivers'), privacy: t(lang, 'web.footer.privacy'), terms: t(lang, 'site.foot.terms'), delete: t(lang, 'site.foot.delete'), whatsapp: t(lang, 'site.foot.contact'), whatsappHref: wa, whatsappNumber: PILOT_WHATSAPP.display }}
    />
  );
}
