// v10 "Jharoka": the parent app's page header. A deep neel band lit from one corner, our star pattern
// at 7%, a big Gulzar title, and the page itself rising into the band at the centre in a pointed hump,
// like looking out of a jharoka. It scrolls away with the page. (Parent app only; the driver app keeps
// its plain neel header.)
import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../lang';
import { colors, humpPath } from '../theme';
import { AppText } from './AppText';
import { StarPattern } from './Arch';
import { Icon } from './icons';
import { LangSwitch } from './LangSwitch';
import { PressableScale } from './PressableScale';

export function ArchHeader({
  title,
  sub,
  onBack,
  accent,
  ground,
  testID,
}: {
  title: string;
  sub?: string | null;
  onBack?: () => void;
  /** Something that sits on the start side of the title (an avatar, a seal). */
  accent?: ReactNode;
  /** The colour of the page below (the hump is drawn in it). Defaults to the ghee ground. */
  ground?: string;
  testID?: string;
}) {
  const { t, dir } = useLang();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.neel,
        experimental_backgroundImage: `linear-gradient(160deg, ${colors.headerTop} 0%, ${colors.neel} 55%, ${colors.headerBottom} 100%)`,
        paddingTop: insets.top + 8,
        paddingHorizontal: 22,
        paddingBottom: 54,
        overflow: 'hidden',
      }}
    >
      <StarPattern />
      <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
        {onBack ? (
          <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} scaleTo="chip" hitSlop={8} onPress={onBack}
            faceStyle={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassDark }}>
            <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}>
              <Icon name="arrow" size={20} color={colors.onBrand} />
            </View>
          </PressableScale>
        ) : (
          <View />
        )}
        <LangSwitch tone="dark" />
      </View>
      <View style={{ flexDirection: row, alignItems: 'flex-end', gap: 14, marginTop: 10 }}>
        <View style={{ flex: 1 }} accessibilityRole="header">
          <AppText variant="display" color={colors.onBrand} style={{ fontSize: 38 }}>
            {title}
          </AppText>
          {sub ? (
            <AppText color={colors.mutedOnDark} style={{ fontSize: 16, marginTop: -4 }}>
              {sub}
            </AppText>
          ) : null}
        </View>
        {accent}
      </View>
      <Svg pointerEvents="none" width={width} height={40} style={{ position: 'absolute', left: 0, bottom: -1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d={humpPath(width)} fill={ground ?? colors.ghee} />
      </Svg>
    </View>
  );
}
