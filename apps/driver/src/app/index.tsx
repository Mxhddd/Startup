// Driver "Today" (v5): a neel header with the greeting, the date and the van; today's route as a
// still map; the children in stop order in one white card; and the one big hold-to-start button.
// No van yet -> set it up. A trip running -> straight back to it.
// In development builds, a long press on the greeting opens the component gallery.
import { useSession } from '@pohnch/client';
import { karachiDayParts } from '@pohnch/core';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, ChildRow, Icon, LangSwitch, PohnchMap, PressableScale, Shimmer, TapButton, VanBadge, type IconName } from '@pohnch/ui/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationDisclosure } from '../components/LocationDisclosure';
import { SetupChecklist } from '../components/SetupChecklist';
import { useDriver } from '../state/DriverStore';

const DISCLOSED = 'pohnch.driver.locationDisclosed.v1';
type Href = '/stops' | '/families' | '/setup' | '/practice' | '/dayoff' | '/account';

function NavTile({ label, href, icon, badge }: { label: string; href: Href; icon: IconName; badge?: number }) {
  const { dir } = useLang();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} testID={`nav-${href.slice(1)}`} style={{ flex: 1 }}
      faceStyle={{ minHeight: 80, borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: colors.white, boxShadow: shadow.card, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 }}>
      <View>
        <Icon name={icon} size={22} color={colors.neel} />
        {badge ? (
          <Animated.View entering={FadeIn} style={{ position: 'absolute', top: -8, [dir === 'rtl' ? 'left' : 'right']: -14, minWidth: 22, height: 22, borderRadius: 11, borderCurve: 'continuous', backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
            <AppText variant="number" style={{ fontSize: 14, lineHeight: 18 }}>{String(badge)}</AppText>
          </Animated.View>
        ) : null}
      </View>
      <AppText bold align="center" style={{ fontSize: 15 }}>{label}</AppText>
    </PressableScale>
  );
}

export default function DriverToday() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const { configured } = useSession();
  const d = useDriver();
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      {/* Header */}
      <StatusBar style="light" />
      <Animated.View entering={FadeInUp.springify().damping(22)} style={{ backgroundColor: colors.neel, experimental_backgroundImage: `linear-gradient(180deg, ${colors.neelRaised}, ${colors.neel})`, paddingTop: insets.top + 18, paddingHorizontal: space.xl, paddingBottom: hasMap ? 58 : 22, gap: 10 }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <Pressable style={{ flex: 1 }} onLongPress={__DEV__ ? () => router.push('/gallery') : undefined}>
            <AppText variant="display" color={colors.ghee} style={{ fontSize: 30 }} testID="today-title" numberOfLines={2}>
              {d.name ? t('driver.hello', { name: d.name }) : t('driver.hello.plain')}
            </AppText>
          </Pressable>
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 210 }}
        refreshControl={configured ? <RefreshControl refreshing={false} onRefresh={d.actions.refresh} tintColor={colors.kesar} colors={[colors.neel, colors.kesar]} /> : undefined}
      >
        {hasMap ? (
          // The route as a raised card that overlaps the header, so the screen has depth.
          <Animated.View entering={FadeInDown.delay(120).springify().damping(22)} style={{ height: 196, marginTop: -38, marginHorizontal: space.gutter, borderRadius: 26, borderCurve: 'continuous', overflow: 'hidden', boxShadow: shadow.raised, backgroundColor: colors.white }}>
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
            <Animated.View entering={FadeInDown.springify()} testID="today-empty" style={{ backgroundColor: colors.white, borderRadius: radius.big, borderCurve: 'continuous', boxShadow: shadow.card, padding: space.xl, gap: space.md }}>
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
              {d.week && d.week.done > 0 ? (
                <AppText bold color={colors.zamurradOnTint} style={{ fontSize: 15 }} testID="week-line">{t('driver.week', { tracked: d.week.tracked, done: d.week.done })}</AppText>
              ) : null}

              {!d.dayOff && childCount === 0 ? (
                <AppText variant="secondary">{t('driver.today.noRiders')}</AppText>
              ) : !d.dayOff ? (
                <View style={{ backgroundColor: colors.white, borderRadius: radius.card, borderCurve: 'continuous', boxShadow: shadow.card, paddingHorizontal: 18, paddingVertical: 4 }}>
                  {d.run.groups.map((g, i) => {
                    const s = g.stopId ? stopById.get(g.stopId) : undefined;
                    const time = (d.run.kind === 'morning' ? s?.morning_time : s?.afternoon_time)?.slice(0, 5).replace(/^0/, '');
                    return (
                      <View key={g.stopId ?? i} style={{ borderBottomWidth: i < d.run.groups.length - 1 ? 1 : 0, borderColor: colors.hairline }}>
                        <ChildRow index={i} readOnly names={g.children.map((c) => c.firstName)} stop={g.label} order={s?.position} time={time}
                          step={d.run.kind === 'morning' ? 'picked' : 'dropped'} state={g.state === 'absent' ? 'absent' : 'waiting'} onTap={() => undefined} />
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <SetupChecklist d={d} />

              <View style={{ flexDirection: row, gap: space.sm, marginTop: space.sm }}>
                <NavTile label={t('driver.nav.stops')} href="/stops" icon="pin" />
                <NavTile label={t('driver.nav.families')} href="/families" icon="family" badge={d.requests.length} />
                <NavTile label={t('driver.nav.practice')} href="/practice" icon="route" />
                <NavTile label={t('driver.nav.dayOff')} href="/dayoff" icon="calendar" badge={d.daysOff.length || undefined} />
              </View>
              <PressableScale accessibilityRole="button" onPress={() => router.push('/account')} testID="nav-account"
                faceStyle={{ minHeight: 64, flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="help" size={20} color={colors.neel} />
                <AppText bold color={colors.neel}>{t('driver.account.title')}</AppText>
              </PressableScale>
            </>
          )}
        </View>
      </ScrollView>

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
