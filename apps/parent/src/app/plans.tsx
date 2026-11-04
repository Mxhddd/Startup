// Pohnch Live (v10 stage 2, canvas "Z10S-Plans"): Live and Free side by side; "Start the free month"
// (once per family). No payment is taken in the app: that waits for Pohnch's company, tax number and
// bank accounts. Basic step alerts are always free.
import { ApiError } from '@pohnch/core';
import { stage2, type LiveStatus } from '@pohnch/client';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, Icon, StarPattern, TapButton } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';

function Plan({ title, price, per, feats, on, badge }: { title: string; price: string; per: string; feats: string[]; on?: boolean; badge?: string }) {
  const { dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const ink = on ? colors.onBrand : colors.siyahi;
  return (
    <View style={{ borderRadius: 28, borderCurve: 'continuous', overflow: 'hidden', padding: 18, gap: 8, backgroundColor: on ? colors.neel : colors.white, experimental_backgroundImage: on ? `linear-gradient(160deg, ${colors.headerTop}, ${colors.neel})` : undefined, boxShadow: on ? elevation.e2 : elevation.e1 }}>
      {on ? <StarPattern opacity={0.07} tile={36} /> : null}
      <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText bold color={ink} style={{ fontSize: 20 }}>{title}</AppText>
        {badge ? <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.kesar }}><AppText bold color={colors.onKesar} style={{ fontSize: 14 }}>{badge}</AppText></View> : null}
      </View>
      <View style={{ flexDirection: row, alignItems: 'flex-end', gap: 6 }}>
        <AppText variant="number" color={ink} style={{ fontSize: 34, lineHeight: 40 }}>{price}</AppText>
        <AppText color={on ? colors.mutedOnDark : colors.ink2} style={{ fontSize: 15 }}>{per}</AppText>
      </View>
      {feats.map((f) => (
        <View key={f} style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={18} color={on ? colors.kesar : colors.zamurrad} strokeWidth={2.8} />
          <AppText color={ink} style={{ fontSize: 15, flex: 1 }}>{f}</AppText>
        </View>
      ))}
    </View>
  );
}

export default function Plans() {
  const { t } = useLang();
  const [s, setS] = useState<LiveStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    stage2.liveStatus().then(setS).catch(() => setError(t('s2.off')));
  }, [t]);
  const start = async () => {
    setError(null);
    try {
      await stage2.startLiveTrial();
      setS(await stage2.liveStatus());
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'trial_used' ? t('s2.live.used') : t('error.generic'));
    }
  };
  return (
    <Page title={t('s2.live.title')} sub={t('s2.live.sub')}>
      <Animated.View entering={FadeInDown.springify().damping(22)} style={{ gap: space.md }}>
        <Plan on title={t('s2.live.title')} price={t('s2.live.price')} per={t('s2.live.per')} badge={t('s2.live.free')} feats={[t('s2.live.f1'), t('s2.live.f2'), t('s2.live.f3'), t('s2.live.f4')]} />
        <Plan title={t('s2.free.title')} price="Rs 0" per={t('s2.free.per')} feats={[t('s2.free.f1'), t('s2.free.f2')]} />
        {s?.status === 'trial' ? (
          <AppText bold color={colors.zamurradOnTint} align="center" testID="live-trial">{t('s2.live.on', { n: s.daysLeft })}</AppText>
        ) : s?.status === 'ended' ? (
          <AppText bold color={colors.ink2} align="center">{t('s2.live.ended')}</AppText>
        ) : (
          <TapButton size="next" tone="reachedSchool" icon="star" label={t('s2.live.start')} disabled={!s} onConfirm={start} testID="live-start" />
        )}
        {error ? <AppText bold color={colors.dangerText}>{error}</AppText> : null}
        <AppText variant="small" color={colors.ink2} align="center">{t('s2.live.payLater')}</AppText>
      </Animated.View>
    </Page>
  );
}
