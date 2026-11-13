// v12 on the driver's Today (and the notes on the trip): plain, high-contrast, big taps.
//   DriverNotes  - a team notice (kesar) and rain (neel, with one tap "rain delay" during a trip).
//   SignalsCard  - today's quick signals from families: "2 minutes", "coming down", "sick today", "left something".
//   HolidayCard  - the next public holiday within two weeks, with one tap for the whole van off.
//   TimeCard     - change today's start time for the next run (families are told), or put it back.
//   FoundCard    - "found something in the van": pick the child and the thing; the family sees it.
import { useRain } from '@pohnch/client';
import { karachiDate, shiftTime, upcomingHolidays } from '@pohnch/core';
import { colors, radius, radius10, space, useLang } from '@pohnch/ui';
import { AppText, Icon, PressableScale, TapButton, feel, type IconName } from '@pohnch/ui/native';
import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import type { DriverStore } from '../state/DriverStore';

function Card({ tint, ink, icon, title, sub, children, testID }: { tint: string; ink: string; icon: IconName; title: string; sub?: string; children?: React.ReactNode; testID: string }) {
  const { dir } = useLang();
  return (
    <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} exiting={FadeOut} testID={testID} style={{ backgroundColor: tint, borderRadius: radius10.group, borderCurve: 'continuous', padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md }}>
        <Icon name={icon} size={26} color={ink} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText bold color={ink} style={{ fontSize: 18 }}>{title}</AppText>
          {sub ? <AppText color={ink} style={{ fontSize: 16 }}>{sub}</AppText> : null}
        </View>
      </View>
      {children}
    </Animated.View>
  );
}

export function DriverNotes({ d, onRainDelay, compact = false, told: toldProp }: { d: DriverStore; onRainDelay?: () => void; compact?: boolean; told?: boolean }) {
  const { t, dir } = useLang();
  const rain = useRain(!!d.van);
  const [toldOwn, setTold] = useState(false);
  const told = toldProp ?? toldOwn;
  // On the trip screen: the rain line and, until sent, a hold-to-confirm "rain delay" (tells every
  // family, so it holds like the other van-wide taps); notices stay on Today.
  if (compact) {
    if (!rain) return null;
    return (
      <View testID="driver-rain" style={{ gap: 8 }}>
        <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, minHeight: 48 }}>
          <Icon name="cloud" size={22} color={colors.link} />
          <AppText bold color={colors.link} style={{ flex: 1, fontSize: 16 }} numberOfLines={2}>{told ? t('rain.sent') : t('rain.short')}</AppText>
        </View>
        {onRainDelay && !told ? <TapButton testID="rain-delay" hold tone="left" icon="cloud" label={t('rain.delay')} onConfirm={() => { onRainDelay(); setTold(true); feel('confirm'); }} /> : null}
      </View>
    );
  }
  return (
    <>
      {d.notices.map((n) => <Card key={n.id} testID="driver-notice" tint={colors.kesarTint} ink={colors.onKesar} icon="bell" title={t('push.notice.title')} sub={n.body} />)}
      {rain ? (
        <Card testID="driver-rain" tint={colors.neelTint} ink={colors.link} icon="cloud" title={t('rain.title')} sub={told ? t('rain.sent') : t('rain.driver')}>
          {onRainDelay && !told ? <TapButton tone="left" icon="cloud" label={t('rain.delay')} testID="rain-delay" onConfirm={() => { onRainDelay(); setTold(true); }} /> : null}
        </Card>
      ) : null}
    </>
  );
}

export function SignalsCard({ d }: { d: DriverStore }) {
  const { t, dir } = useLang();
  if (d.signals.length === 0) return null;
  const name = new Map(d.riders.map((r) => [r.childId, r.firstName]));
  const tone = (k: string) => (k === 'sick_today' ? colors.kesarTint : k === 'left_item' ? colors.neelTint : colors.zamurradTint);
  const ink = (k: string) => (k === 'sick_today' ? colors.onKesar : k === 'left_item' ? colors.link : colors.zamurradOnTint);
  return (
    <View testID="signals-card" style={{ backgroundColor: colors.white, borderRadius: radius10.group, borderCurve: 'continuous', padding: space.md, gap: 8 }}>
      <AppText bold style={{ fontSize: 16 }}>{t('driver.signals.title')}</AppText>
      {d.signals.slice(0, 6).map((s, i) => (
        <View key={`${s.childId}-${s.kind}-${i}`} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, borderRadius: radius10.row, backgroundColor: tone(s.kind) }}>
          <AppText bold color={ink(s.kind)} style={{ flex: 1, fontSize: 17 }}>{`${name.get(s.childId) ?? ''}: ${t(`signal.${s.kind}`)}`}</AppText>
          <AppText variant="number" color={ink(s.kind)} style={{ fontSize: 15, lineHeight: 20 }}>{new Date(Date.parse(s.at) + 5 * 3600_000).toISOString().slice(11, 16)}</AppText>
        </View>
      ))}
    </View>
  );
}

