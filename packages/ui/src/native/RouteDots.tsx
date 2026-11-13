// Progress as the logo draws it (v5 "home" sheet): stops passed are solid neel dots joined by solid
// lines, the van is a larger dot with a soft ring, the road still ahead is dashed, and your home is the
// zamurrad dot at the end. Runs right to left in Urdu. The van's dot glides along when it moves on.
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors } from '../theme';

function Dash({ solid, dark }: { solid: boolean; dark: boolean }) {
  const c = dark ? colors.onBrand : colors.link;
  if (solid) return <View style={{ flex: 1, height: 4, borderRadius: 2, borderCurve: 'continuous', backgroundColor: c }} />;
  return (
    <View style={{ flex: 1, height: 4, flexDirection: 'row', gap: 5, overflow: 'hidden' }}>
      {Array.from({ length: 8 }, (_, i) => (
        <View key={i} style={{ width: 6, height: 4, borderRadius: 2, borderCurve: 'continuous', backgroundColor: c, opacity: dark ? 0.5 : 0.8 }} />
      ))}
    </View>
  );
}

export function RouteDots({ total, done, tone = 'light' }: { total: number; done: number; tone?: 'light' | 'dark' }) {
  const { dir } = useLang();
  const dark = tone === 'dark';
  const main = dark ? colors.onBrand : colors.link;
  const n = Math.max(1, total);
  const at = Math.min(Math.max(0, done), n); // the van sits after the last stop passed
  const parts: ReactNode[] = [];
  for (let i = 0; i <= n; i++) {
    const isEnd = i === n;
    const isVan = i === at && !isEnd;
    if (isEnd) {
      parts.push(<View key="end" style={{ width: 18, height: 18, borderRadius: 9, borderCurve: 'continuous', backgroundColor: colors.zamurrad, boxShadow: `0px 0px 0px 4px ${dark ? 'rgba(167,212,126,0.45)' : colors.zamurradTint}` }} />);
    } else if (isVan) {
      parts.push(
        <Animated.View key="van" layout={LinearTransition.springify().damping(springs.layout.damping).stiffness(springs.layout.stiffness)} style={{ width: 22, height: 22, borderRadius: 11, borderCurve: 'continuous', backgroundColor: dark ? colors.kesar : colors.neel, boxShadow: `0px 0px 0px 5px ${dark ? 'rgba(232,163,61,0.3)' : colors.neelTint}` }} />,
      );
    } else if (i < at) {
      parts.push(<View key={i} style={{ width: 14, height: 14, borderRadius: 7, borderCurve: 'continuous', backgroundColor: main }} />);
    } else {
      parts.push(<View key={i} style={{ width: 14, height: 14, borderRadius: 7, borderCurve: 'continuous', borderWidth: 3, borderColor: main, opacity: dark ? 0.6 : 1 }} />);
    }
    if (!isEnd) parts.push(<Dash key={`d${i}`} solid={i < at} dark={dark} />);
  }
  return (
    <View
      testID="route-dots"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, minHeight: 28 }}
    >
      {parts}
    </View>
  );
}
