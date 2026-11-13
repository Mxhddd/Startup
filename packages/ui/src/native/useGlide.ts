// Draws the van smoothly between real positions (v9 glide, packages/core/src/glide.ts): it keeps
// rolling the way it was going for a few seconds (so it never stalls between positions), and when a
// new position arrives it eases into it along a curve (so it never jumps). Stops when the trip does.
// v21: moved into the map itself (GlidingVan in PohnchMap), so each frame redraws only the van marker,
// not the whole map and the screen around it (that used to compete with taps during a live trip).
import { glidePosition, type GlideState, type LatLng } from '@pohnch/core';
import { useEffect, useRef, useState } from 'react';

export function useGlide(target: LatLng | null, frozen = false): LatLng | null {
  const [shown, setShown] = useState<LatLng | null>(target);
  const state = useRef<GlideState | null>(null);
  const drawn = useRef<LatLng | null>(target);

  // A new real position: remember it (and the one before), starting the ease from where the van is drawn.
  useEffect(() => {
    if (!target) {
      state.current = null;
      drawn.current = null;
      setShown(null);
      return;
    }
    const now = Date.now();
    const old = state.current;
    state.current = {
      prev: old ? old.last : null,
      last: { at: now, p: target },
      from: drawn.current ?? target,
      fromAt: now,
    };
  }, [target?.latitude, target?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  // One frame loop while there is a van to draw. A stale signal (frozen) stops it rolling ahead.
  useEffect(() => {
    let frame = 0;
    let lastPaint = 0;
    const tick = () => {
      const s = state.current;
      if (s) {
        const now = Date.now();
        // About 30 updates a second is plenty for a marker and spares the battery.
        if (now - lastPaint > 32) {
          lastPaint = now;
          const p = frozen ? s.last.p : glidePosition(s, now);
          drawn.current = p;
          setShown(p);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [frozen]);

  return shown;
}
