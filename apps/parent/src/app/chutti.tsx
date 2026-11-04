// Planned chutti (v8, canvas "Z8P-Chutti"): a month calendar for one child. Tap days to mark them off
// (or tap again to take one back); "Save" sends only what changed. The driver sees each day off on
// that morning's list. Days in the past, and more than 60 days ahead, can't be chosen.
// Also the landing place for "Off today" from the home-screen widget and the "van left" alert
// (?quick=today): today comes already chosen, so one tap on Save confirms it.
// Data: absences, through the "app" Edge Function (absence.set / absence.clear).
import { parent } from '@pohnch/client';
import { addDays, canPlanDay, chuttiChanges, dayPartsOf, monthGrid, nextMonth } from '@pohnch/core';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, Icon, PressableScale, TapButton } from '@pohnch/ui/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

function DayCell({ date, chosen, enabled, today, onPress }: { date: string; chosen: boolean; enabled: boolean; today: boolean; onPress: () => void }) {
  const { t } = useLang();
  const n = Number(date.slice(8));
  return (
    <PressableScale accessibilityRole="checkbox" accessibilityState={{ checked: chosen, disabled: !enabled }} accessibilityLabel={`${n} ${chosen ? t('parent.chutti.dayOff') : ''}`}
      onPress={onPress} disabled={!enabled} haptic="tick" scaleTo="chip" style={{ flex: 1, alignItems: 'center' }} testID={`day-${date}`}>
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: today && !chosen ? 2 : 0, borderColor: colors.neel }}>
        {chosen ? <Animated.View entering={ZoomIn.springify().damping(14).stiffness(260)} style={{ position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.kesar }} /> : null}
        <AppText variant="number" color={!enabled ? colors.line : chosen ? colors.onKesar : colors.siyahi} style={{ fontSize: 17, lineHeight: 22 }}>{String(n)}</AppText>
      </View>
    </PressableScale>
  );
}

