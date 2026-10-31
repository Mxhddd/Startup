// Urdu text with times and numbers in it ("رفیق بھائی نے مارک کیا · 7:12").
// Digits use Manrope and must read left to right, so we split text into runs and isolate the Latin ones.

export type Run = { text: string; latin: boolean };

const LATIN_RUN = /[A-Za-z0-9][A-Za-z0-9:.,'’/%+\- ]*[A-Za-z0-9%]|[A-Za-z0-9]/g;

/** Splits text into Latin/digit runs and the rest, keeping every character. */
export function splitRuns(text: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  for (const m of text.matchAll(LATIN_RUN)) {
    const start = m.index ?? 0;
    if (start > last) runs.push({ text: text.slice(last, start), latin: false });
    runs.push({ text: m[0], latin: true });
    last = start + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), latin: false });
  return runs;
}

/** Unicode isolate marks: keep a run left to right inside right-to-left text. */
export const LRI = '⁦';
export const PDI = '⁩';

export function isolateLtr(text: string): string {
  return LRI + text + PDI;
}
