// A driver screen (v8): the same neel header as Today (back, title, language switch, with a gentle light
// from the top), then the content on ghee. High contrast, no pattern or frames. The header settles in
// from the top and the content rises under it, so moving between screens feels like one place.
import { colors, shadow, space, useLang } from '@pohnch/ui';
import { AppText, Icon, LangSwitch, PressableScale } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Screen({ title, children, back = true, scroll = true, footer }: { title: string; children: ReactNode; back?: boolean; scroll?: boolean; footer?: ReactNode }) {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const body = <Animated.View entering={FadeInDown.delay(80).springify().damping(22)} style={{ gap: space.lg, paddingBottom: space.xxl }}>{children}</Animated.View>;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <StatusBar style="light" />
      <Animated.View entering={FadeInUp.springify().damping(22)}
        style={{ backgroundColor: colors.neel, experimental_backgroundImage: `linear-gradient(180deg, ${colors.neelRaised}, ${colors.neel})`, paddingTop: insets.top + space.md, paddingBottom: space.lg, paddingHorizontal: space.xl, flexDirection: row, alignItems: 'center', gap: space.md, boxShadow: shadow.card }}>
        {back ? (
          <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} scaleTo="chip" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={8}
            faceStyle={{ width: 48, height: 48, borderRadius: 24, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassDark, borderWidth: 1, borderColor: 'rgba(250,246,238,0.18)' }}>
            <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}>
              <Icon name="arrow" size={22} color={colors.ghee} />
            </View>
          </PressableScale>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="title" color={colors.ghee} numberOfLines={1}>{title}</AppText>
        </View>
        <LangSwitch tone="dark" />
      </Animated.View>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: insets.bottom + 140 }} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space.xl, paddingTop: space.xl }}>{body}</View>
      )}
      {footer ? <View style={{ position: 'absolute', left: space.xl, right: space.xl, bottom: insets.bottom + space.lg, gap: space.md }}>{footer}</View> : null}
    </View>
  );
}
