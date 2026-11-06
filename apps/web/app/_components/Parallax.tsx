'use client';
// Moves the layers inside it apart: sets --mx/--my from the pointer (or the phone's tilt) and --sy
// from how far the box has scrolled. The CSS in site.css does the moving; nothing moves with
// "reduce motion".
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export function Parallax({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let mx = 0, my = 0;
    const paint = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const sy = Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height)));
      el.style.setProperty('--mx', mx.toFixed(3));
      el.style.setProperty('--my', my.toFixed(3));
      el.style.setProperty('--sy', sy.toFixed(3));
    };
    const ask = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const onMove = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1; ask(); };
    const onTilt = (e: DeviceOrientationEvent) => { if (e.gamma == null || e.beta == null) return; mx = Math.max(-1, Math.min(1, e.gamma / 25)); my = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); ask(); };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    window.addEventListener('scroll', ask, { passive: true });
    paint();
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onTilt); window.removeEventListener('scroll', ask); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return <div ref={ref} className={className} style={style}>{children}</div>;
}
