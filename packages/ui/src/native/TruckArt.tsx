// v21: truck art in the apps, from the same motif library as pohnch.pk (packages/ui/src/truckart.ts), so
// the apps and the website are one hand. Drawn with react-native-svg's SvgXml from the very same strings.
// - TruckBand: a repeating band (chamak tape, a vine, or a jhalar fringe) across any width.
// - ChamakStrip: the thin foil strip set inside the top of a card, like the website's .module.
// - Rose: a painted rose, for a corner or a seal.
// Rule (CLAUDE.md): ornament is for brand moments and the parent app's cards. Driver working screens stay
// plain: the driver app never turns `ornament` on, so its cards stay plain too.
import { memo, useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { chamakTile, jhalarTile, roseSvg, vineTile } from '../truckart';

let ornament = false;
/** The parent app turns this on at start-up; cards (Group) then wear the website's gilt hairline and foil. */
export function setOrnament(on: boolean) {
  ornament = on;
}
export const ornamentOn = () => ornament;

type Kind = 'chamak' | 'vine' | 'jhalar';
const tileWidth = (kind: Kind, h: number) => (kind === 'jhalar' ? h * 0.62 * 3 : h * 4);
const tileXml = (kind: Kind, h: number, seed: number) => (kind === 'vine' ? vineTile(h) : kind === 'jhalar' ? jhalarTile(h) : chamakTile(h, seed));

/** A band of one motif repeated across the width it is given (measured once). */
export const TruckBand = memo(function TruckBand({ kind, height, seed = 0, style, flip = false }: { kind: Kind; height: number; seed?: number; style?: StyleProp<ViewStyle>; flip?: boolean }) {
  const [w, setW] = useState(0);
  const xml = useMemo(() => tileXml(kind, height, seed), [kind, height, seed]);
  const tw = tileWidth(kind, height);
  const n = w > 0 ? Math.ceil(w / tw) + 1 : 0;
  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      onLayout={(e) => { const nw = Math.round(e.nativeEvent.layout.width); if (nw !== w) setW(nw); }}
      style={[{ height, overflow: 'hidden', flexDirection: 'row', transform: flip ? [{ scaleY: -1 }] : undefined }, style]}>
      {Array.from({ length: n }, (_, i) => <SvgXml key={i} xml={xml} width={tw} height={height} />)}
    </View>
  );
});

/** The foil strip inside the top of a card (website .module::before: inset 10px 22px, 8px tall, rounded). */
export function ChamakStrip({ seed = 0 }: { seed?: number }) {
  return <TruckBand kind="chamak" height={8} seed={seed} style={{ position: 'absolute', top: 10, left: 22, right: 22, borderRadius: 999, opacity: 0.95 }} />;
}

/** A painted rose with two leaves. */
export const Rose = memo(function Rose({ size = 40, leaves = true }: { size?: number; leaves?: boolean }) {
  const xml = useMemo(() => roseSvg(size, leaves), [size, leaves]);
  return <SvgXml xml={xml} width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
});
