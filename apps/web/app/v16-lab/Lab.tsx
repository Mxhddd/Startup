'use client';
import { useEffect, useRef } from 'react';
import { createWorld, type WorldState } from '../_v16/world3d';
export function Lab() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const w = createWorld(ref.current!);
    let s: WorldState = { pose: { tx: -52, tz: 70, dist: 230, az: 1.1, el: 0.62, fov: 22 }, hour: 0.4, grey: 0, lit: 1, u: 0.2, brake: false, school: 0, homePin: 1 };
    (window as unknown as { __lab: unknown }).__lab = { set: (p: Partial<WorldState>) => { s = { ...s, ...p, pose: { ...s.pose, ...(p.pose ?? {}) } }; } };
    let raf = 0; const loop = () => { w.setState(s); raf = requestAnimationFrame(loop); }; loop();
    const onR = () => w.resize(); addEventListener('resize', onR);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onR); w.dispose(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block' }} />;
}
