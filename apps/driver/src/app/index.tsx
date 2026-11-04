// Driver "Today" (v5): a neel header with the greeting, the date and the van; today's route as a
// still map; the children in stop order in one white card; and the one big hold-to-start button.
// No van yet -> set it up. A trip running -> straight back to it.
// In development builds, a long press on the greeting opens the component gallery.
import { useSession } from '@pohnch/client';
import { karachiDayParts } from '@pohnch/core';
import { colors, elevation, radius, radius10, space, useLang } from '@pohnch/ui';
import { AppText, ChildRow, Icon, LangSwitch, PohnchMap, PressableScale, Shimmer, TapButton, VanBadge, type IconName } from '@pohnch/ui/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, FadeInUp, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationDisclosure } from '../components/LocationDisclosure';
import { AlertsCard } from '../components/AlertsCard';
import { SetupChecklist } from '../components/SetupChecklist';
import { useDriver } from '../state/DriverStore';
import { useStage2 } from '../state/stage2';

const DISCLOSED = 'pohnch.driver.locationDisclosed.v1';
type Href = '/stops' | '/families' | '/setup' | '/practice' | '/dayoff' | '/account' | '/earnings';

/** v10: a 2 x 2 group of plain actions, each with its icon in a soft square and its name beside it. */
function NavTile({ label, href, icon, badge, tint = colors.neelTint, ink = colors.neel }: { label: string; href: Href; icon: IconName; badge?: number; tint?: string; ink?: string }) {
  const { dir } = useLang();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} testID={`nav-${href.slice(1)}`} style={{ flexBasis: '47%', flexGrow: 1 }}
      faceStyle={{ minHeight: 72, borderRadius: radius10.row + 2, borderCurve: 'continuous', backgroundColor: colors.white, boxShadow: elevation.e1, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 }}>
      <View>
        <View style={{ width: 44, height: 44, borderRadius: 14, borderCurve: 'continuous', backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} color={ink} />
        </View>
        {badge ? (
          <Animated.View entering={FadeIn} style={{ position: 'absolute', top: -6, [dir === 'rtl' ? 'left' : 'right']: -8, minWidth: 22, height: 22, borderRadius: 11, borderCurve: 'continuous', backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
            <AppText variant="number" style={{ fontSize: 14, lineHeight: 18 }}>{String(badge)}</AppText>
          </Animated.View>
        ) : null}
      </View>
      <AppText bold style={{ flex: 1, fontSize: 16 }} numberOfLines={2}>{label}</AppText>
    </PressableScale>
  );
}

/** v10: this week's record as a ring (tracked start to finish / trips done), with one plain tip. */
function WeekScore({ tracked, done }: { tracked: number; done: number }) {
  const { t, dir } = useLang();
  const pct = Math.round((tracked / Math.max(1, done)) * 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <Animated.View entering={FadeInDown.springify().damping(22)} testID="week-line" accessibilityLabel={t('driver.week', { tracked, done })}
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius10.group, backgroundColor: colors.white, boxShadow: elevation.e1 }}>
      <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={64} height={64} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={32} cy={32} r={r} stroke={colors.zamurradTint} strokeWidth={7} fill="none" />
          <Circle cx={32} cy={32} r={r} stroke={colors.zamurrad} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
        </Svg>
        <AppText variant="number" color={colors.zamurradOnTint} style={{ fontSize: 16, lineHeight: 20 }}>{`${pct}%`}</AppText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText bold style={{ fontSize: 16 }}>{t('driver.week.title')}</AppText>
        <AppText variant="small" bold color={colors.zamurradOnTint}>{t('driver.week', { tracked, done })}</AppText>
        <AppText variant="small" color={colors.ink2}>{tracked >= done ? t('driver.week.great') : t('driver.week.tip')}</AppText>
      </View>
    </Animated.View>
  );
}

