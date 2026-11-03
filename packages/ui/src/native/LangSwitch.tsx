// The pill that flips the app between Urdu and English. It is labelled in the other language,
// so a reader of either script can find it.
import { Text } from 'react-native';
import { useLang, uiFont } from '../lang';
import { colors, radius, shadow } from '../theme';
import { PressableScale } from './PressableScale';

export function LangSwitch({ tone = 'light' }: { tone?: 'light' | 'dark' | 'float' }) {
  const { lang, t, toggle } = useLang();
  const other = lang === 'ur' ? 'en' : 'ur';
  const dark = tone === 'dark';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('lang.switch.label')}
      testID="lang-switch"
      onPress={toggle}
      hitSlop={8}
      scaleTo="chip"
      haptic="tick"
      faceStyle={{
        minHeight: 44,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: dark ? 'rgba(250,246,238,0.14)' : colors.white,
        borderWidth: tone === 'light' ? 1 : 0,
        borderColor: colors.line,
        boxShadow: tone === 'float' ? shadow.float : undefined,
      }}
    >
      <Text style={{ fontFamily: uiFont(other, 'bold'), fontSize: 15, color: dark ? colors.ghee : colors.neel }}>{t('lang.switch')}</Text>
    </PressableScale>
  );
}
