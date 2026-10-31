// Small input checks for the Edge Function. Anything that fails is a 400 with the field's name only.

export class BadInput extends Error {
  constructor(public field: string) {
    super(`bad_input:${field}`);
  }
}

type Body = Record<string, unknown>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuid(b: Body, k: string): string {
  const v = b[k];
  if (typeof v !== 'string' || !UUID.test(v)) throw new BadInput(k);
  return v.toLowerCase();
}

export function optionalUuid(b: Body, k: string): string | null {
  return b[k] == null ? null : uuid(b, k);
}

export function uuids(b: Body, k: string, max = 6): string[] {
  const v = b[k];
  if (!Array.isArray(v) || v.length === 0 || v.length > max) throw new BadInput(k);
  return v.map((_, i) => uuid({ x: v[i] }, 'x'));
}

export function oneOf<T extends string>(b: Body, k: string, options: readonly T[]): T {
  const v = b[k];
  if (typeof v !== 'string' || !(options as readonly string[]).includes(v)) throw new BadInput(k);
  return v as T;
}

export function bool(b: Body, k: string, fallback?: boolean): boolean {
  const v = b[k];
  if (v === undefined && fallback !== undefined) return fallback;
  if (typeof v !== 'boolean') throw new BadInput(k);
  return v;
}

export function num(b: Body, k: string, min: number, max: number, optional = false): number | null {
  const v = b[k];
  if (v == null && optional) return null;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new BadInput(k);
  return v;
}

export function isoTime(b: Body, k: string): string {
  const v = b[k];
  if (typeof v !== 'string' || Number.isNaN(Date.parse(v))) throw new BadInput(k);
  return new Date(v).toISOString();
}

export function date(b: Body, k: string): string {
  const v = b[k];
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new BadInput(k);
  return v;
}

/** Pakistani mobile numbers in international form: +923001234567. Accepts 03001234567 too. */
export function phone(b: Body, k: string): string {
  const v = b[k];
  if (typeof v !== 'string') throw new BadInput(k);
  const digits = v.replace(/[\s-]/g, '');
  const m = /^(?:\+92|0092|0)?(3\d{9})$/.exec(digits);
  if (!m) throw new BadInput(k);
  return '+92' + m[1];
}
