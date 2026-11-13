// v11 (canvas "Z11-Transition"): pages open through an arch. Tap something, and an arch of neel light
// with our star pattern grows out of it until it fills the screen; the next page is opened behind it;
// then the arch lifts away (fades and keeps growing) to reveal the page. About 0.45 s in all, and (v21) the
// page itself opens on the tap, not after the arch.
// Reduce Motion: no arch; the page simply opens.
import { createContext, useCallback, useContext, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';
import { ArchShape } from './Arch';
import { feel } from './feedback';
import { curves } from '../motion';

type ViewRef = ComponentRef<typeof View>;
type Ctx = { open: (from: ViewRef | null, go: () => void) => void };
const WipeCtx = createContext<Ctx | null>(null);

export function ArchWipeProvider({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const s = useSharedValue(0);
  const o = useSharedValue(0);
  const busy = useRef(false);
  // The arch is drawn at full screen size (a bit wider than the screen so its sides are off it) and scaled.
  const W = width * 1.3;
  const H = height * 1.25;

  const done = useCallback(() => {
    busy.current = false;
    setAt(null);
  }, []);

  const open = useCallback((from: ViewRef | null, go: () => void) => {
    if (reduce || busy.current || !from) return go();
    busy.current = true;
    from.measureInWindow((x, y, w, h) => {
      setAt({ x: x + w / 2, y: y + h / 2 });
      s.value = 0.06;
      o.value = 1;
      feel('sheetUp');
      // v21: the page opens straight away (the tap acts at once); the arch only dresses the change, growing
      // over the new page as it slides in, then lifting away.
      go();
      s.value = withTiming(1, { duration: 200, easing: Easing.bezier(...curves.calm) }, (fin) => {
        if (!fin) return;
        s.value = withTiming(1.25, { duration: 260, easing: Easing.out(Easing.quad) });
        o.value = withTiming(0, { duration: 260 }, () => runOnJS(done)());
      });
    });
  }, [reduce, s, o, done]);

  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <WipeCtx.Provider value={{ open }}>
      {children}
      {at ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          {/* Grows from the tapped point toward the whole screen. */}
          <Animated.View style={[{ position: 'absolute', left: at.x - W / 2, top: at.y - H * 0.42, width: W, height: H, transformOrigin: `50% 42%` }, style]}>
            <ArchShape width={W} height={H} rise={W * 0.6} color={colors.neel} gradient={[colors.headerTop, colors.headerBottom]} pattern />
          </Animated.View>
        </View>
      ) : null}
    </WipeCtx.Provider>
  );
}

/** open(viewRef, navigate): the arch grows out of that view, then navigate() runs behind it. */
export function useArchWipe(): Ctx {
  return useContext(WipeCtx) ?? { open: (_f, go) => go() };
}
