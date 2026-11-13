// A parent page (v11 "Gehrai", canvas "Z11P-Menu"): the arch corridor header with the sky behind it,
// the content on a softly lit ground, light pooling where the doorway meets the page and sunlight
// through a jali. Scrolling walks you through the arch: the near arch grows past, the title settles
// into a slim frosted bar. Content sections rise in as they arrive.
import { space } from '@pohnch/ui';
import { Corridor, FloorLight, JaliLight, LivingGround, TruckBand, skyMoodNow } from '@pohnch/ui/native';
import { useRain } from '@pohnch/client';
import { karachiDate, seasonFor } from '@pohnch/core';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Header height below the status bar: v21 sized from the screen (28% of it, 180 to 296), so a short
 *  phone keeps most of its height for the page itself (it was a fixed 296). */
const corridorFor = (screenH: number) => Math.round(Math.min(296, Math.max(180, screenH * 0.28)));

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
  const { height: screenH } = useWindowDimensions();
  const height = insets.top + corridorFor(screenH);
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LivingGround />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: height, paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">
        <View>
          <FloorLight mood={mood} />
          <JaliLight />
          {/* v21: a jhalar fringe hangs where the doorway meets the page, as on pohnch.pk's seams. */}
          <TruckBand kind="jhalar" height={20} style={{ opacity: 0.9 }} />
          {/* v21: content keeps a readable width on big phones, foldables and tablets. */}
          <View style={{ paddingHorizontal: 18, paddingTop: 14, gap: space.lg, width: '100%', maxWidth: 560, alignSelf: 'center' }}>{children}</View>
        </View>
      </Animated.ScrollView>
      <Corridor title={title} sub={sub} accent={accent} scrollY={y} height={height} mood={mood} weather={rain ? 'rain' : null} season={season} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </View>
  );
}
