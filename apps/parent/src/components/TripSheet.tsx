// What the bottom sheet shows (v7 "un-boxed"), depending on where the family is: no child yet, not on
// a van, waiting for approval, no trip right now, or the van live on the map.
//
// One calm surface, no inner cards:
// - The head morphs with the sheet: at peek it is one line ("Ali's van · 2 stops before you · 6 min");
//   pulled up, that line grows into the big rolling minutes with the arrival time.
// - Under it, one quiet row: the driver, the plate, and three round actions.
// - Further down (seen when the sheet is open): today's timeline.
// - When a step happens while you watch, its moment plays in the head (a ring or a star burst).
import { arrivalClock, childPlace, newMoment, type MomentStep } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AbsentChip, AppText, CircleAction, EtaPill, LineArt, MomentBanner, RollingNumber, Shimmer, TapButton, TimelineEvent } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Share, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { parent as data } from '@pohnch/client';
import { useParent } from '../state/ParentStore';

const STEP_KEY = { left: 'left', picked: 'picked', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped' } as const;
const layout = LinearTransition.springify().damping(24).stiffness(200);

function clock(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(/\s?[AP]M$/, '');
}

/** An onboarding state: the drawn "path arrives" mark, a title, a line, and the buttons. */
function Onboard({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <Animated.View testID="trip-sheet" entering={FadeInDown.springify().damping(22)} style={{ gap: space.lg }}>
      <LineArt width={150} />
      <View style={{ gap: 6 }}>
        <AppText variant="display" style={{ fontSize: 32 }}>{title}</AppText>
        {body ? <AppText variant="secondary">{body}</AppText> : null}
      </View>
      {children}
    </Animated.View>
  );
}

/** The head that morphs: compact line at peek, big minutes when open (progress 0 -> 1). */
function MorphHead({ progress, compact, full }: { progress?: SharedValue<number>; compact: ReactNode; full: ReactNode }) {
  const box = useAnimatedStyle(() => ({ height: interpolate(progress?.value ?? 0, [0, 1], [56, 128], 'clamp') }));
  const small = useAnimatedStyle(() => {
    const p = progress?.value ?? 0;
    return { opacity: interpolate(p, [0, 0.45], [1, 0], 'clamp'), transform: [{ translateY: interpolate(p, [0, 1], [0, -10], 'clamp') }] };
  });
  const big = useAnimatedStyle(() => {
    const p = progress?.value ?? 0;
    return {
      opacity: interpolate(p, [0.3, 0.85], [0, 1], 'clamp'),
      transform: [{ translateY: interpolate(p, [0, 1], [14, 0], 'clamp') }, { scale: interpolate(p, [0, 1], [0.92, 1], 'clamp') }],
    };
  });
  return (
    <Animated.View style={[{ overflow: 'hidden' }, box]}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, small]}>{compact}</Animated.View>
      <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, big]}>{full}</Animated.View>
    </Animated.View>
  );
}

