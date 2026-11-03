// A labelled text box. Latin-only fields (plates, numbers) can be forced left to right.
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useLang, uiFont } from '../lang';
import { colors, fonts, radius, shadow, space } from '../theme';
import { AppText } from './AppText';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  ltr = false,
  maxLength = 80,
  testID,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ltr?: boolean;
  maxLength?: number;
  testID?: string;
  onBlur?: () => void;
}) {
  const { lang, dir } = useLang();
  const d = ltr ? 'ltr' : dir;
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="small" bold color={colors.ink2}>
        {label}
      </AppText>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        selectionColor={colors.neel}
        placeholder={placeholder}
        placeholderTextColor={colors.ink2}
        maxLength={maxLength}
        style={{
          minHeight: 56,
          borderRadius: radius.card, borderCurve: 'continuous',
          borderWidth: 2,
          borderColor: focused ? colors.neel : colors.line,
          boxShadow: focused ? `0px 0px 0px 4px ${colors.neelTint}` : shadow.card,
          backgroundColor: colors.white,
          paddingHorizontal: space.lg,
          fontSize: 18,
          color: colors.siyahi,
          fontFamily: ltr ? fonts.latin.bold : uiFont(lang, 'regular'),
          textAlign: d === 'rtl' ? 'right' : 'left',
          writingDirection: d,
        }}
      />
    </View>
  );
}
