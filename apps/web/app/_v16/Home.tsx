// The home page (v16), in either language. The server gathers every web.* word from packages/messages
// and the lists (areas, questions, quotes) and hands them to the client page (HomeClient.tsx).
import { AREA_IDS, AREA_SPOTS, PILOT_WHATSAPP, STORE } from '@pohnch/core';
import { en, t, type Lang, type MessageKey } from '@pohnch/messages';
import { href } from '../_lib/links';
import { HomeClient } from './HomeClient';
import { QUOTES, quoteFor } from './quotes';

export function webWords(lang: Lang): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(en) as MessageKey[]) if (key.startsWith('web.')) out[key.slice(4)] = t(lang, key);
  return out;
}

export function Home({ lang, homeHref, otherHref }: { lang: Lang; homeHref: string; otherHref: string }) {
  const w = webWords(lang);
  const qa: [string, string][] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => [w[`qa.${n}.q`]!, w[`qa.${n}.a`]!]);
  const areas = AREA_IDS.map((id) => ({ id, label: t(lang, `area.${id}` as MessageKey), spot: id === 'other' ? null : AREA_SPOTS[id] }));
  // structured data for search engines: the organisation, the app, and the questions with answers
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: 'Pohnch', alternateName: 'پہنچ', url: 'https://pohnch.pk', logo: 'https://pohnch.pk/icon.svg', areaServed: 'Karachi', contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', telephone: `+${PILOT_WHATSAPP.waNumber}`, availableLanguage: ['ur', 'en'] } },
      { '@type': 'MobileApplication', name: 'Pohnch', operatingSystem: 'Android, iOS', applicationCategory: 'TravelApplication', offers: { '@type': 'Offer', price: '0', priceCurrency: 'PKR' }, description: w['hero.p'] },
      { '@type': 'FAQPage', inLanguage: lang, mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    <HomeClient
      lang={lang}
      w={w}
      areas={areas}
      qa={qa}
      quotes={QUOTES.map((q) => ({ name: q.name, text: q[lang] }))}
      doorQuotes={{ parent: quoteFor(QUOTES, 'parent', lang), driver: quoteFor(QUOTES, 'driver', lang) }}
      links={{ home: homeHref, other: otherHref, drivers: href(lang, '/drivers'), safety: href(lang, '/safety'), privacy: href(lang, '/privacy'), terms: href(lang, '/terms'), delete: href(lang, '/delete-account'), download: href(lang, '/download') }}
      wa={{ href: `https://wa.me/${PILOT_WHATSAPP.waNumber}`, display: PILOT_WHATSAPP.display }}
      playUrl={STORE.playUrl}
      foot={{ privacy: t(lang, 'web.footer.privacy'), terms: t(lang, 'site.foot.terms'), delete: t(lang, 'site.foot.delete'), download: t(lang, 'site.nav.download'), contact: t(lang, 'site.foot.contact'), switchLang: t(lang, 'lang.switch') }}
    />
    </>
  );
}
