// Text that follows the language: Noto Sans Arabic and right-to-left for Urdu, Manrope for English.
import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useLang, uiFont } from '../lang';
import { colors, fonts, type } from '../theme';

type Variant = 'body' | 'secondary' | 'title' | 'display';

const sizes: Record<Variant, number> = {
  body: type.body,
  secondary: type.body,
  title: type.title,
  display: type.display,
};

export function AppText({
  children,
  variant = 'body',
  bold = false,
  style,
  testID,
}: {
  children: ReactNode;
  variant?: Variant;
  bold?: boolean;
  style?: StyleProp<TextStyle>;
  testID?: string;
}) {
  const { lang, dir } = useLang();
  const size = Math.max(sizes[variant], type.minSize);
  // Gulzar is for display text in Urdu only, and never under 26 px.
  const family = variant === 'display' && lang === 'ur' ? fonts.display : uiFont(lang, bold || variant === 'title' ? 'bold' : 'regular');
  const lineHeight = Math.round(size * (lang === 'ur' ? type.urduLineHeight : type.latinLineHeight));
  return (
    <Text
      testID={testID}
      style={[
        {
          fontFamily: family,
          fontSize: size,
          lineHeight: variant === 'display' && lang === 'ur' ? Math.round(size * 1.9) : lineHeight,
          color: variant === 'secondary' ? colors.ink2 : colors.siyahi,
          writingDirection: dir,
          textAlign: dir === 'rtl' ? 'right' : 'left',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
