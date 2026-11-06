// The 404 page (v13): a lost van on a paper street at dusk, and the way home.
import { t } from '@pohnch/messages';
import { PageHead } from './_components/PageHead';
import { Shell } from './Shell';

export default function NotFound() {
  return (
    <Shell lang="ur" otherHref="/en">
      <PageHead title={t('ur', 'site.nf.title')} ur time="evening" />
      <div className="wrap section" style={{ paddingTop: 40, display: 'grid', gap: 18, justifyItems: 'start' }}>
        <p className="lead">{t('ur', 'site.nf.body')}</p>
        <p className="lead latin" lang="en" dir="ltr">{t('en', 'site.nf.body')}</p>
        <a className="key key-neel" href="/" style={{ height: 56, padding: '0 22px', fontSize: 17 }}>{t('ur', 'site.nf.home')} · <span lang="en" className="latin">{t('en', 'site.nf.home')}</span></a>
      </div>
    </Shell>
  );
}