export function HolidayCard({ d }: { d: DriverStore }) {
  const { t } = useLang();
  const [failed, setFailed] = useState(false);
  const today = karachiDate(new Date());
  const next = upcomingHolidays(today, 14).find((h) => h.date !== today || !d.dayOff);
  if (!next || !d.van) return null;
  const off = d.daysOff.includes(next.date);
  const [y, m, day] = next.date.split('-');
  const when = t('date.short', { date: Number(day), month: t(`month.${Number(m)}` as 'month.1') });
  void y;
  return (
    <Card testID="holiday-card" tint={colors.kesarTint} ink={colors.onKesar} icon="calendar"
      title={t(`holiday.${next.key}` as 'holiday.iqbal')} sub={[when, next.moon ? t('holiday.moon') : null, off ? t('holiday.off') : null].filter(Boolean).join(' · ')}>
      {/* A whole-van day off tells every family: hold to confirm, only for a verified van, and it can be undone. */}
      {!d.van.verified_at ? null : !off ? (
        <TapButton tone="quiet" hold icon="calendar" label={t('holiday.dayOff')} testID="holiday-dayoff"
          onConfirm={() => { setFailed(false); d.actions.setDayOff(next.date, true).catch(() => setFailed(true)); }} />
      ) : (
        <TapButton tone="quiet" label={t('holiday.undo')} testID="holiday-undo"
          onConfirm={() => { setFailed(false); d.actions.setDayOff(next.date, false).catch(() => setFailed(true)); }} />
      )}
      {failed ? <AppText bold color={colors.dangerText}>{t('error.offline')}</AppText> : null}
    </Card>
  );
}

const SHIFTS = [-30, -15, 15, 30, 60];

