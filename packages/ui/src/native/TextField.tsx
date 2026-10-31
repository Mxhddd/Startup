// A labelled text box. Latin-only fields (plates, numbers) can be forced left to right.
import { TextInput, View } from 'react-native';
import { useLang, uiFont } from '../lang';
import { colors, fonts, radius, space } from '../theme';
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
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="small" bold color={colors.ink2}>
        {label}
      </AppText>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.ink2}
        maxLength={maxLength}
        style={{
          minHeight: 56,
          borderRadius: radius.button,
          borderWidth: 2,
          borderColor: colors.siyahi,
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
