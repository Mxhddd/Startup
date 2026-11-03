// Frosted glass for things that float over the map (child chips, the menu, the live pill): the map
// shows through softly blurred, with a bright hairline edge and a gentle shadow, so the controls feel
// lifted off the map rather than pasted on it.
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colorScheme, colors, shadow } from '../theme';

export function Glass({ children, style, tone = 'light', radius = 999 }: { children?: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'light' | 'dark'; radius?: number }) {
  // At night (the parent app following a dark phone) all glass is the dark kind.
  const dark = tone === 'dark' || colorScheme() === 'dark';
  return (
    <View style={[{ borderRadius: radius, borderCurve: 'continuous', boxShadow: dark ? undefined : shadow.float }, style]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden' }]} pointerEvents="none">
        <BlurView intensity={dark ? 20 : 40} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? colors.glassDark : colors.glass, borderRadius: radius, borderCurve: 'continuous', borderWidth: 1, borderColor: dark ? 'rgba(250,246,238,0.2)' : colors.glassEdge }]} />
      </View>
      {children}
    </View>
  );
}
