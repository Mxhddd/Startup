'use client';
// The rich-but-calm interaction kit (v18), for desktop pointers only, and never with reduced motion:
// - buttons (.btn, [data-magnet]) lean a few pixels toward the cursor;
// - cards with [data-tilt] tilt at most 4° under the cursor;
// - useCountUp(): a number counts up to its value when it changes (instantly with reduced motion).
// It only listens to the pointer; nothing runs while the visitor scrolls.
import { useEffect, useRef, useState } from 'react';

export function initDelight(root: HTMLElement): () => void {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return () => {};
  let raf = 0, px = 0, py = 0, target: Element | null = null;
  const reset = (el: Element | null) => { if (!el) return; const h = el as HTMLElement; h.style.removeProperty('--mx'); h.style.removeProperty('--my'); h.style.removeProperty('--rx'); h.style.removeProperty('--ry'); };
  const apply = () => {
    raf = 0;
    const el = target as HTMLElement | null; if (!el) return;
    const r = el.getBoundingClientRect(), dx = (px - (r.left + r.width / 2)) / (r.width / 2), dy = (py - (r.top + r.height / 2)) / (r.height / 2);
    if (el.matches('[data-tilt]')) { el.style.setProperty('--rx', `${(-dy * 4).toFixed(2)}deg`); el.style.setProperty('--ry', `${(dx * 4).toFixed(2)}deg`); }
    else { el.style.setProperty('--mx', `${(dx * 5).toFixed(1)}px`); el.style.setProperty('--my', `${(dy * 4).toFixed(1)}px`); }
  };
  const move = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.('.btn, [data-magnet], [data-tilt]') ?? null;
    if (el !== target) { reset(target); target = el && root.contains(el) ? el : null; }
    px = e.clientX; py = e.clientY; if (target && !raf) raf = requestAnimationFrame(apply);
  };
  const leave = () => { reset(target); target = null; };
  root.addEventListener('pointermove', move, { passive: true }); root.addEventListener('pointerleave', leave);
  return () => { root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); reset(target); };
}

/** Counts from the previous value up (or down) to `value` over ~0.9 s; jumps with reduced motion. */
export function useCountUp(value: number, ms = 900): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current; from.current = value;
    if (start === value || matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (now: number) => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); setShown(Math.round(start + (value - start) * e)); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}