export function TimeCard({ d }: { d: DriverStore }) {
  const { t, dir } = useLang();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const kind = d.nextKind;
  if (!kind || !d.van || d.dayOff) return null;
  const today = karachiDate(new Date());
  // The run's start: its earliest stop time (the afternoon runs the stops in reverse).
  const times = d.stops.map((x) => (kind === 'morning' ? x.morning_time : x.afternoon_time)?.slice(0, 5)).filter((x): x is string => !!x).sort();
  const usual = times[0] ?? null;
  const changed = d.changes.find((c) => c.date === today && c.kind === kind)?.time ?? null;
  if (!usual) return null;
  const run = t(kind === 'morning' ? 'trip.morning' : 'trip.afternoon');
  return (
    <>
      <PressableScale accessibilityRole="button" onPress={() => setOpen(true)} testID="time-change"
        faceStyle={{ minHeight: 64, borderRadius: radius10.row + 2, backgroundColor: changed ? colors.neelTint : colors.white, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}>
        <Icon name="clock" size={22} color={colors.neel} />
        <AppText bold style={{ flex: 1, fontSize: 16 }}>{changed ? t('driver.time.changed', { run, time: changed.replace(/^0/, '') }) : t('driver.time.change', { run })}</AppText>
        <AppText variant="number" color={colors.link} style={{ fontSize: 16 }}>{(changed ?? usual).replace(/^0/, '')}</AppText>
      </PressableScale>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,26,51,0.5)' }}>
          <View testID="time-sheet" style={{ backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.xl, gap: space.md }}>
            <AppText variant="title">{t('driver.time.title', { run })}</AppText>
            <AppText color={colors.ink2}>{t('driver.time.body', { time: usual.replace(/^0/, '') })}</AppText>
            <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
              {SHIFTS.map((m) => {
                const time = shiftTime(usual, m);
                return (
                  <PressableScale key={m} accessibilityRole="button" testID={`shift-${m}`} style={{ flexBasis: '30%', flexGrow: 1 }}
                    onPress={() => { feel('tap'); setPick(time); }}
                    faceStyle={{ minHeight: 64, borderRadius: radius10.row, backgroundColor: (pick ?? changed) === time ? colors.neel : colors.white, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="number" color={(pick ?? changed) === time ? colors.ghee : colors.siyahi} style={{ fontSize: 20, lineHeight: 26 }}>{time.replace(/^0/, '')}</AppText>
                    <AppText color={(pick ?? changed) === time ? colors.mutedOnDark : colors.ink2} style={{ fontSize: 14 }}>{`${m > 0 ? '+' : '−'}${Math.abs(m)} ${t('min.short')}`}</AppText>
                  </PressableScale>
                );
              })}
            </View>
            {/* Every family gets a push: pick a time, then hold to tell them. */}
            {pick && pick !== changed ? (
              <TapButton hold size="next" tone="left" icon="bell" label={t('driver.time.tell', { time: pick.replace(/^0/, '') })} testID="time-tell"
                onConfirm={() => { setFailed(false); d.actions.changeTime(kind, today, pick).then(() => { setOpen(false); setPick(null); }).catch(() => { setFailed(true); feel('error'); }); }} />
            ) : null}
            {changed ? <TapButton tone="quiet" hold label={t('driver.time.usual')} testID="time-usual" onConfirm={() => { setFailed(false); d.actions.changeTime(kind, today, null).then(() => setOpen(false)).catch(() => { setFailed(true); feel('error'); }); }} /> : null}
            {failed ? <AppText bold color={colors.dangerText}>{t('error.offline')}</AppText> : null}
            <TapButton label={t('common.cancel')} onConfirm={() => { setOpen(false); setPick(null); }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const THINGS = ['bottle', 'bag', 'lunchbox', 'jacket', 'book', 'other'] as const;

export function FoundCard({ d }: { d: DriverStore }) {
  const { t, dir } = useLang();
  const [open, setOpen] = useState(false);
  const [child, setChild] = useState<string | null>(null);
  if (!d.van || d.riders.length === 0) return null;
  const name = new Map(d.riders.map((r) => [r.childId, r.firstName]));
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const chip = (on: boolean) => ({ minHeight: 64, paddingHorizontal: 16, borderRadius: radius10.row, backgroundColor: on ? colors.neel : colors.white, alignItems: 'center' as const, justifyContent: 'center' as const });
  return (
    <>
      {d.found.map((f) => (
        <View key={f.id} testID="found-row" style={{ flexDirection: row, alignItems: 'center', gap: 10, minHeight: 64, paddingHorizontal: 14, borderRadius: radius10.row, backgroundColor: colors.zamurradTint }}>
          <Icon name="bag" size={22} color={colors.zamurradOnTint} />
          <AppText bold color={colors.zamurradOnTint} style={{ flex: 1, fontSize: 16 }}>{t('found.driver', { name: name.get(f.childId) ?? '', what: t(`found.what.${f.what}`) })}</AppText>
          <PressableScale accessibilityRole="button" onPress={() => d.actions.markCollected(f.id)} testID="found-given"
            faceStyle={{ minHeight: 64, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.zamurrad, justifyContent: 'center' }}>
            <AppText bold color={colors.onFill} style={{ fontSize: 16 }}>{t('found.given')}</AppText>
          </PressableScale>
        </View>
      ))}
      <PressableScale accessibilityRole="button" onPress={() => { setChild(null); setOpen(true); }} testID="found-open"
        faceStyle={{ minHeight: 64, flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name="bag" size={20} color={colors.neel} />
        <AppText bold color={colors.neel}>{t('found.open')}</AppText>
      </PressableScale>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,26,51,0.5)' }}>
          <View testID="found-sheet" style={{ backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.xl, gap: space.md, maxHeight: '85%' }}>
            <AppText variant="title">{child ? t('found.what', { name: name.get(child) ?? '' }) : t('found.whose')}</AppText>
            <ScrollView contentContainerStyle={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
              {child === null
                ? d.riders.map((r) => (
                    <PressableScale key={r.childId} accessibilityRole="button" testID={`found-child-${r.childId}`} onPress={() => setChild(r.childId)} faceStyle={chip(false)}>
                      <AppText bold style={{ fontSize: 17 }}>{r.firstName}</AppText>
                    </PressableScale>
                  ))
                : THINGS.map((w) => (
                    <PressableScale key={w} accessibilityRole="button" testID={`found-what-${w}`} style={{ flexBasis: '46%', flexGrow: 1 }}
                      onPress={() => { const c = child; setOpen(false); feel('confirm'); d.actions.markFound(c, w).catch(() => feel('error')); }} faceStyle={chip(false)}>
                      <AppText bold style={{ fontSize: 17 }}>{t(`found.what.${w}`)}</AppText>
                    </PressableScale>
                  ))}
            </ScrollView>
            <TapButton label={t('common.cancel')} onConfirm={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

