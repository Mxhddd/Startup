// A parent page (v24, the Beaconhouse demo look): calm paper ground, a compact header (back, title,
// language) that turns into a frosted bar as the page scrolls under it, and the content as plain cards.
// It replaced v11's arch corridor: the demo showed families a lighter app, and the inner pages now match
// the map-first home. Same props as before, so every screen changed with this one file.
import { colorScheme, colors, space, useLang } from '@pohnch/ui';
import { AppText, Icon, LangSwitch, PressableScale } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BAR = 64;

export function Page({ title, sub, accent, children }: { title: string; sub?: string | null; accent?: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const [titleH, setTitleH] = useState(80);
  // The bar's own small title and its frosted ground fade in once the big title has scrolled away.
  const frost = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [titleH * 0.5, titleH], [0, 1], 'clamp') }));
  const bigTitle = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, titleH * 0.7], [1, 0], 'clamp'), transform: [{ translateY: interpolate(y.value, [0, titleH], [0, -12], 'clamp') }] }));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar style={colorScheme() === 'dark' ? 'light' : 'dark'} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: insets.top + BAR, paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 18, gap: space.lg, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <Animated.View style={[{ gap: 4, paddingTop: 4 }, bigTitle]} onLayout={(e) => setTitleH(Math.max(40, e.nativeEvent.layout.height))}>
            <AppText bold style={{ fontSize: 28, lineHeight: 42 }} testID="page-title">{title}</AppText>
            {sub ? <AppText color={colors.ink2} style={{ fontSize: 16 }}>{sub}</AppText> : null}
            {accent}
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(60).springify().damping(22).stiffness(300)} style={{ gap: space.lg }}>
            {children}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top, height: insets.top + BAR }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.line }, frost]} />
        <View style={{ flex: 1, flexDirection: row, alignItems: 'center', gap: 12, paddingHorizontal: 14 }}>
          <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} scaleTo="chip" onPress={back} hitSlop={8} testID="page-back"
            faceStyle={{ width: 44, height: 44, borderRadius: 22, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, boxShadow: '0px 2px 10px rgba(20,26,51,0.10)' }}>
            <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}>
              <Icon name="arrow" size={20} color={colors.neel} />
            </View>
          </PressableScale>
          <Animated.View style={[{ flex: 1 }, frost]}>
            <AppText bold numberOfLines={1} style={{ fontSize: 18 }}>{title}</AppText>
          </Animated.View>
          <LangSwitch />
        </View>
      </View>
    </View>
  );
}
