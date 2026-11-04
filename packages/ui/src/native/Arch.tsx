// v10 "Jharoka": the pointed Mughal arch, drawn once (archPath in theme.ts) and used everywhere on the
// parent side: avatars, the van badge, the join and story cards, widget art. The driver app does not
// use it (its screens stay plain).
//   ArchShape  - the arch filled with a colour (optionally a gradient and the star pattern inside).
//   ArchAvatar - a child's, family member's or driver's initial in an arch.
//   StarPattern - our khatim star tiled at a low opacity, for brand moments only.
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { archPath, colors } from '../theme';
import { AppText } from './AppText';
import { STAR_PATH } from './icons';

let ids = 0;
const nextId = (p: string) => `${p}${++ids}`;

/** Our 8-point star tiled across its box (absolute fill). Brand moments only, never on driver screens. */
export function StarPattern({ color = '#FFFFFF', opacity = 0.07, tile = 44 }: { color?: string; opacity?: number; tile?: number }) {
  const id = nextId('star');
  const s = 20 / 64; // the star drawn 20 px wide inside each tile
  return (
    <Svg pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <Pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <G transform={`translate(${tile / 2 - 10} ${tile / 2 - 10}) scale(${s})`} opacity={opacity}>
            <Path d={STAR_PATH} fill={color} fillRule="evenodd" />
          </G>
          <G transform={`translate(-10 -10) scale(${s})`} opacity={opacity * 0.6}>
            <Path d={STAR_PATH} fill={color} fillRule="evenodd" />
          </G>
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** The arch, filled. `gradient` shades it top to bottom; `pattern` lays the star inside it. */
export function ArchShape({
  width,
  height,
  color,
  gradient,
  rise,
  pattern = false,
  children,
}: {
  width: number;
  height: number;
  color: string;
  gradient?: [string, string];
  rise?: number;
  pattern?: boolean;
  children?: ReactNode;
}) {
  const r = rise ?? width * 0.62;
  const finial = Math.max(3, r * 0.07);
  const d = archPath(width, height, r);
  const g = nextId('arch');
  const clip = nextId('clip');
  const star = nextId('st');
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height + finial} viewBox={`0 ${-finial} ${width} ${height + finial}`} style={{ position: 'absolute', top: -finial, left: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Defs>
          {gradient ? (
            <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          ) : null}
          <ClipPath id={clip}>
            <Path d={archPath(width, height, r, false)} />
          </ClipPath>
          {pattern ? (
            <Pattern id={star} width={36} height={36} patternUnits="userSpaceOnUse">
              <G transform="translate(8 8) scale(0.3125)" opacity={0.09}>
                <Path d={STAR_PATH} fill="#FFFFFF" fillRule="evenodd" />
              </G>
            </Pattern>
          ) : null}
        </Defs>
        <Path d={d} fill={gradient ? `url(#${g})` : color} />
        {pattern ? <Rect x="0" y="0" width={width} height={height} fill={`url(#${star})`} clipPath={`url(#${clip})`} /> : null}
      </Svg>
      {children}
    </View>
  );
}

/** An initial inside an arch (the parent app's avatar). */
export function ArchAvatar({ letter, size = 44, color = colors.kesar, ink = colors.onKesar, ring }: { letter: string; size?: number; color?: string; ink?: string; ring?: string }) {
  const h = Math.round(size * 1.18);
  return (
    <View style={{ width: size, height: h }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {ring ? (
        <View style={{ position: 'absolute', left: -3, top: -3 }}>
          <ArchShape width={size + 6} height={h + 6} color={ring} />
        </View>
      ) : null}
      <ArchShape width={size} height={h} color={color} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: h * 0.1, alignItems: 'center' }}>
        <AppText bold color={ink} style={{ fontSize: Math.round(size * 0.42), lineHeight: Math.round(size * 0.62) }}>
          {letter}
        </AppText>
      </View>
    </View>
  );
}
