// Text that follows the language: Noto Sans Arabic and right-to-left for Urdu, Manrope for English.
// Inside Urdu, digits and Latin words ("7:12", "0300 1478729") switch to Manrope and stay left to right.
import { isolateLtr, splitRuns } from '@pohnch/core';
import { useSyncExternalStore, type ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { useLang, uiFont } from '../lang';
import { colors, fonts, onTextScale, textScale, type } from '../theme';

export type TextVariant = 'body' | 'secondary' | 'small' | 'caption' | 'headline' | 'title' | 'display' | 'number';

const sizes: Record<TextVariant, number> = {
  body: type.body,
  secondary: type.body,
  small: type.caption,
  caption: type.caption,
  headline: type.headline,
  title: type.title,
  display: type.display,
  number: 28,
};

export function AppText({
  children,
  variant = 'body',
  bold = false,
  color,
  align,
  style,
  testID,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: TextVariant;
  bold?: boolean;
  color?: string;
  align?: 'start' | 'center';
  style?: StyleProp<TextStyle>;
  testID?: string;
  numberOfLines?: number;
}) {
  const { lang, dir } = useLang();
  // A size given in style wins, and the line height follows it (unless style sets one too).
  const flat = StyleSheet.flatten(style) ?? {};
  // v12 big-text mode scales every size by one number (chosen in settings).
  const k = useSyncExternalStore(onTextScale, textScale, textScale);
  const size = Math.round(Math.max(typeof flat.fontSize === 'number' ? flat.fontSize : sizes[variant], type.minSize) * k);
  const weight = bold || variant === 'title' || variant === 'headline' || variant === 'number' ? 'bold' : 'regular';
  // Gulzar (Nastaliq) is for brand moments in Urdu only, and never under 26 px.
  const urduDisplay = variant === 'display' && lang === 'ur' && size >= 26;
  const family = variant === 'number' ? fonts.latin.bold : urduDisplay ? fonts.display : uiFont(lang, variant === 'display' ? 'bold' : weight);
  const lineHeight = Math.round(size * (urduDisplay ? type.nastaliqLineHeight : lang === 'ur' ? type.urduLineHeight : type.latinLineHeight));

  // In Urdu, split strings so Latin and digit runs get Manrope and an isolate mark.
  const content =
    lang === 'ur' && typeof children === 'string' && variant !== 'number'
      ? splitRuns(children).map((run, i) =>
          run.latin ? (
            <Text key={i} style={{ fontFamily: fonts.latin[weight] }}>
              {isolateLtr(run.text)}
            </Text>
          ) : (
            run.text
          ),
        )
      : children;

  return (
    <Text
      testID={testID}
      numberOfLines={numberOfLines}
      // Follows the phone's text size up to 130%: bigger for those who need it, without breaking layouts.
      maxFontSizeMultiplier={1.3}
      style={[
        {
          fontFamily: family,
          fontSize: size,
          lineHeight,
          ...(k !== 1 && typeof flat.lineHeight === 'number' ? { lineHeight: Math.round(flat.lineHeight * k) } : {}),
          color: color ?? (variant === 'secondary' ? colors.ink2 : colors.siyahi),
          // Numbers (times, minutes, +5) always read left to right, also inside Urdu.
          writingDirection: variant === 'number' ? 'ltr' : dir,
          textAlign: align === 'center' ? 'center' : dir === 'rtl' ? 'right' : 'left',
        },
        style,
        k !== 1 ? { fontSize: size, ...(typeof flat.lineHeight === 'number' ? { lineHeight: Math.round(flat.lineHeight * k) } : {}) } : null,
      ]}
    >
      {content}
    </Text>
  );
}