export function TripSheet({ onOpenTrip, expanded, progress }: { onOpenTrip: () => void; expanded: boolean; progress?: SharedValue<number> }) {
  const { t, dir } = useLang();
  const p = useParent();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const name = p.child?.first_name ?? '';

  // Moments: compare the timeline with what it was a moment ago (per child), and play what is new.
  const seen = useRef<{ child: string | null; items: { step: string; at: string | null }[] | null; arriving: boolean }>({ child: null, items: null, arriving: false });
  const [moment, setMoment] = useState<MomentStep | null>(null);
  useEffect(() => {
    const items = p.timeline.items.map((i) => ({ step: i.step, at: i.at }));
    const before = seen.current.child === (p.child?.id ?? null) ? seen.current.items : null;
    const fresh = newMoment(before, items) ?? (before && p.timeline.arriving && !seen.current.arriving ? 'arriving' : null);
    if (fresh) setMoment(fresh);
    seen.current = { child: p.child?.id ?? null, items, arriving: p.timeline.arriving };
  }, [p.timeline, p.child?.id]);

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
    return <Shimmer lines={[{ w: '45%', h: 16 }, { w: '80%', h: 36 }, { w: '100%', h: 48 }]} />;
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
  const firstPending = items.findIndex((i) => !i.at);
  const childStep = p.kind === 'morning' ? 'picked' : 'dropped';
  const childDone = items.some((i) => i.step === childStep && i.at);
  const ahead = p.stopsAhead ?? 0;
  const counting = live && p.eta !== null && !childDone;
  const canSetChutti = p.vanOff !== 'today' && !p.absentToday && p.kind === 'morning' && !items.some((i) => i.step === 'picked' && i.at);
  const canUndo = p.absentToday && p.canUndoChuttiToday;
  // A whole-van day off from the driver: today replaces the "next van" line; tomorrow is a note under it.
  const offToday = !live && p.vanOff === 'today';
  const offBy = t('parent.dayOff.by', { who: p.driverName ?? p.van?.name ?? '' });
  const offNote = !live && p.vanOff === 'tomorrow' ? t('parent.dayOff.tomorrow') : '';
  const nextLine = nextTime ? t(p.kind === 'morning' ? 'parent.idle.morning' : 'parent.idle.afternoon', { time: nextTime.slice(0, 5).replace(/^0/, '') }) : '';

  // The compact line (peek) and the full head (open), for each situation.
  const compact = counting ? (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 12, height: 56 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stale ? colors.ink2 : colors.zamurrad }} />
      <View style={{ flex: 1 }}>
        <AppText bold style={{ fontSize: 18 }} numberOfLines={1}>{t('parent.compact.van', { name })}</AppText>
        <AppText variant="small" bold color={colors.ink2} numberOfLines={1}>{ahead > 0 ? t('parent.compact.ahead', { n: ahead }) : t('parent.compact.next')}</AppText>
      </View>
      {p.eta === 'door' ? (
        <AppText bold color={colors.zamurrad} style={{ fontSize: 18 }}>{t('eta.door')}</AppText>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, direction: 'ltr' }}>
          <RollingNumber value={p.eta as number} size={36} color={stale ? colors.ink2 : colors.siyahi} />
          <AppText bold color={colors.ink2} style={{ fontSize: 15, paddingBottom: 6 }}>{t('min.short')}</AppText>
        </View>
      )}
    </View>
  ) : (
    <View style={{ height: 56, justifyContent: 'center' }}>
      <AppText bold style={{ fontSize: 18 }} numberOfLines={1} testID={offToday ? 'van-off-today' : undefined}>{live ? t(`parent.place.${place}`, { name }) : offToday ? t('parent.dayOff.today') : t('parent.idle.title')}</AppText>
      {!live && (offToday || offNote) ? <AppText variant="small" bold color={colors.kesarText} numberOfLines={1}>{offToday ? offBy : offNote}</AppText> : !live && nextLine ? <AppText variant="small" bold color={colors.ink2} numberOfLines={1}>{nextLine}</AppText> : null}
    </View>
  );
  const full = counting ? (
    <EtaPill minutes={p.eta as number | 'door'} to="home" stale={stale} lead={t(`parent.place.${place}`, { name })} clock={typeof p.eta === 'number' && !stale ? arrivalClock(p.now, p.eta) : undefined} />
  ) : (
    <View>
      <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{live ? t('parent.timeline.title') : name}</AppText>
      <AppText bold style={{ fontSize: 32, lineHeight: 50 }}>{live ? t(`parent.place.${place}`, { name }) : offToday ? t('parent.dayOff.today') : t('parent.idle.title')}</AppText>
      {!live && offToday ? <AppText bold color={colors.kesarText}>{offBy}</AppText> : !live && nextLine ? <AppText variant="secondary">{nextLine}</AppText> : null}
      {!live && offNote ? <AppText bold color={colors.kesarText}>{offNote}</AppText> : null}
    </View>
  );

  return (
    <View testID="trip-sheet" style={{ gap: space.lg }}>
      {offline ? (
        <Animated.View entering={FadeInDown} accessibilityRole="alert" style={{ backgroundColor: colors.siyahi, borderRadius: radius.card, borderCurve: 'continuous', padding: space.md }}>
          <AppText color={colors.ghee}>{t('parent.offline')}</AppText>
        </Animated.View>
      ) : null}

      <Animated.View layout={layout}>
        {moment ? (
          <MomentBanner
            key={moment}
            step={moment}
            title={t(`moment.${moment}`, { name })}
            sub={(() => {
              const it = items.find((i) => i.step === moment);
              return it?.by ? t('timeline.by', { who: it.by }) : undefined;
            })()}
            onDone={() => setMoment(null)}
          />
        ) : (
          <MorphHead progress={progress} compact={compact} full={full} />
        )}
      </Animated.View>

      {/* One quiet row: who drives, the plate, and the round actions. */}
      <Animated.View layout={layout} style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 0px 0px 2.5px ${colors.white}, 0px 0px 0px 4px ${colors.gold}` }}>
          <AppText bold color={colors.siyahi} style={{ fontSize: 17 }}>{(p.driverName ?? p.van?.name ?? '').slice(0, 1)}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText bold numberOfLines={1} style={{ fontSize: 15 }}>{p.driverName ?? p.van?.name ?? ''}</AppText>
          {p.van?.plate ? <AppText variant="number" color={colors.ink2} style={{ fontSize: 14, lineHeight: 20, letterSpacing: 0.8, textAlign: dir === 'rtl' ? 'right' : 'left' }}>{p.van.plate}</AppText> : null}
        </View>
        <CircleAction icon="pulse" label={t('parent.action.trip')} on={expanded} onPress={onOpenTrip} testID="open-trip" />
        <CircleAction
          icon="calendar"
          label={p.absentToday ? t('parent.action.chuttiUndo') : t('parent.action.chutti')}
          on={p.absentToday}
          disabled={p.absentToday ? !canUndo : !canSetChutti}
          onPress={() => p.actions.toggleChutti(p.today)}
          testID="chutti"
        />
        <CircleAction icon="family" label={t('parent.action.family')} onPress={() => router.push('/family')} testID="open-family" />
      </Animated.View>

      {p.timeline.late ? (
        <Animated.View entering={FadeInDown.springify()} layout={layout} style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.shingarf }} />
          <AppText bold color={colors.dangerText} style={{ flex: 1 }}>{t('parent.late', { reason: t(`help.reason.${p.timeline.late as 'traffic'}`) })}</AppText>
        </Animated.View>
      ) : null}

      {p.absentToday ? (
        <Animated.View layout={layout} style={{ gap: space.sm }}>
          <AppText bold>{t('parent.chutti.on', { name })}</AppText>
          {p.canUndoChuttiToday ? <AbsentChip onUndo={() => p.actions.toggleChutti(p.today)} /> : <AppText variant="small" color={colors.ink2}>{t('parent.chutti.locked')}</AppText>}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} layout={layout} style={{ gap: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderColor: colors.hairline }}>
          <AppText bold color={colors.ink2} style={{ fontSize: 15, marginTop: space.sm }}>{t('parent.timeline.title')}</AppText>
          <View>
            {items.map((i, n) => (
              <TimelineEvent key={`${p.child?.id}-${i.step}`} index={n} step={STEP_KEY[i.step]} time={clock(i.at)} by={i.by ?? undefined} pending={!i.at} current={live && n === firstPending} last={n === items.length - 1} />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
