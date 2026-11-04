// Find a van (v10 stage 2, canvas "Z10S-Find" and "Z10S-Profile"): verified vans with a stop near the
// chosen child's home pin, the same school first. Each card shows what a parent may know before
// joining: the van, the driver's first name, verified, trips tracked, the rating (from 5 up), the walk
// to the nearest stop, the fee and seats left. "Try it for a week" sends a seat request with a
// one-week trial; the driver approves it the same way as an invite. No riders' names, no phones.
import { stage2, type NearVan } from '@pohnch/client';
import { ApiError } from '@pohnch/core';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, ArchAvatar, EditSheet, Icon, LineArt, Shimmer, TapButton } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

function Ring({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={56} height={56} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={28} cy={28} r={r} stroke={colors.zamurradTint} strokeWidth={6} fill="none" />
        <Circle cx={28} cy={28} r={r} stroke={colors.zamurrad} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
      </Svg>
      <AppText variant="number" color={colors.zamurradOnTint} style={{ fontSize: 14, lineHeight: 18 }}>{`${pct}%`}</AppText>
    </View>
  );
}

function Pill({ text, bg, ink }: { text: string; bg: string; ink: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: bg }}>
      <AppText bold color={ink} style={{ fontSize: 14 }}>{text}</AppText>
    </View>
  );
}

function VanCard({ v, onOpen }: { v: NearVan; onOpen: () => void }) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 28, borderCurve: 'continuous', padding: 14, gap: 12, boxShadow: elevation.e1 }} testID={`van-${v.van_id}`}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
        <ArchAvatar letter={v.driver_name.slice(0, 1)} size={44} />
        <View style={{ flex: 1 }}>
          <AppText bold style={{ fontSize: 18 }}>{v.van_name}</AppText>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 4 }}>
            <AppText variant="small" color={colors.ink2}>{v.driver_name}</AppText>
            <Icon name="shield" size={14} color={colors.zamurrad} />
            <AppText variant="small" bold color={colors.zamurradOnTint}>{t('van.verified')}</AppText>
          </View>
        </View>
        {v.reliability !== null ? <Ring pct={v.reliability} /> : null}
      </View>
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 6 }}>
        {v.seats_left !== null ? <Pill text={v.seats_left > 0 ? t('s2.find.seats', { n: v.seats_left }) : t('s2.find.full')} bg={v.seats_left > 0 ? colors.zamurradTint : colors.inset} ink={v.seats_left > 0 ? colors.zamurradOnTint : colors.ink2} /> : null}
        <Pill text={t('s2.find.walk', { m: v.walk_m })} bg={colors.neelTint} ink={colors.link} />
        {v.rating !== null ? <Pill text={`★ ${v.rating}`} bg={colors.kesarTint} ink={colors.onKesar} /> : <Pill text={t('s2.find.new')} bg={colors.inset} ink={colors.ink2} />}
        {!v.same_school ? <Pill text={t('s2.find.otherSchool')} bg={colors.inset} ink={colors.ink2} /> : null}
      </View>
      {v.monthly_fee !== null ? (
        <View style={{ flexDirection: row, alignItems: 'flex-end', gap: 4 }}>
          <AppText variant="number" style={{ fontSize: 20, lineHeight: 26 }}>{`Rs ${v.monthly_fee.toLocaleString('en-US')}`}</AppText>
          <AppText variant="small" color={colors.ink2}>{t('s2.find.perMonth')}</AppText>
        </View>
      ) : null}
      <TapButton tone="neutral" icon="check" label={t('s2.find.ask')} onConfirm={onOpen} testID={`ask-${v.van_id}`} />
    </View>
  );
}

export default function Find() {
  const { t } = useLang();
  const p = useParent();
  const child = p.child;
  const [vans, setVans] = useState<NearVan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<NearVan | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!child) return;
    stage2.vansNear(child.id).then(setVans).catch((e) => setError(e instanceof ApiError && e.code === 'no_home_pin' ? t('s2.find.noPin') : e instanceof ApiError && e.code === 'stage2_off' ? t('s2.off') : t('error.offline')));
  }, [child?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ask = async () => {
    if (!pick || !child) return;
    try {
      await stage2.requestSeat(pick.van_id, child.id);
      setSent(true);
      await p.actions.refresh();
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'child_already_on_a_van' ? t('s2.find.already', { name: child.first_name }) : t('error.generic'));
      setPick(null);
    }
  };

  return (
    <Page title={t('s2.find.title')} sub={child ? t('s2.find.sub', { name: child.first_name }) : null}>
      {error ? (
        <AppText bold color={colors.dangerText}>{error}</AppText>
      ) : !vans ? (
        <Shimmer lines={[{ w: '100%', h: 150 }, { w: '100%', h: 150 }]} />
      ) : vans.length === 0 ? (
        <View style={{ alignItems: 'center', gap: space.md, paddingTop: space.lg }}>
          <LineArt width={180} />
          <AppText variant="secondary" align="center">{t('s2.find.none')}</AppText>
          <TapButton tone="left" icon="plus" label={t('s2.req.title')} onConfirm={() => router.push('/request')} testID="find-request" />
        </View>
      ) : (
        <>
          <AppText variant="display" style={{ fontSize: 28 }}>{t('s2.find.count', { n: vans.length })}</AppText>
          {vans.map((v, i) => (
            <Animated.View key={v.van_id} entering={FadeInDown.delay(i * 70).springify().damping(22)}>
              <VanCard v={v} onOpen={() => { setSent(false); setPick(v); }} />
            </Animated.View>
          ))}
        </>
      )}
      <EditSheet visible={!!pick} title={pick ? pick.van_name : ''} onClose={() => setPick(null)} testID="ask-sheet">
        {sent ? (
          <AppText bold color={colors.zamurradOnTint}>{t('s2.find.asked')}</AppText>
        ) : (
          <>
            <AppText variant="secondary">{t('s2.find.askBody', { driver: pick?.driver_name ?? '' })}</AppText>
            <TapButton size="next" tone="left" hold feel="success" icon="check" label={t('s2.find.ask')} onConfirm={ask} testID="ask-confirm" />
          </>
        )}
      </EditSheet>
    </Page>
  );
}
