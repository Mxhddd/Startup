// Morph (v9): an element flies from one screen to its place on the next, instead of the screens just
// swapping (no experimental flags: we measure, fly a copy in a top layer, then hand over).
//   1. The source (useMorphSource) measures where it is on screen when tapped and hands over a
//      drawing of itself ("ghost").
//   2. The next screen's MorphTarget measures where the same thing lands.
//   3. The ghost flies there on the morph spring while the target stays hidden; on landing the
//      target appears and the ghost fades. If the target never mounts, the ghost quietly fades away.
// Reduce Motion: no flight, the target just appears.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type ViewType = ComponentRef<typeof View>;

export const MORPH_SPRING = { damping: 24, stiffness: 210, mass: 1 } as const;

type Rect = { x: number; y: number; w: number; h: number };
type Flight = { key: string; from: Rect; ghost: ReactNode; at: number };
type Ctx = { launch: (f: Omit<Flight, 'at'>) => void; pending: (key: string) => Flight | null; land: (key: string, to: Rect, onDone: () => void) => void };

const MorphCtx = createContext<Ctx | null>(null);

function measure(ref: ViewType | null): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!ref) return resolve(null);
    ref.measureInWindow((x, y, w, h) => resolve(w > 0 ? { x, y, w, h } : null));
  });
}

export function MorphProvider({ children }: { children: ReactNode }) {
  const flight = useRef<Flight | null>(null);
  const [shown, setShown] = useState<{ ghost: ReactNode; from: Rect } | null>(null);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const o = useSharedValue(0);

  const clear = useCallback(() => setShown(null), []);

  const launch = useCallback((f: Omit<Flight, 'at'>) => {
    flight.current = { ...f, at: Date.now() };
    x.value = f.from.x;
    y.value = f.from.y;
    w.value = f.from.w;
    h.value = f.from.h;
    o.value = 1;
    setShown({ ghost: f.ghost, from: f.from });
    // If nothing lands within a second, fade the ghost away.
    setTimeout(() => {
      if (flight.current && flight.current.key === f.key) {
        flight.current = null;
        o.value = withTiming(0, { duration: 180 }, () => runOnJS(clear)());
      }
    }, 1000);
  }, [x, y, w, h, o, clear]);

  const pending = useCallback((key: string) => (flight.current && flight.current.key === key && Date.now() - flight.current.at < 1000 ? flight.current : null), []);

  const land = useCallback((key: string, to: Rect, onDone: () => void) => {
    if (!flight.current || flight.current.key !== key) return onDone();
    flight.current = null;
    x.value = withSpring(to.x, MORPH_SPRING);
    y.value = withSpring(to.y, MORPH_SPRING);
    w.value = withSpring(to.w, MORPH_SPRING);
    h.value = withSpring(to.h, MORPH_SPRING, (done) => {
      if (!done) return;
      runOnJS(onDone)();
      o.value = withTiming(0, { duration: 140 }, () => runOnJS(clear)());
    });
  }, [x, y, w, h, o, clear]);

  const style = useAnimatedStyle(() => ({ position: 'absolute', left: x.value, top: y.value, width: w.value, height: h.value, opacity: o.value }));

  return (
    <MorphCtx.Provider value={{ launch, pending, land }}>
      {children}
      {shown ? (
        <Animated.View pointerEvents="none" style={style}>
          {/* The ghost scales to the flying box. */}
          <View style={{ flex: 1 }}>{shown.ghost}</View>
        </Animated.View>
      ) : null}
    </MorphCtx.Provider>
  );
}

/** Put the returned ref on the thing that will fly; call fly(ghost) just before navigating. */
export function useMorphSource(key: string) {
  const ctx = useContext(MorphCtx);
  const ref = useRef<ViewType>(null);
  const reduce = useReducedMotion();
  const fly = useCallback(async (ghost: ReactNode) => {
    if (!ctx || reduce) return;
    const from = await measure(ref.current);
    if (from) ctx.launch({ key, from, ghost });
  }, [ctx, key, reduce]);
  return { ref, fly };
}

/** Where a flying element lands on the new screen. Hidden until the ghost arrives. */
export function MorphTarget({ morphKey, children, style }: { morphKey: string; children: ReactNode; style?: object }) {
  const ctx = useContext(MorphCtx);
  const ref = useRef<ViewType>(null);
  const [hidden, setHidden] = useState(() => !!ctx?.pending(morphKey));
  useEffect(() => {
    if (!hidden || !ctx) return;
    let alive = true;
    // Give the screen's own entrance a moment to lay out, then measure and land.
    // v21: measure on the next frame (was a fixed 60 ms wait).
    const id = requestAnimationFrame(async () => {
      const to = await measure(ref.current);
      if (!alive) return;
      if (!to) return setHidden(false);
      ctx.land(morphKey, to, () => alive && setHidden(false));
    });
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, [hidden, ctx, morphKey]);
  return (
    <View ref={ref} collapsable={false} style={[style, { opacity: hidden ? 0 : 1 }]}>
      {children}
    </View>
  );
}
