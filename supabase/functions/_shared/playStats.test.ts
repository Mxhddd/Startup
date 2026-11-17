import { describe, expect, it } from 'vitest';
import { decodeCsv, latestDays, monthsToRead, objectName, parseInstalls } from './playStats';

const CSV = 'Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Daily Device Upgrades,Total User Installs,Daily User Installs,Daily User Uninstalls,Active Device Installs\n'
  + '2026-11-15,pk.pohnch.parent,3,0,0,12,3,0,11\n2026-11-16,pk.pohnch.parent,2,1,0,13,2,1,12\n';

describe('Google Play installs', () => {
  it('reads this month and last month, in Karachi time', () => {
    expect(monthsToRead(new Date('2026-11-17T10:00:00Z'))).toEqual(['202611', '202610']);
    expect(monthsToRead(new Date('2026-12-31T20:00:00Z'))).toEqual(['202701', '202612']);
  });
  it('names the overview file for each app', () => {
    expect(objectName('parent', '202611')).toBe('stats/installs/installs_pk.pohnch.parent_202611_overview.csv');
  });
  it('decodes Play\'s UTF-16 files', () => {
    const bytes = new Uint8Array([0xff, 0xfe, ...[...'Date'].flatMap((ch) => [ch.charCodeAt(0), 0])]);
    expect(decodeCsv(bytes)).toBe('Date');
  });
  it('reads total and daily user installs per day', () => {
    expect(parseInstalls(CSV)).toEqual([{ day: '2026-11-15', total: 12, daily: 3 }, { day: '2026-11-16', total: 13, daily: 2 }]);
  });
  it('ignores files without the expected columns and keeps the newest days once', () => {
    expect(parseInstalls('hello\nworld')).toEqual([]);
    const rows = [...parseInstalls(CSV), { day: '2026-11-16', total: 14, daily: 3 }];
    expect(latestDays(rows, 1)).toEqual([{ day: '2026-11-16', total: 14, daily: 3 }]);
  });
});