export default function Chutti() {
  const { t, dir } = useLang();
  const p = useParent();
  const { quick, child } = useLocalSearchParams<{ quick?: string; child?: string }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  // Opened for a particular child (from an alert): show that child.
  useEffect(() => {
    if (child && p.children.some((c) => c.id === child) && p.child?.id !== child) p.actions.selectChild(child);
  }, [child, p.children]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = p.absences;
  const [chosen, setChosen] = useState<string[]>(saved);
  const primed = useRef(false);
  useEffect(() => {
    // Start from what is saved; from the widget or alert, today is already chosen.
    setChosen(quick === 'today' && !primed.current && !saved.includes(p.today) ? [...saved, p.today] : saved);
    if (quick === 'today') primed.current = true;
  }, [saved.join(), p.today, quick]); // eslint-disable-line react-hooks/exhaustive-deps

  const [y0, m0] = p.today.split('-').map(Number) as [number, number];
  const [page, setPage] = useState(0);
  const { year, month } = page === 0 ? { year: y0, month: m0 } : page === 1 ? nextMonth(y0, m0) : nextMonth(nextMonth(y0, m0).year, nextMonth(y0, m0).month);
  const weeks = useMemo(() => monthGrid(year, month), [year, month]);
  const changes = chuttiChanges(saved, chosen);
  const changed = changes.add.length + changes.clear.length > 0;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const name = p.child?.first_name ?? '';

  const toggle = (d: string) => setChosen((c) => (c.includes(d) ? c.filter((x) => x !== d) : [...c, d]));
  const save = async () => {
    if (!p.child) return;
    setBusy(true);
    setError(false);
    try {
      for (const d of changes.add) await parent.parentApi.setAbsence(p.child.id, d);
      for (const d of changes.clear) await parent.parentApi.clearAbsence(p.child.id, d);
      await p.actions.refresh();
      router.canGoBack() ? router.back() : router.replace('/');
    } catch {
      setError(true);
      await p.actions.refresh();
    } finally {
      setBusy(false);
    }
  };

  const upcoming = [...chosen].filter((d) => d >= p.today).sort();
  const label = (d: string) => {
    const x = dayPartsOf(d);
    return t('date.long', { day: t(`day.${x.weekday}` as 'day.0'), date: x.date, month: t(`month.${x.month}` as 'month.1') });
  };

  return (
    <Page title={t('parent.chutti.title', { name })}>
      <AppText variant="secondary">{t('parent.chutti.hint', { who: p.driverName ?? t('parent.chutti.theDriver') })}</AppText>

      <View style={{ backgroundColor: colors.white, borderRadius: 28, borderCurve: 'continuous', boxShadow: elevation.e1, padding: space.sm, paddingVertical: space.md, gap: space.sm }}>
        <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm }}>
          <PressableScale accessibilityRole="button" accessibilityLabel={t('parent.chutti.prev')} disabled={page === 0} onPress={() => setPage((x) => x - 1)} scaleTo="chip"
            faceStyle={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: page === 0 ? 0.3 : 1 }}>
            <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}><Icon name="arrow" size={20} color={colors.siyahi} /></View>
          </PressableScale>
          <Animated.View key={`${year}-${month}`} entering={FadeIn.duration(200)}>
            <AppText bold style={{ fontSize: 18 }}>{t(`month.${month}` as 'month.1')} <AppText variant="number" style={{ fontSize: 18 }}>{String(year)}</AppText></AppText>
          </Animated.View>
          <PressableScale accessibilityRole="button" accessibilityLabel={t('parent.chutti.next')} disabled={page === 2} onPress={() => setPage((x) => x + 1)} scaleTo="chip"
            faceStyle={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: page === 2 ? 0.3 : 1 }}>
            <View style={{ transform: [{ scaleX: dir === 'rtl' ? -1 : 1 }] }}><Icon name="arrow" size={20} color={colors.siyahi} /></View>
          </PressableScale>
        </View>
        <View style={{ flexDirection: row }}>
          {[0, 1, 2, 3, 4, 5, 6].map((w) => (
            <AppText key={w} variant="small" bold color={colors.ink2} align="center" style={{ flex: 1, marginHorizontal: -2 }}>{t(`dayShort.${w}` as 'dayShort.0')}</AppText>
          ))}
        </View>
        <Animated.View key={`g-${year}-${month}`} entering={FadeIn.duration(220)} style={{ gap: 4 }}>
          {weeks.map((w, i) => (
            <View key={i} style={{ flexDirection: row }}>
              {w.map((d, k) =>
                d ? <DayCell key={d} date={d} today={d === p.today} chosen={chosen.includes(d)} enabled={canPlanDay(d, p.today) && (d !== p.today || !saved.includes(d) || p.canUndoChuttiToday)} onPress={() => toggle(d)} />
                  : <View key={`x${k}`} style={{ flex: 1 }} />,
              )}
            </View>
          ))}
        </Animated.View>
      </View>

      {/* v12: off for just one run (the morning or the afternoon), today or tomorrow. Saved at once. */}
      <View style={{ gap: space.sm }} testID="run-off">
        <AppText bold style={{ fontSize: 18 }}>{t('parent.runOff.title')}</AppText>
        <AppText variant="secondary">{t('parent.runOff.hint', { name })}</AppText>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
          {[p.today, addDays(p.today, 1)].flatMap((date) => (['morning', 'afternoon'] as const).map((kind) => {
            const on = p.runOff.some((r) => r.date === date && r.kind === kind);
            const whole = saved.includes(date);
            const locked = whole || (date === p.today && kind === 'morning' && !p.canUndoChuttiToday);
            return (
              <PressableScale key={`${date}-${kind}`} accessibilityRole="checkbox" accessibilityState={{ checked: on || whole, disabled: locked }} disabled={locked} haptic="tick"
                onPress={() => p.actions.toggleRunOff(date, kind).catch(() => setError(true))} testID={`runoff-${date === p.today ? 'today' : 'tomorrow'}-${kind}`} style={{ flexBasis: '47%', flexGrow: 1 }}
                faceStyle={{ minHeight: 56, borderRadius: 18, borderCurve: 'continuous', paddingHorizontal: 14, justifyContent: 'center', backgroundColor: on || whole ? colors.kesar : colors.inset, opacity: locked && !whole ? 0.5 : 1 }}>
                <AppText bold color={on || whole ? colors.onKesar : colors.siyahi} style={{ fontSize: 15 }}>{t(`parent.runOff.${date === p.today ? 'today' : 'tomorrow'}.${kind}`)}</AppText>
              </PressableScale>
            );
          }))}
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <AppText bold style={{ fontSize: 18 }}>{upcoming.length ? t('parent.chutti.count', { n: upcoming.length }) : t('parent.chutti.none')}</AppText>
        {upcoming.length ? <AppText variant="secondary">{upcoming.slice(0, 4).map(label).join(dir === 'rtl' ? '، ' : ', ')}{upcoming.length > 4 ? '…' : ''}</AppText> : null}
      </View>
      {error ? <AppText bold color={colors.dangerText}>{t('parent.chutti.error')}</AppText> : null}
      <TapButton size="next" tone="left" icon="calendar" label={t('common.save')} disabled={!changed || busy || !p.child} onConfirm={save} testID="chutti-save" />
    </Page>
  );
}
