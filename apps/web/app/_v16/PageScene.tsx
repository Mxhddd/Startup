'use client';
// The top of an inner page (v18): its own scene of the 3D city. Everyone first sees the still picture of
// that scene; on a desktop with a fine pointer and WebGL 2 (and no reduced motion or data saving), the
// live city loads behind it, drifts slowly, and fades in over the still. It draws only while the top of
// the page is on screen, and a little less often than the home page (it is a backdrop).
import { useEffect, useRef, useState } from 'react';
import { TS } from './Demos';
import { drifted, pageState, stillFor, type PageId } from './pageScenes';
import type { WorldWords } from './world3d';

function canGoLive(): boolean {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth < 920) return false;
  const n = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (n.connection?.saveData || (n.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4) return false;
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export function PageScene({ id, words }: { id: PageId; words: WorldWords }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = canvas.current; if (!el || !canGoLive()) return;
    let stopped = false, raf = 0, visible = true, world: import('./world3d').World | null = null;
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible && world && !raf) raf = requestAnimationFrame(loop); }, { threshold: 0 });
    io.observe(el);
    const base = pageState(id);
    let last = 0;
    const loop = (now: number) => {
      raf = 0; if (stopped || !world || !visible) return;
      if (now - last > 40) { last = now; world.setState(drifted(base, (now / 1000) * TS)); }
      raf = requestAnimationFrame(loop);
    };
    void import('./world3d').then((m) => {
      if (stopped) return;
      try { world = m.createWorld(el, { quality: 'mid', words }); world.setState(base); setLive(true); raf = requestAnimationFrame(loop); } catch { /* the still stays */ }
    });
    const onR = () => world?.resize(); addEventListener('resize', onR);
    return () => { stopped = true; cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', onR); world?.dispose(); };
  }, [id, words]);
  return (
    <div className={`pscene ${live ? 'live' : ''}`} aria-hidden="true">
      <picture>
        <source media="(max-width: 760px)" srcSet={stillFor(id, true)} />
        <img src={stillFor(id)} alt="" width={1600} height={1000} fetchPriority="high" />
      </picture>
      <canvas ref={canvas} />
    </div>
  );
}
