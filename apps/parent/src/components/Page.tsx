// A parent page (v11 "Gehrai", canvas "Z11P-Menu"): the arch corridor header with the sky behind it,
// the content on a softly lit ground, light pooling where the doorway meets the page and sunlight
// through a jali. Scrolling walks you through the arch: the near arch grows past, the title settles
// into a slim frosted bar. Content sections rise in as they arrive.
import { space } from '@pohnch/ui';
import { Corridor, FloorLight, JaliLight, LivingGround, skyMoodNow } from '@pohnch/ui/native';
import { useRain } from '@pohnch/client';
import { karachiDate, seasonFor } from '@pohnch/core';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Header height below the status bar (the corridor's full height). */
const CORRIDOR = 296;

export function Page({ title, sub, accent, children }: { title: string; sub?: string | null; accent?: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const mood = useMemo(() => skyMoodNow(), []);
  // v12: the sky dresses for rain and the season (Ramadan, Eid, 14 August, monsoon).
  const rain = useRain();
  const season = useMemo(() => seasonFor(karachiDate(new Date())), []);
  const height = insets.top + CORRIDOR;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LivingGround />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: height, paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">
        <View>
          <FloorLight mood={mood} />
          <JaliLight />
          <View style={{ paddingHorizontal: 18, paddingTop: 22, gap: space.lg }}>{children}</View>
        </View>
      </Animated.ScrollView>
      <Corridor title={title} sub={sub} accent={accent} scrollY={y} height={height} mood={mood} weather={rain ? 'rain' : null} season={season} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </View>
  );
}
