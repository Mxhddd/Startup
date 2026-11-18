// /van-uncle (v24): the shareable "Which Van Uncle do you have?" quiz. ?r=<type> opens a friend's result.
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { VanUncleQuiz } from '../_v16/VanUncle';
import { asType } from '../_lib/vanUncle';
import { pageMeta } from '../_lib/meta';

const L = 'en' as const;
type P = { searchParams: Promise<{ r?: string }> };
export async function generateMetadata({ searchParams }: P): Promise<Metadata> {
  const r = asType((await searchParams).r);
  const title = r ? `${t(L, 'web.vu.kick')} ${t(L, `web.vu.${r}` as never)} 😂` : t(L, 'web.vu.meta');
  return pageMeta(L, '/van-uncle', title, t(L, 'web.vu.lead'));
}
export default async function Page({ searchParams }: P) {
  return <VanUncleQuiz lang={L} shared={(await searchParams).r ?? null} />;
}
