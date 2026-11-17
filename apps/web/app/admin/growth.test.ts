import { describe, expect, it } from 'vitest';
import { en } from '@pohnch/messages';
import { asGrowth, growthRows, type Growth } from './growth';

const empty: Growth = { site: {}, signups: {}, people: {}, vans: { set_up: 0, tracked_week: 0 }, series: null, pages: [], installs: {} };

describe('v22 Growth panel rows', () => {
  it('shows every step from visit to app, in order, with zeros when nothing is counted yet', () => {
    const rows = growthRows(empty);
    expect(rows.map((r) => r.key)).toEqual(['admin.growth.visitors', 'admin.growth.views', 'admin.growth.testers', 'admin.growth.play', 'admin.growth.apk',
      'admin.growth.parents', 'admin.growth.drivers', 'admin.growth.schools', 'admin.growth.accounts', 'admin.growth.appParents', 'admin.growth.appDrivers']);
    expect(rows.every((r) => r.v.today === 0 && r.v.week === 0 && r.v.total === 0)).toBe(true);
  });
  it('takes each number from the right place', () => {
    const g: Growth = { ...empty, site: { visitor: { today: 3, week: 20, total: 40 } }, signups: { driver: { today: 0, week: 1, total: 1 } }, people: { accounts: { today: 1, week: 2, total: 4 } } };
    const by = Object.fromEntries(growthRows(g).map((r) => [r.key, r.v]));
    expect(by['admin.growth.visitors']).toEqual({ today: 3, week: 20, total: 40 });
    expect(by['admin.growth.drivers']?.week).toBe(1);
    expect(by['admin.growth.accounts']?.total).toBe(4);
  });
  it('has words for every row', () => {
    for (const r of growthRows(empty)) expect((en as Record<string, string>)[r.key]).toBeTruthy();
  });
  it('turns an empty or odd answer into zeros', () => {
    for (const raw of [null, [], 'x', {}]) {
      const g = asGrowth(raw);
      expect(growthRows(g).every((r) => r.v.total === 0)).toBe(true);
      expect(g.series).toEqual([]);
    }
  });
});
