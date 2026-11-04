// v11: a gradient that draws the same on phones and on the web (react-native-svg), filling its parent.
// Linear: top to bottom (or left to right with horizontal); radial: from the centre of the box out.
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

let gid = 0;
export type GradientStop = [offset: number, color: string, opacity?: number];

export function Gradient({ stops, radial = false, horizontal = false, style }: { stops: GradientStop[]; radial?: boolean; horizontal?: boolean; style?: StyleProp<ViewStyle> }) {
  const id = `gr${++gid}`;
  const s = stops.map(([o, c, a], i) => <Stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />);
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          {radial ? (
            <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">{s}</RadialGradient>
          ) : (
            <LinearGradient id={id} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>{s}</LinearGradient>
          )}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
