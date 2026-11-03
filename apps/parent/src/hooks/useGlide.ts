// Moves the van marker smoothly from where it was to the new position, instead of jumping every
// 5 seconds. The glide lasts about as long as the gap between positions, so the van keeps rolling at
// an even speed (like a ride-hailing app) instead of dashing and stopping.
import { lerpLatLng, type LatLng } from '@pohnch/core';
import { durations } from '@pohnch/ui';
import { useEffect, useRef, useState } from 'react';

const MIN_MS = 800;

export function useGlide(target: LatLng | null): LatLng | null {
  const [shown, setShown] = useState<LatLng | null>(target);
  const from = useRef<LatLng | null>(target);
  const lastAt = useRef<number | null>(null);
  useEffect(() => {
    if (!target) {
      setShown(null);
      from.current = null;
      lastAt.current = null;
      return;
    }
    const now = Date.now();
    const gap = lastAt.current === null ? MIN_MS : now - lastAt.current;
    lastAt.current = now;
    const duration = Math.min(durations.glide, Math.max(MIN_MS, gap));
    const start = from.current ?? target;
    const t0 = now;
    let frame = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - t0) / duration);
      const p = lerpLatLng(start, target, t);
      setShown(p);
      from.current = p;
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target?.latitude, target?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}
