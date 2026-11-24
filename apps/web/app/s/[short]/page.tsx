// pohnch.pk/s/<short> (v24): a school's pilot progress, for the school to share with its parents.
// A number only ("38 of 50 families"), never names; the button opens the sign-up with the school filled in.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { t } from '@pohnch/messages';
import { schoolProgress } from '../../_lib/interest';
import { pageMeta } from '../../_lib/meta';
import '../../_v16/tokens.css';

type P = { params: Promise<{ short: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await schoolProgress((await params).short);
  return pageMeta('en', `/s/${(await params).short}`, p ? t('en', 'web.school.title', { name: p.name }) : 'Pohnch', p ? t('en', 'web.school.meta', { n: p.families, goal: p.goal }) : '');
}

export default async function SchoolPage({ params }: P) {
  const short = (await params).short.toLowerCase();
  const p = await schoolProgress(short);
  if (!p) notFound();
  const pct = Math.min(100, Math.round((p.families / p.goal) * 100));
  const done = p.families >= p.goal;
  const join = `/?school=${encodeURIComponent(p.name)}#join`;
  return (
    <main className="v16" style={{ minHeight: '100vh', background: 'var(--neel, #1F2A5C)', color: '#FBF7EF', display: 'grid', placeItems: 'center', padding: '40px max(16px, env(safe-area-inset-left, 0px))' }}>
      <div style={{ width: 'min(560px, 100%)', display: 'grid', gap: 22, textAlign: 'center' }}>
        <p lang="ur" dir="rtl" style={{ margin: 0, fontFamily: 'var(--font-display), serif', fontSize: 56, color: '#E8A33D', lineHeight: 1.6 }}>پہنچ</p>
        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.25 }}>{p.name}</h1>
        <p style={{ margin: 0, fontSize: 18, color: '#C9D0E6' }}>{done ? t('en', 'web.school.ready') : t('en', 'web.school.goal', { goal: p.goal })}</p>
        <div data-testid="school-count" style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2, fontVariantNumeric: 'tabular-nums' }}>
          {p.families}<span style={{ fontSize: 28, color: '#C9D0E6', fontWeight: 700 }}> / {p.goal}</span>
        </div>
        <div aria-hidden="true" style={{ height: 16, borderRadius: 8, background: 'rgba(251,247,239,0.18)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: done ? '#17705A' : '#E8A33D', borderRadius: 8 }} />
        </div>
        <p style={{ margin: 0, fontSize: 16, color: '#C9D0E6' }}>{t('en', 'web.school.joined')}</p>
        <a href={join} style={{ justifySelf: 'center', background: '#E8A33D', color: '#141A33', fontWeight: 800, fontSize: 18, borderRadius: 999, padding: '16px 28px', textDecoration: 'none', minHeight: 48 }}>{t('en', 'web.school.join')}</a>
        <p lang="ur" dir="rtl" style={{ margin: 0, fontSize: 17, color: '#C9D0E6', fontFamily: 'var(--font-urdu), sans-serif', lineHeight: 1.8 }}>
          {done ? t('ur', 'web.school.ready') : t('ur', 'web.school.goal', { goal: p.goal })}
        </p>
      </div>
    </main>
  );
}
