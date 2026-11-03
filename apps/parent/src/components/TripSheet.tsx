// What the bottom sheet shows (v5 "home" and "live trip"), depending on where the family is:
// no child yet, not on a van, waiting for approval, no trip right now, or the van live on the map.
//
// Live: who the van is coming for and the minutes to your door (rolling as they change), the route
// dots and how many stops are before you, the driver, and the action tiles. Opened up, it also shows
// today's timeline, each step coming in one after another.
import { arrivalClock, childPlace, distanceM, formatDistance } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AbsentChip, AppText, EtaPill, RouteDots, TapButton, TimelineEvent } from '@pohnch/ui/native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Share, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { parent as data } from '@pohnch/client';
import { useParent } from '../state/ParentStore';
import { ActionTiles } from './ActionTiles';
import { DriverCard } from './DriverCard';

const STEP_KEY = { left: 'left', picked: 'picked', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped' } as const;
const layout = LinearTransition.springify().damping(24).stiffness(200);

function clock(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(/\s?[AP]M$/, '');
}

/** A plain onboarding card in the sheet: a title, a line, and the buttons. */
function Onboard({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <Animated.View testID="trip-sheet" entering={FadeInDown.springify().damping(22)} style={{ gap: space.md }}>
      <View style={{ gap: 4 }}>
        <AppText variant="title" style={{ fontSize: 28 }}>{title}</AppText>
        {body ? <AppText variant="secondary">{body}</AppText> : null}
      </View>
      {children}
    </Animated.View>
  );
}

export function TripSheet({ onOpenTrip, expanded }: { onOpenTrip: () => void; expanded: boolean }) {
  const { t } = useLang();
  const p = useParent();
  const name = p.child?.first_name ?? '';

  const inviteDriver = async () => {
    if (!p.child) return;
    const { url } = await data.parentApi.inviteDriver(p.child.id);
    await Share.share({ message: `${t('parent.inviteDriver.message')}\n${url}` });
  };

  if (p.phase === 'notConfigured' || p.phase === 'error') {
    return (
      <Onboard title={t('parent.sheet.title')} body={p.phase === 'error' ? t('error.offline') : t('parent.sheet.empty')}>
        {p.phase === 'error' ? <TapButton tone="quiet" label={t('common.retry')} onConfirm={p.actions.refresh} /> : null}
      </Onboard>
    );
  }
  if (p.phase === 'loading') {
    return (
      <View style={{ gap: space.md }} accessibilityLabel={t('common.loading')}>
        {[0.6, 0.9, 0.4].map((w, i) => (
          <Animated.View key={i} entering={FadeIn.delay(i * 80)} style={{ height: i === 1 ? 34 : 18, width: `${w * 100}%`, borderRadius: 9, backgroundColor: colors.sand }} />
        ))}
      </View>
    );
  }

  if (p.phase === 'noChild') {
    return (
      <Onboard title={t('parent.noChild.title')} body={t('parent.noChild.body')}>
        <TapButton size="next" tone="left" icon="plus" label={t('parent.addChild')} onConfirm={() => router.push('/child')} testID="add-child" />
      </Onboard>
    );
  }

  if (p.phase === 'notOnVan') {
    return (
      <Onboard title={t('parent.notOnVan.title', { name })} body={t('parent.notOnVan.body')}>
        <TapButton tone="left" icon="route" label={t('parent.join')} onConfirm={() => router.push('/join')} testID="open-join" />
        <TapButton label={t('parent.inviteDriver')} icon="share" onConfirm={inviteDriver} testID="invite-driver" />
      </Onboard>
    );
  }

  if (p.phase === 'waiting') {
    return <Onboard title={t('parent.waiting.title')} body={t('parent.waiting.body', { van: p.van?.name ?? '' })} />;
  }

  // idle or live
  const items = p.timeline.items;
  const offline = p.error !== null;
  const stale = p.signal?.stale ?? false;
  const live = p.phase === 'live';
  const nextTime = p.kind === 'morning' ? p.stop?.morning_time : p.stop?.afternoon_time;
  const place = childPlace(p.kind, items);
  const lead = t(`parent.place.${place}`, { name });
  const firstPending = items.findIndex((i) => !i.at);
  const childStep = p.kind === 'morning' ? 'picked' : 'dropped';
  const childDone = items.some((i) => i.step === childStep && i.at);

  const dist = live && p.position && p.stop ? formatDistance(distanceM({ latitude: p.position.lat, longitude: p.position.lng }, { latitude: p.stop.lat, longitude: p.stop.lng })) : null;
  const distText = dist ? t(dist.unit === 'm' ? 'dist.m' : 'dist.km', { n: dist.n }) : null;
  const ahead = p.stopsAhead ?? 0;

  const canSetChutti = !p.absentToday && p.kind === 'morning' && !items.some((i) => i.step === 'picked' && i.at);
  const canUndo = p.absentToday && p.canUndoChuttiToday;

  return (
    <View testID="trip-sheet" style={{ gap: space.md }}>
      {offline ? (
        <Animated.View entering={FadeInDown} accessibilityRole="alert" style={{ backgroundColor: colors.siyahi, borderRadius: radius.card, padding: space.md }}>
          <AppText color={colors.ghee}>{t('parent.offline')}</AppText>
        </Animated.View>
      ) : null}

      <Animated.View layout={layout}>
        {live && p.eta !== null && !childDone ? (
          <EtaPill minutes={p.eta} to="home" stale={stale} lead={lead} clock={typeof p.eta === 'number' && !stale ? arrivalClock(p.now, p.eta) : undefined} />
        ) : live ? (
          <View>
            <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{t('parent.timeline.title')}</AppText>
            <AppText bold style={{ fontSize: 30, lineHeight: 48 }}>{lead}</AppText>
          </View>
        ) : (
          <View>
            <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{name}</AppText>
            <AppText bold style={{ fontSize: 30, lineHeight: 48 }}>{t('parent.idle.title')}</AppText>
            {nextTime ? <AppText variant="secondary">{t(p.kind === 'morning' ? 'parent.idle.morning' : 'parent.idle.afternoon', { time: nextTime.slice(0, 5).replace(/^0/, '') })}</AppText> : null}
          </View>
        )}
      </Animated.View>

      {live && !childDone && p.stopsAhead !== null ? (
        <Animated.View entering={FadeIn.delay(120)} layout={layout} style={{ gap: 6 }}>
          <RouteDots total={ahead + 2} done={1} />
          {distText ? <AppText variant="small" bold color={colors.ink2}>{ahead > 0 ? t('parent.ahead.some', { n: ahead, dist: distText }) : t('parent.ahead.none', { dist: distText })}</AppText> : null}
        </Animated.View>
      ) : null}

      {p.timeline.late ? (
        <Animated.View entering={FadeInDown.springify()} layout={layout} style={{ backgroundColor: colors.dangerBg, borderRadius: radius.card, padding: space.md }}>
          <AppText bold color={colors.dangerText}>{t('parent.late', { reason: t(`help.reason.${p.timeline.late as 'traffic'}`) })}</AppText>
        </Animated.View>
      ) : null}

      {p.absentToday ? (
        <Animated.View layout={layout} style={{ gap: space.sm }}>
          <AppText bold>{t('parent.chutti.on', { name })}</AppText>
          {p.canUndoChuttiToday ? <AbsentChip onUndo={() => p.actions.toggleChutti(p.today)} /> : <AppText variant="small" color={colors.ink2}>{t('parent.chutti.locked')}</AppText>}
        </Animated.View>
      ) : null}

      <Animated.View layout={layout} style={{ height: 1, backgroundColor: colors.hairline }} />

      <Animated.View layout={layout}>
        <DriverCard driver={p.driverName} van={p.van?.name ?? null} plate={p.van?.plate ?? null} />
      </Animated.View>

      <Animated.View layout={layout}>
        <ActionTiles
          tiles={[
            { key: 'trip', label: t('parent.action.trip'), icon: 'pulse', onPress: onOpenTrip, on: expanded, testID: 'open-trip' },
            p.absentToday
              ? { key: 'chutti', label: t('parent.action.chuttiUndo'), icon: 'calendar', onPress: () => p.actions.toggleChutti(p.today), disabled: !canUndo, on: true, testID: 'chutti' }
              : { key: 'chutti', label: t('parent.action.chutti'), icon: 'calendar', onPress: () => p.actions.toggleChutti(p.today), disabled: !canSetChutti, testID: 'chutti' },
            { key: 'family', label: t('parent.action.family'), icon: 'family', onPress: () => router.push('/family'), testID: 'open-family' },
          ]}
        />
      </Animated.View>

      {expanded && !p.absentToday ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ gap: space.sm, marginTop: space.sm }}>
          <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{t('parent.timeline.title')}</AppText>
          <View>
            {items.map((i, n) => (
              <TimelineEvent key={i.step} index={n} step={STEP_KEY[i.step]} time={clock(i.at)} by={i.by ?? undefined} pending={!i.at} current={live && n === firstPending} last={n === items.length - 1} />
            ))}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
