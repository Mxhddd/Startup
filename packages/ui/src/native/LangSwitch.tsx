// The pill that flips the app between Urdu and English. It is labelled in the other language,
// so a reader of either script can find it.
import { Pressable, Text } from 'react-native';
import { useLang, uiFont } from '../lang';
import { colors, radius } from '../theme';

export function LangSwitch({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { lang, t, toggle } = useLang();
  const other = lang === 'ur' ? 'en' : 'ur';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('lang.switch.label')}
      testID="lang-switch"
      onPress={toggle}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: tone === 'dark' ? colors.neel : colors.white,
        borderWidth: tone === 'dark' ? 0 : 1,
        borderColor: colors.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontFamily: uiFont(other, 'bold'), fontSize: 15, color: tone === 'dark' ? colors.ghee : colors.neel }}>
        {t('lang.switch')}
      </Text>
    </Pressable>
  );
}
