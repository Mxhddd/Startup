// Text that follows the language: Noto Sans Arabic and right-to-left for Urdu, Manrope for English.
// Inside Urdu, digits and Latin words ("7:12", "0300 1478729") switch to Manrope and stay left to right.
import { isolateLtr, splitRuns } from '@pohnch/core';
import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useLang, uiFont } from '../lang';
import { colors, fonts, type } from '../theme';

export type TextVariant = 'body' | 'secondary' | 'small' | 'title' | 'display' | 'number';

const sizes: Record<TextVariant, number> = {
  body: type.body,
  secondary: type.body,
  small: type.minSize,
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
  const size = Math.max(sizes[variant], type.minSize);
  const weight = bold || variant === 'title' || variant === 'number' ? 'bold' : 'regular';
  // Gulzar is for display text in Urdu only, and never under 26 px.
  const urduDisplay = variant === 'display' && lang === 'ur';
  const family = variant === 'number' ? fonts.latin.bold : urduDisplay ? fonts.display : uiFont(lang, weight);
  const lineHeight = Math.round(size * (urduDisplay ? 1.9 : lang === 'ur' ? type.urduLineHeight : type.latinLineHeight));

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
      style={[
        {
          fontFamily: family,
          fontSize: size,
          lineHeight,
          color: color ?? (variant === 'secondary' ? colors.ink2 : colors.siyahi),
          writingDirection: dir,
          textAlign: align === 'center' ? 'center' : dir === 'rtl' ? 'right' : 'left',
        },
        style,
      ]}
    >
      {content}
    </Text>
  );
}
