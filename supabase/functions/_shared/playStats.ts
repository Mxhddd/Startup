// Google Play install numbers (v23). Play Console writes a monthly CSV per app into the developer
// account's Cloud Storage bucket (stats/installs/installs_<package>_<YYYYMM>_overview.csv), updated about
// once a day with a day or two of delay. These are pure helpers so they can be tested without Google:
// which files to read, and how to read one (UTF-16 with a header row). Nothing personal is in these files.

export const PACKAGES = { parent: 'pk.pohnch.parent', driver: 'pk.pohnch.driver' } as const;
export type App = keyof typeof PACKAGES;
export type InstallDay = { day: string; total: number; daily: number };

/** This month and last month as YYYYMM (Karachi date), newest first: a new month's file starts empty. */
export function monthsToRead(now: Date): string[] {
  const k = new Date(now.getTime() + 5 * 3600_000);
  const y = k.getUTCFullYear(), m = k.getUTCMonth();
  const ym = (yy: number, mm: number) => `${yy}${String(mm + 1).padStart(2, '0')}`;
  return [ym(y, m), m === 0 ? ym(y - 1, 11) : ym(y, m - 1)];
}

export function objectName(app: App, yyyymm: string): string {
  return `stats/installs/installs_${PACKAGES[app]}_${yyyymm}_overview.csv`;
}

/** Play's CSVs are UTF-16LE with a byte-order mark; fall back to UTF-8 for anything else. */
export function decodeCsv(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  return new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
}

const num = (s: string | undefined) => {
  const n = Number((s ?? '').replace(/[^0-9-]/g, ''));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

/** One row per day: "Total User Installs" (people who have it now, on any device) and "Daily User Installs". */
export function parseInstalls(csv: string): InstallDay[] {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const head = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const at = (name: string) => head.indexOf(name);
  const iDay = at('date'), iTotal = at('total user installs'), iDaily = at('daily user installs');
  const iDevice = at('daily device installs');
  if (iDay < 0 || (iTotal < 0 && iDaily < 0 && iDevice < 0)) return [];
  const out: InstallDay[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    const day = (c[iDay] ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    out.push({ day, total: iTotal >= 0 ? num(c[iTotal]) : 0, daily: iDaily >= 0 ? num(c[iDaily]) : num(c[iDevice]) });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day));
}

/** The newest few days across the files read, without duplicates. */
export function latestDays(rows: InstallDay[], n = 14): InstallDay[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-n);
}
