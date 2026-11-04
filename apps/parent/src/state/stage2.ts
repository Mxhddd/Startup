// v10: is stage 2 switched on for this family? Asked once per app start (and again after login), so
// the menu can show stage 2 only when the Pohnch team has turned it on. Off means stage 1 exactly.
import { stage2 } from '@pohnch/client';
import { useEffect, useState } from 'react';

let cached: boolean | null = null;

export function useStage2(): boolean {
  const [on, setOn] = useState(cached ?? false);
  useEffect(() => {
    let live = true;
    stage2.stage2On().then((v) => {
      cached = v;
      if (live) setOn(v);
    });
    return () => {
      live = false;
    };
  }, []);
  return on;
}
