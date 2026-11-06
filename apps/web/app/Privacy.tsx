// The privacy policy (v14 editorial look), in plain words, in either language.
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { PageHead } from './_components/PageHead';
import { Shell } from './Shell';

const SECTIONS = ['collect', 'never', 'who', 'keep', 'safe', 'contact'] as const;

export function Privacy({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} otherHref={lang === 'ur' ? '/en/privacy' : '/privacy'}>
      <PageHead title={t(lang, 'privacy.title')} lead={t(lang, 'privacy.intro')} />
      <div className="ed-wrap">
        <p className="note" style={{ marginTop: 18 }}>{t(lang, 'privacy.updated')}</p>
        <hr />
        <article className="prose">
          {SECTIONS.map((s) => (
            <section key={s}><h2>{t(lang, `privacy.${s}.title` as MessageKey)}</h2><p>{t(lang, `privacy.${s}.body` as MessageKey)}</p></section>
          ))}
        </article>
      </div>
    </Shell>
  );
}
