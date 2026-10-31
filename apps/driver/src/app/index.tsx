// Driver "Today": what to do now. No van yet -> set it up. A trip running -> back to it.
// Otherwise: today's list and the hold-to-start button for the next run.
// Long-press the title to open the hidden component gallery.
import { useSession } from '@pohnch/client';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, ChildRow, LangSwitch, TapButton, VanBadge } from '@pohnch/ui/native';
import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriver } from '../state/DriverStore';

function NavButton({ label, href, badge }: { label: string; href: '/stops' | '/families' | '/setup' | '/practice'; badge?: number }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} testID={`nav-${href.slice(1)}`}
      style={{ flex: 1, minHeight: 64, borderRadius: radius.button, borderWidth: 2, borderColor: colors.siyahi, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
      <AppText bold align="center">{badge ? `${label} · ${badge}` : label}</AppText>
    </Pressable>
  );
}

export default function DriverToday() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const { configured } = useSession();
  const d = useDriver();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  if (configured && d.running) return <Redirect href="/trip" />;

  const doneKinds = new Set(d.trips.filter((x) => !x.is_practice && x.status !== 'cancelled').map((x) => x.kind));
  const nextKind = !doneKinds.has('morning') ? 'morning' : !doneKinds.has('afternoon') ? 'afternoon' : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee, paddingTop: insets.top + space.lg }}>
      <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, marginBottom: space.lg }}>
        <Pressable onLongPress={() => router.push('/gallery')} accessibilityHint={t('gallery.open')}>
          <AppText variant="display" testID="today-title">{t('driver.today.title')}</AppText>
        </Pressable>
        <LangSwitch tone="dark" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + 160, gap: space.lg }}>
        {!configured ? (
          <View testID="today-empty" style={{ backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.xl, gap: space.sm }}>
            <AppText bold>{t('app.driver.name')}</AppText>
            <AppText variant="secondary">{t('common.notConnected')}</AppText>
            <TapButton tone="left" label={t('driver.nav.practice')} onConfirm={() => router.push('/practice')} testID="nav-practice" />
          </View>
        ) : d.loading ? (
          <AppText variant="secondary">{t('common.loading')}</AppText>
        ) : d.error ? (
          <View style={{ gap: space.md }}>
            <AppText color={colors.dangerText}>{t(d.error === 'offline' ? 'error.offline' : 'error.generic')}</AppText>
            <TapButton label={t('common.retry')} onConfirm={d.actions.refresh} />
          </View>
        ) : !d.van ? (
          <View testID="today-empty" style={{ gap: space.md }}>
            <AppText variant="secondary">{t('driver.setup.hint')}</AppText>
            <TapButton size="next" tone="left" label={t('driver.today.setup')} onConfirm={() => router.push('/setup')} testID="setup-van" />
          </View>
        ) : (
          <>
            <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, flexWrap: 'wrap' }}>
              <AppText bold>{d.van.name}</AppText>
              <VanBadge status={d.van.switched_off_at ? 'off' : d.van.verified_at ? 'verified' : 'waiting'} />
            </View>
            {!d.van.verified_at ? <AppText variant="secondary">{t('driver.check.pending')}</AppText> : null}

            <View style={{ flexDirection: row, gap: space.sm }}>
              <NavButton label={t('driver.nav.stops')} href="/stops" />
              <NavButton label={t('driver.nav.families')} href="/families" badge={d.requests.length} />
              <NavButton label={t('driver.nav.practice')} href="/practice" />
            </View>

            {d.dayOff ? (
              <AppText bold>{t('driver.today.dayOffOn')}</AppText>
            ) : d.riders.length === 0 ? (
              <AppText variant="secondary">{t('driver.today.noRiders')}</AppText>
            ) : (
              d.run.groups.map((g, i) => (
                <ChildRow key={g.stopId ?? i} names={g.children.map((c) => c.firstName)} stop={g.label} step={d.run.kind === 'morning' ? 'picked' : 'dropped'}
                  state={g.state === 'absent' ? 'absent' : 'waiting'} onTap={() => undefined} />
              ))
            )}
          </>
        )}
      </ScrollView>

      {configured && d.van && d.van.verified_at && !d.dayOff && d.riders.length > 0 ? (
        <View style={{ position: 'absolute', left: space.xl, right: space.xl, bottom: insets.bottom + space.lg }}>
          {nextKind ? (
            <TapButton size="next" tone="left" icon="left" hold testID="start-trip"
              label={t(nextKind === 'morning' ? 'driver.today.startMorning' : 'driver.today.startAfternoon')}
              onConfirm={() => d.actions.startTrip(nextKind).catch(() => d.actions.refresh())} />
          ) : (
            <AppText bold align="center">{t('driver.today.done')}</AppText>
          )}
        </View>
      ) : null}
    </View>
  );
}
