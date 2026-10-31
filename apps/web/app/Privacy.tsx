// The privacy policy, in plain words, in either language.
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { Shell } from './Shell';

const SECTIONS = ['collect', 'never', 'who', 'keep', 'safe', 'contact'] as const;

export function Privacy({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} otherHref={lang === 'ur' ? '/en/privacy' : '/privacy'}>
      <article style={{ marginTop: 40, maxWidth: 720 }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', margin: '0 0 6px' }}>{t(lang, 'privacy.title')}</h1>
        <p style={{ color: colors.ink2, margin: '0 0 24px', fontSize: 15 }}>{t(lang, 'privacy.updated')}</p>
        <p style={{ fontSize: 18, margin: '0 0 28px' }}>{t(lang, 'privacy.intro')}</p>
        {SECTIONS.map((s) => (
          <section key={s} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, margin: '0 0 6px' }}>{t(lang, `privacy.${s}.title` as MessageKey)}</h2>
            <p style={{ fontSize: 17, margin: 0 }}>{t(lang, `privacy.${s}.body` as MessageKey)}</p>
          </section>
        ))}
      </article>
    </Shell>
  );
}
