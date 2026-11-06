// The privacy policy (v13 look), in plain words, in either language.
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { PageHead } from './_components/PageHead';
import { Shell } from './Shell';

const SECTIONS = ['collect', 'never', 'who', 'keep', 'safe', 'contact'] as const;

export function Privacy({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} otherHref={lang === 'ur' ? '/en/privacy' : '/privacy'}>
      <PageHead title={t(lang, 'privacy.title')} ur={lang === 'ur'} time="noon" />
      <article className="wrap section prose" style={{ paddingTop: 40 }}>
        <p style={{ color: 'var(--ink2)', margin: '0 0 24px', fontSize: 15 }}>{t(lang, 'privacy.updated')}</p>
        <p className="lead" style={{ marginBottom: 28 }}>{t(lang, 'privacy.intro')}</p>
        {SECTIONS.map((s) => (
          <section key={s} className="paper-1" style={{ borderRadius: 24, padding: '4px 22px 18px', marginBottom: 14 }}>
            <h2>{t(lang, `privacy.${s}.title` as MessageKey)}</h2>
            <p style={{ margin: 0 }}>{t(lang, `privacy.${s}.body` as MessageKey)}</p>
          </section>
        ))}
      </article>
    </Shell>
  );
}
