// The 404 page (v14): the van drawing, and the way home, in both languages.
import { t } from '@pohnch/messages';
import { PageHead } from './_components/PageHead';
import { Shell } from './Shell';

export default function NotFound() {
  return (
    <Shell lang="ur" otherHref="/en">
      <PageHead title={t('ur', 'site.nf.title')} lead={t('ur', 'site.nf.body')} />
      <div className="ed-wrap">
        <p className="lede" lang="en" dir="ltr" style={{ fontFamily: 'var(--font-latin), sans-serif' }}>{t('en', 'site.nf.body')}</p>
        <div className="cta-row"><a className="pill" href="/">{t('ur', 'site.nf.home')} · <span lang="en">{t('en', 'site.nf.home')}</span></a></div>
      </div>
    </Shell>
  );
}
