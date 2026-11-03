// "آج چھٹی": a child who is off today. With a name it reads "سارا · آج چھٹی".
// On the parent side it can be tapped to undo until the van leaves.
import { View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export function AbsentChip({ onUndo, name }: { onUndo?: () => void; name?: string }) {
  const { t, dir } = useLang();
  const label = name ? `${name} · ${t('chutti.label')}` : t('chutti.label');
  const body = (
    <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, backgroundColor: colors.absentBg, borderRadius: radius.pill, borderCurve: 'continuous', borderWidth: 1.5, borderColor: colors.absentText, paddingHorizontal: 14, minHeight: 34 }}>
      <AppText variant="small" bold color={colors.absentText}>
        {label}
      </AppText>
      {onUndo ? (
        <AppText variant="small" bold color={colors.neel}>
          {t('undo.action')}
        </AppText>
      ) : null}
    </View>
  );
  const enter = ZoomIn.springify().damping(springs.pop.damping).stiffness(springs.pop.stiffness);
  if (!onUndo) {
    return (
      <Animated.View entering={enter} exiting={ZoomOut.duration(160)} style={{ alignSelf: dir === 'rtl' ? 'flex-end' : 'flex-start' }}>
        {body}
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={enter} exiting={ZoomOut.duration(160)} style={{ alignSelf: dir === 'rtl' ? 'flex-end' : 'flex-start' }}>
      <PressableScale accessibilityRole="button" accessibilityLabel={`${label} · ${t('undo.action')}`} onPress={onUndo} hitSlop={8} scaleTo="chip" haptic="warn" faceStyle={{ minHeight: 44, justifyContent: 'center' }}>
        {body}
      </PressableScale>
    </Animated.View>
  );
}