export default function DriverToday() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const { configured } = useSession();
  const d = useDriver();
  const s2 = useStage2();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const [askFor, setAskFor] = useState<'morning' | 'afternoon' | null>(null);

  // The first real trip shows the location explanation first (Google Play rule); after that, it starts straight away.
  const start = async (kind: 'morning' | 'afternoon') => {
    const seen = await AsyncStorage.getItem(DISCLOSED).catch(() => null);
    if (!seen) return setAskFor(kind);
    d.actions.startTrip(kind).catch(() => d.actions.refresh());
  };

  if (configured && d.running) return <Redirect href="/trip" />;

  const nextKind = d.nextKind;
  const day = karachiDayParts(new Date());
  const dateText = t('date.long', { day: t(`day.${day.weekday}` as 'day.0'), date: day.date, month: t(`month.${day.month}` as 'month.1') });
  const childCount = d.riders.length;
  const offCount = d.run.groups.reduce((n, g) => n + g.children.filter((c) => c.state === 'absent').length, 0);
  const stopById = new Map(d.stops.map((s) => [s.id, s]));
  const hasMap = !!(configured && d.van && d.stops.length > 0);
  const canStart = configured && d.van && d.van.verified_at && !d.dayOff && childCount > 0;

  // v11 (canvas "Z11D-Today"): the greeting folds a little as the list scrolls up (plain: no ornament).
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const greet = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, 120], [1, 0.75], 'clamp'), transform: [{ scale: interpolate(y.value, [0, 120], [1, 0.84], 'clamp') }] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      {/* Header */}
      <StatusBar style="light" />
      <Animated.View entering={FadeInUp.springify().damping(22)} style={{ backgroundColor: colors.neel, experimental_backgroundImage: `linear-gradient(180deg, ${colors.neelRaised}, ${colors.neel})`, paddingTop: insets.top + 18, paddingHorizontal: space.xl, paddingBottom: hasMap ? 58 : 30, gap: 10, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <Animated.View style={[{ flex: 1, transformOrigin: dir === 'rtl' ? 'right' : 'left' }, greet]}>
          <Pressable style={{ flex: 1 }} onLongPress={__DEV__ ? () => router.push('/gallery') : undefined}>
            <AppText variant="display" color={colors.ghee} style={{ fontSize: 30 }} testID="today-title" numberOfLines={2}>
              {d.name ? t('driver.hello', { name: d.name }) : t('driver.hello.plain')}
            </AppText>
          </Pressable>
          </Animated.View>
          <LangSwitch tone="dark" />
        </View>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <AppText color={colors.mutedOnDark} style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>
            {[dateText, d.van?.name].filter(Boolean).join(' · ')}
          </AppText>
          {d.requests.length > 0 ? (
            <PressableScale accessibilityRole="button" onPress={() => router.push('/families')} scaleTo="chip" testID="requests-pill"
              faceStyle={{ height: 40, paddingHorizontal: 12, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.kesar, flexDirection: row, alignItems: 'center', gap: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderCurve: 'continuous', backgroundColor: colors.siyahi, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="number" color={colors.kesar} style={{ fontSize: 14, lineHeight: 18 }}>{String(d.requests.length)}</AppText>
              </View>
              <AppText bold color={colors.siyahi} style={{ fontSize: 15 }}>{t('driver.requests.label')}</AppText>
            </PressableScale>
          ) : null}
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 210 }}
        refreshControl={configured ? <RefreshControl refreshing={false} onRefresh={d.actions.refresh} tintColor={colors.kesar} colors={[colors.neel, colors.kesar]} /> : undefined}
      >
        {hasMap ? (
          // The route as a raised card that overlaps the header, so the screen has depth.
          <Animated.View entering={FadeInDown.delay(120).springify().damping(22)} style={{ height: 196, marginTop: -38, marginHorizontal: space.gutter, borderRadius: 28, borderCurve: 'continuous', overflow: 'hidden', boxShadow: elevation.e3, backgroundColor: colors.white }}>
            <PohnchMap
              testID="today-map"
              accessibilityLabel={t('driver.nav.stops')}
              interactive={false}
              pins={d.stops.map((s) => ({ id: s.id, kind: 'number' as const, n: s.position, lat: s.lat, lng: s.lng }))}
              style={{ flex: 1 }}
            />
          </Animated.View>
        ) : null}

        <View style={{ paddingHorizontal: space.gutter, paddingTop: space.xl, gap: space.lg }}>
          {!configured ? (
            <Animated.View entering={FadeInDown.springify()} testID="today-empty" style={{ backgroundColor: colors.white, borderRadius: radius10.group, borderCurve: 'continuous', boxShadow: elevation.e1, padding: space.xl, gap: space.md }}>
              <AppText bold>{t('app.driver.name')}</AppText>
              <AppText variant="secondary">{t('common.notConnected')}</AppText>
              <TapButton tone="left" label={t('driver.nav.practice')} onConfirm={() => router.push('/practice')} testID="nav-practice" />
            </Animated.View>
          ) : d.loading ? (
            <Shimmer lines={[{ w: '50%', h: 18 }, { w: '100%', h: 62 }, { w: '100%', h: 62 }, { w: '100%', h: 62 }]} />
          ) : d.error ? (
            <Animated.View entering={FadeInDown.springify()} style={{ gap: space.md }}>
              <AppText bold color={colors.dangerText}>{t(d.error === 'offline' ? 'error.offline' : 'error.generic')}</AppText>
              <TapButton tone="quiet" label={t('common.retry')} onConfirm={d.actions.refresh} />
            </Animated.View>
          ) : !d.van ? (
            <Animated.View entering={FadeInDown.springify()} testID="today-empty" style={{ gap: space.md, paddingTop: space.lg }}>
              <AppText variant="title" style={{ fontSize: 26 }}>{t('driver.today.setup')}</AppText>
              <AppText variant="secondary">{t('driver.setup.hint')}</AppText>
              <TapButton size="next" tone="left" icon="van" label={t('driver.today.setup')} onConfirm={() => router.push('/setup')} testID="setup-van" />
              <TapButton tone="quiet" icon="help" label={t('driver.account.title')} onConfirm={() => router.push('/account')} testID="nav-account" />
            </Animated.View>
          ) : (
            <>
              <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, flexWrap: 'wrap' }}>
                <AppText bold color={colors.ink2} style={{ flex: 1, fontSize: 15 }}>
                  {d.dayOff ? t('driver.today.dayOffOn') : offCount > 0 ? t('driver.today.count', { n: childCount, off: offCount }) : t('driver.today.countNone', { n: childCount })}
                </AppText>
                <VanBadge status={d.van.switched_off_at ? 'off' : d.van.verified_at ? 'verified' : 'waiting'} />
              </View>
              {!d.van.verified_at ? <AppText variant="secondary">{t('driver.check.pending')}</AppText> : null}
              {d.week && d.week.done > 0 ? <WeekScore tracked={d.week.tracked} done={d.week.done} /> : null}

              {!d.dayOff && childCount === 0 ? (
                <AppText variant="secondary">{t('driver.today.noRiders')}</AppText>
              ) : !d.dayOff ? (
                <View style={{ backgroundColor: colors.white, borderRadius: radius10.group, borderCurve: 'continuous', boxShadow: elevation.e1, paddingHorizontal: 16, paddingVertical: 6 }}>
                  {d.run.groups.map((g, i) => {
                    const s = g.stopId ? stopById.get(g.stopId) : undefined;
                    const time = (d.run.kind === 'morning' ? s?.morning_time : s?.afternoon_time)?.slice(0, 5).replace(/^0/, '');
                    return (
                      <View key={g.stopId ?? i}>
                        <ChildRow index={i} readOnly names={g.children.map((c) => c.firstName)} stop={g.label} order={s?.position} time={time}
                          step={d.run.kind === 'morning' ? 'picked' : 'dropped'} state={g.state === 'absent' ? 'absent' : 'waiting'} onTap={() => undefined} />
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <AlertsCard />
              <SetupChecklist d={d} />

              <View style={{ flexDirection: row, flexWrap: 'wrap', gap: space.sm, marginTop: space.sm }}>
                <NavTile label={t('driver.nav.families')} href="/families" icon="family" badge={d.requests.length} />
                <NavTile label={t('driver.nav.stops')} href="/stops" icon="pin" />
                <NavTile label={t('driver.nav.dayOff')} href="/dayoff" icon="calendar" badge={d.daysOff.length || undefined} tint={colors.kesarTint} ink={colors.onKesar} />
                <NavTile label={t('driver.nav.practice')} href="/practice" icon="route" tint={colors.zamurradTint} ink={colors.zamurradOnTint} />
                {s2 ? <NavTile label={t('s2.fees.title')} href="/earnings" icon="wallet" tint={colors.zamurradTint} ink={colors.zamurradOnTint} /> : null}
              </View>
              <PressableScale accessibilityRole="button" onPress={() => router.push('/account')} testID="nav-account"
                faceStyle={{ minHeight: 64, flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="help" size={20} color={colors.neel} />
                <AppText bold color={colors.neel}>{t('driver.account.title')}</AppText>
              </PressableScale>
            </>
          )}
        </View>
      </Animated.ScrollView>

      {canStart ? (
        <Animated.View entering={FadeInDown.delay(260).springify().damping(20)} style={{ position: 'absolute', left: space.gutter, right: space.gutter, bottom: insets.bottom + space.xl }}>
          {nextKind ? (
            <TapButton size="next" tone="left" icon="van" hold testID="start-trip"
              label={t(nextKind === 'morning' ? 'driver.today.startMorning' : 'driver.today.startAfternoon')}
              sublabel={t('driver.today.startSub')}
              onConfirm={() => start(nextKind)} />
          ) : (
            <View style={{ backgroundColor: colors.zamurradTint, borderRadius: radius.big, borderCurve: 'continuous', padding: space.lg }}>
              <AppText bold align="center" color={colors.zamurradOnTint}>{t('driver.today.done')}</AppText>
            </View>
          )}
        </Animated.View>
      ) : null}
      <LocationDisclosure
        visible={askFor !== null}
        onDecline={() => setAskFor(null)}
        onAccept={async () => {
          const kind = askFor;
          setAskFor(null);
          await AsyncStorage.setItem(DISCLOSED, '1').catch(() => undefined);
          if (kind) d.actions.startTrip(kind).catch(() => d.actions.refresh());
        }}
      />
    </View>
  );
}
