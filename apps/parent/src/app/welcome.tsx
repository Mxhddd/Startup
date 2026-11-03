// Welcome (v8, canvas "Z8-Onboard"): three calm screens before the first login.
//   1. What Pohnch does: the van on the map, minutes to your door.
//   2. The privacy promise: the van's place only during a trip, only to its families; never your phone's.
//   3. Alerts: what they are, then the phone's permission prompt (asked only now, after explaining why).
// Swipe or tap to move on; "Not now" on the last screen skips the prompt (Settings can ask later).
// Seen once per install (a flag on the phone), then the login screen.
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, Icon, LangSwitch, LineArt, PressableScale, TapButton, type IconName } from '@pohnch/ui/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeOut, SlideInLeft, SlideInRight, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { askForAlerts } from '../notifications/setup';
import { WELCOME_SEEN } from '../state/welcome';


const SLIDES = ['map', 'privacy', 'alerts'] as const;
type Slide = (typeof SLIDES)[number];

/** A soft round mark with one icon and a slow ripple, for the privacy and alerts screens. */
function Mark({ icon }: { icon: IconName }) {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [ring]);
  const ripple = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - ring.value), transform: [{ scale: 0.8 + ring.value * 0.7 }] }));
  return (
    <View style={{ width: 200, height: 160, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ position: 'absolute', width: 132, height: 132, borderRadius: 66, backgroundColor: colors.neelTint }, ripple]} />
      <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: colors.neelTint, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 10px 24px ${colors.neelGlow}` }}>
          <Icon name={icon} size={32} color={colors.ghee} strokeWidth={2.4} />
        </View>
      </View>
    </View>
  );
}

function Dot({ on }: { on: boolean }) {
  const w = useSharedValue(on ? 24 : 8);
  useEffect(() => {
    w.value = withSpring(on ? 24 : 8, { damping: 18, stiffness: 220 });
  }, [on, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: on ? colors.neel : colors.line }, style]} />;
}

export default function Welcome() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  const slide: Slide = SLIDES[i] as Slide;
  const last = i === SLIDES.length - 1;

  const finish = async (ask: boolean) => {
    await AsyncStorage.setItem(WELCOME_SEEN, '1').catch(() => undefined);
    if (ask) await askForAlerts().catch(() => false);
    router.replace('/login');
  };
  const go = (by: 1 | -1) => {
    const next = i + by;
    if (next < 0) return;
    if (next >= SLIDES.length) return void finish(true);
    setBack(by < 0);
    setI(next);
  };

  // A swipe toward the reading start moves on (right to left in Urdu, left to right in English).
  const fling = Gesture.Race(
    Gesture.Fling().direction(dir === 'rtl' ? 1 : 2).onEnd(() => runOnJS(go)(1)), // 1 = right, 2 = left
    Gesture.Fling().direction(dir === 'rtl' ? 2 : 1).onEnd(() => runOnJS(go)(-1)),
  );

  const enter = (back ? dir === 'rtl' : dir !== 'rtl') ? SlideInRight : SlideInLeft;

  return (
    <GestureDetector gesture={fling}>
      <View testID="welcome" style={{ flex: 1, backgroundColor: colors.ghee, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.xl }}>
        <StatusBar style="dark" />
        <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 }}>
          <LangSwitch />
          {!last ? (
            <PressableScale accessibilityRole="button" onPress={() => finish(false)} scaleTo="chip" testID="welcome-skip" faceStyle={{ minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' }}>
              <AppText bold color={colors.ink2}>{t('welcome.skip')}</AppText>
            </PressableScale>
          ) : null}
        </View>

        <Animated.View key={slide} entering={enter.springify().damping(24).stiffness(180)} exiting={FadeOut.duration(140)} style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
          <View style={{ alignItems: 'center', minHeight: 170, justifyContent: 'center' }}>
            {slide === 'map' ? <LineArt width={240} /> : <Mark icon={slide === 'privacy' ? 'pin' : 'bell'} />}
          </View>
          <View style={{ gap: space.md }}>
            <AppText variant="display" testID={`welcome-title-${slide}`}>{t(`welcome.${slide}.title`)}</AppText>
            <AppText variant="secondary" style={{ fontSize: 18 }}>{t(`welcome.${slide}.body`)}</AppText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)} style={{ gap: space.lg }}>
          <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 6, justifyContent: 'center' }} accessibilityLabel={t('welcome.page', { n: i + 1, of: SLIDES.length })}>
            {SLIDES.map((s, k) => <Dot key={s} on={k === i} />)}
          </View>
          <TapButton size="next" tone="left" icon={last ? 'bell' : undefined} label={last ? t('welcome.allow') : t('welcome.next')} onConfirm={() => go(1)} testID="welcome-next" />
          {last ? (
            <PressableScale accessibilityRole="button" onPress={() => finish(false)} testID="welcome-notnow" faceStyle={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill }}>
              <AppText bold color={colors.ink2}>{t('welcome.notNow')}</AppText>
            </PressableScale>
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
