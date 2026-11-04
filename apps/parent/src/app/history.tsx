// The week (v8): the last 7 days of one child's trips. Pick a day; its morning and afternoon runs show
// as timelines with each step's time and who marked it, and how long the ride took. Days the van was
// off, or the child was on chutti, say so. Read straight from the database (row-level security shows
// only this family's van and its trips).
import { parent, type ParentTrip } from '@pohnch/client';
import { addDays, dayPartsOf, karachiClock, storyOf, timelineFor, type ParentEvent } from '@pohnch/core';
import { colors, elevation, radius10, space, useLang } from '@pohnch/ui';
import { AppText, ChoiceChip, EmptyScene, SectionCaption, Shimmer, TapButton, TimelineEvent } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';
import { Replay } from '../components/Replay';

const STEP_KEY = { left: 'left', picked: 'picked', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped' } as const;
type Day = { trips: ParentTrip[]; events: Record<string, ParentEvent[]> };

export default function History() {
  const { t, dir } = useLang();
  const p = useParent();
  const days = Array.from({ length: 7 }, (_, i) => addDays(p.today, -i));
  const [date, setDate] = useState(days[0] as string);
  const [day, setDay] = useState<Day | null>(null);
  const [failed, setFailed] = useState(false);
  const [replay, setReplay] = useState<{ id: string; kind: 'morning' | 'afternoon' } | null>(null);
  const van = p.van;
  const child = p.child;

  useEffect(() => {
    if (!van || !child) return;
    let live = true;
    setDay(null);
    setFailed(false);
    (async () => {
      const trips = await parent.tripsOn(van.id, date);
      const pairs = await Promise.all(trips.map(async (tr) => [tr.id, await parent.eventsOf(tr.id, { id: van.driver_id, name: p.driverName })] as const));
      if (live) setDay({ trips, events: Object.fromEntries(pairs) });
    })().catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [van?.id, child?.id, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = (d: string, short = false) => {
    if (d === p.today) return t('history.today');
    if (d === addDays(p.today, -1)) return t('history.yesterday');
    const x = dayPartsOf(d);
    return short ? `${t(`dayShort.${x.weekday}` as 'dayShort.0')} ${x.date}` : t('date.long', { day: t(`day.${x.weekday}` as 'day.0'), date: x.date, month: t(`month.${x.month}` as 'month.1') });
  };
  const clock = (iso: string | null) => (iso ? karachiClock(new Date(iso)) : undefined);

  return (
    <Page title={t('history.title', { name: child?.first_name ?? '' })}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', paddingVertical: 4 }}>
        {days.map((d) => <ChoiceChip key={d} label={label(d, true)} on={d === date} onPress={() => setDate(d)} testID={`history-${d}`} />)}
      </ScrollView>
      <SectionCaption>{label(date)}</SectionCaption>
      {!van || !child ? (
        <AppText variant="secondary">{t('history.none')}</AppText>
      ) : failed ? (
        <AppText bold color={colors.dangerText}>{t('error.offline')}</AppText>
      ) : !day ? (
        <Shimmer lines={[{ w: '100%', h: 52 }, { w: '100%', h: 52 }, { w: '100%', h: 52 }]} />
      ) : day.trips.length === 0 ? (
        <Animated.View entering={FadeIn}>
          <EmptyScene kind={date === p.today ? 'road' : 'stars'} title={t('history.noTrips')} testID="history-empty" />
        </Animated.View>
      ) : (
        day.trips.map((tr, n) => {
          const tl = timelineFor(tr.kind, child.id, day.events[tr.id] ?? []);
          const story = storyOf(tr.kind, tl.items);
          return (
            <Animated.View key={tr.id} entering={FadeInDown.delay(n * 80).springify().damping(22)}
              style={{ backgroundColor: colors.white, borderRadius: radius10.group, borderCurve: 'continuous', boxShadow: elevation.e1, padding: space.lg, gap: space.sm }}>
              <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center' }}>
                <AppText bold style={{ flex: 1, fontSize: 18 }}>{t(tr.kind === 'morning' ? 'trip.morning' : 'trip.afternoon')}</AppText>
                {story?.minutes ? <AppText bold color={colors.link}>{t('history.minutes', { n: story.minutes })}</AppText> : null}
              </View>
              <View>
                {tl.items.map((i, k) => (
                  <TimelineEvent key={i.step} index={k} step={STEP_KEY[i.step]} time={clock(i.at)} by={i.by ?? undefined} pending={!i.at} last={k === tl.items.length - 1} />
                ))}
              </View>
              {tr.status === 'ended' ? <TapButton tone="neutral" icon="route" label={t('replay.open')} onConfirm={() => setReplay({ id: tr.id, kind: tr.kind })} testID={`replay-${n}`} /> : null}
            </Animated.View>
          );
        })
      )}
      {van && child ? <TapButton tone="neutral" icon="share" label={t('story.link')} onConfirm={() => router.push('/story')} testID="open-story" /> : null}
      <Replay tripId={replay?.id ?? null} title={replay ? t('replay.title', { run: t(replay.kind === 'morning' ? 'trip.morning' : 'trip.afternoon') }) : ''} onClose={() => setReplay(null)} />
    </Page>
  );
}
