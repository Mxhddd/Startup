// The live area meter in words (v19): "Gulshan-e-Iqbal: 3–9 families waiting · a driver interested ·
// needs a few more families". Only bands and a status come from the server (see areaMeter() in
// packages/core); this turns them into a line in either language. Pure, tested.
import type { AreaMeter } from '@pohnch/core';

type W = Record<string, string | undefined>;
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

/** The parts of the line: families, driver, what the area needs. Null when no one has signed up there. */
export function meterParts(w: W, m: AreaMeter | undefined): { families: string; driver: string; status: string } | null {
  if (!m) return null;
  const families = m.f ? `${w[`meter.f.${m.f}`] ?? ''} ${w['meter.waiting'] ?? ''}`.trim() : w['meter.f.none'] ?? '';
  const driver = w[`meter.d.${m.d}`] ?? '';
  const status = m.s === 'ready' || m.s === 'needs-driver' ? w[`meter.s.${m.s}`] ?? '' : w[`meter.s.${m.s}.${m.m ?? 'several'}`] ?? '';
  return { families, driver, status };
}
/** The whole line for an area, or the invitation to be the first. */
export function meterLine(w: W, label: string, m: AreaMeter | undefined): string {
  const p = meterParts(w, m);
  if (!p) return fill(w['meter.empty'] ?? '', { area: label });
  return `${label}: ${p.families} · ${p.driver} · ${p.status}`;
}
