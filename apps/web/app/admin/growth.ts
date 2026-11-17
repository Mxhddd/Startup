// v22 Growth panel: the shape of admin_growth()'s answer and the panel's rows, kept apart from the page so it can be tested.
import type { MessageKey } from '@pohnch/messages';

export type Tri = { today: number; week: number; total: number };
export type Growth = {
  site: Partial<Record<'view' | 'visitor' | 'click_testers' | 'click_play' | 'click_apk', Tri>>;
  signups: Partial<Record<'parent' | 'driver' | 'school', Tri>>;
  people: Partial<Record<'accounts' | 'parents' | 'drivers', Tri>>;
  vans: { set_up: number; tracked_week: number };
  series: { day: string; views: number; visitors: number; signups: number }[] | null;
  pages: { page: string; views: number }[];
  installs: Partial<Record<'parent' | 'driver', { installs: number; day: string }>>;
};
const ZERO: Tri = { today: 0, week: 0, total: 0 };
/** The rows of the Growth table, in the order a visitor moves: see the site, tap download, sign up, use the app. */
/** Fills in anything missing, so an empty or partial answer shows zeros instead of breaking the page. */
export function asGrowth(raw: unknown): Growth {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Partial<Growth>) : {};
  return { site: o.site ?? {}, signups: o.signups ?? {}, people: o.people ?? {}, vans: o.vans ?? { set_up: 0, tracked_week: 0 },
    series: Array.isArray(o.series) ? o.series : [], pages: Array.isArray(o.pages) ? o.pages : [], installs: o.installs ?? {} };
}
export function growthRows(g: Growth): { key: MessageKey; v: Tri }[] {
  return [
    { key: 'admin.growth.visitors', v: g.site.visitor ?? ZERO },
    { key: 'admin.growth.views', v: g.site.view ?? ZERO },
    { key: 'admin.growth.testers', v: g.site.click_testers ?? ZERO },
    { key: 'admin.growth.play', v: g.site.click_play ?? ZERO },
    { key: 'admin.growth.apk', v: g.site.click_apk ?? ZERO },
    { key: 'admin.growth.parents', v: g.signups.parent ?? ZERO },
    { key: 'admin.growth.drivers', v: g.signups.driver ?? ZERO },
    { key: 'admin.growth.schools', v: g.signups.school ?? ZERO },
    { key: 'admin.growth.accounts', v: g.people.accounts ?? ZERO },
    { key: 'admin.growth.appParents', v: g.people.parents ?? ZERO },
    { key: 'admin.growth.appDrivers', v: g.people.drivers ?? ZERO },
  ];
}
