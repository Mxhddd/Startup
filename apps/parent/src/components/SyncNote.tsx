// v21: when a save made on the tap didn't reach the server (no signal, server busy), a calm bar rises at
// the bottom of whatever screen is open: "Couldn't save that" with "Try again". The screen has already
// gone back to the real data. Shown only while there is something to retry.
import { colors, elevation, space, springs, useLang } from '@pohnch/ui';
import { AppText, PressableScale } from '@pohnch/ui/native';
import { View } from 'react-native';
import Animated, { FadeOutDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useParent } from '../state/ParentStore';

export function SyncNote() {
  const { t, dir } = useLang();
  const p = useParent();
  const insets = useSafeAreaInsets();
  if (!p.syncFailed) return null;
  return (
    <Animated.View entering={SlideInDown.springify().damping(springs.sheet.damping).stiffness(springs.sheet.stiffness)} exiting={FadeOutDown.duration(160)}
      accessibilityLiveRegion="polite" testID="sync-note"
      style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: insets.bottom + space.lg, borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.night, boxShadow: elevation.e3,
        paddingVertical: space.md, paddingHorizontal: space.lg, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <AppText bold color={colors.onNight}>{t('parent.sync.failed')}</AppText>
      </View>
      <PressableScale accessibilityRole="button" onPress={p.actions.retrySync} haptic="tick" scaleTo="chip" testID="sync-retry"
        faceStyle={{ minHeight: 48, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.kesar, justifyContent: 'center' }}>
        <AppText bold color={colors.onKesar}>{t('common.retry')}</AppText>
      </PressableScale>
    </Animated.View>
  );
}
