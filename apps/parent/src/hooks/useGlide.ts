// Moves the van marker smoothly from where it was to the new position over about a second,
// instead of jumping every 5 seconds.
import { lerpLatLng, type LatLng } from '@pohnch/core';
import { useEffect, useRef, useState } from 'react';

export function useGlide(target: LatLng | null, durationMs = 1000): LatLng | null {
  const [shown, setShown] = useState<LatLng | null>(target);
  const from = useRef<LatLng | null>(target);
  useEffect(() => {
    if (!target) {
      setShown(null);
      from.current = null;
      return;
    }
    const start = from.current ?? target;
    const t0 = Date.now();
    let frame = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - t0) / durationMs);
      const p = lerpLatLng(start, target, t);
      setShown(p);
      from.current = p;
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target?.latitude, target?.longitude, durationMs]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}
