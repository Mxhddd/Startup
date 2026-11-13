// First-week tips (v10): three short tips at the top of the home sheet during the first 7 days after
// the app is first opened: pull the sheet up, "Off today", each step's tone. "Next" moves on; "Got it"
// hides them for good. Kept on the phone only (AsyncStorage), never sent anywhere.
import { tipsDue } from '@pohnch/core';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, PressableScale, StarIcon } from '@pohnch/ui/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

const KEY = 'pohnch.tips.v1';
const TIPS = ['tips.sheet', 'tips.off', 'tips.alerts'] as const;

export function FirstTips() {
  const { t, dir } = useLang();
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const [first, setFirst] = useState(Date.now());

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as { firstSeen: number; done: boolean }) : null;
        const firstSeen = saved?.firstSeen ?? Date.now();
        setFirst(firstSeen);
        if (!saved) void AsyncStorage.setItem(KEY, JSON.stringify({ firstSeen, done: false }));
        setShow(tipsDue(saved, Date.now()));
      })
      .catch(() => undefined);
  }, []);

  const done = () => {
    setShow(false);
    void AsyncStorage.setItem(KEY, JSON.stringify({ firstSeen: first, done: true })).catch(() => undefined);
  };

  if (!show) return null;
  const last = i === TIPS.length - 1;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} exiting={FadeOut.duration(160)} testID="first-tips" accessibilityLabel={t('tips.label')}
      style={{ flexDirection: row, alignItems: 'center', gap: space.md, padding: 14, borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.neelTint }}>
      <StarIcon size={20} color={colors.kesar} />
      <AppText bold color={colors.link} style={{ flex: 1, fontSize: 15 }}>{t(TIPS[i] as (typeof TIPS)[number])}</AppText>
      <PressableScale accessibilityRole="button" onPress={() => (last ? done() : setI(i + 1))} scaleTo="chip" testID="tips-next"
        faceStyle={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.white, justifyContent: 'center' }}>
        <AppText bold color={colors.link} style={{ fontSize: 15 }}>{last ? t('tips.done') : t('tips.next')}</AppText>
      </PressableScale>
    </Animated.View>
  );
}
