// A sheet for a small edit (a stop time, a child's name, a family member), instead of a whole page
// (v8 "forms as sheets"). The screen behind dims while the sheet rises on the sheet spring and closing
// reverses it; the sheet lifts above the keyboard. Tapping the dimmed screen or Back closes it.
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';

export function EditSheet({ visible, title, onClose, children, testID }: { visible: boolean; title: string; onClose: () => void; children: ReactNode; testID?: string }) {
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      shown.value = withSpring(1, springs.sheet);
    } else if (mounted) {
      shown.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const scrim = useAnimatedStyle(() => ({ opacity: shown.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - shown.value) * 640 }] }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }, scrim]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          testID={testID}
          accessibilityViewIsModal
          style={[{ backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderCurve: 'continuous', padding: space.xl, paddingTop: space.md, paddingBottom: insets.bottom + space.xl, gap: space.lg }, sheet]}
        >
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, borderCurve: 'continuous', backgroundColor: colors.line }} />
          <AppText variant="title" style={{ fontSize: 24 }}>{title}</AppText>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
