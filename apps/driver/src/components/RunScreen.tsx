// The trip screen (v5 "next stop"), used by the real trip and the practice run alike.
// The map fills the screen behind; the neel header says the run, the progress and the next stop (with
// how far it is); the bottom sheet holds the one big button for the next stop, a button per child when
// siblings share a stop, the rest of the stops, and "reached school" (hold).
//
// How it moves: when a stop is done the big button lifts away and the next one rises in its place;
// the undo bar slides in above it; rows reflow on a spring; the map eases along with the van.
import { distanceM, formatDistance, type StopGroup } from '@pohnch/core';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, ChildRow, HelpSheet, OfflineBanner, PohnchMap, TapButton, TripHeader, UndoBar, type LateReason, type MapPin } from '@pohnch/ui/native';
import { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const layout = LinearTransition.springify().damping(24).stiffness(200);

export type RunScreenProps = {
  kind: 'morning' | 'afternoon';
  groups: StopGroup[];
  progress: { done: number; total: number };
  practice?: boolean;
  pending?: number;
  undo: { text: string; at: number } | null;
  /** Tap a stop: everyone waiting there, or only some (one sibling isn't coming out). */
  onTapStop: (g: StopGroup, undoText: string, only?: string[]) => void;
  onUndo: () => void;
  onUndoExpire: () => void;
  /** Morning: "reached school" (then the trip ends). Afternoon: "end trip". */
  onFinish: (undoText: string) => void;
  onLate: (r: LateReason) => void;
  banner?: string;
  /** Where the stops are, for the map. */
  stops?: { id: string; lat: number; lng: number; position: number }[];
  /** The van's newest position on this phone (only while the trip's location runs). */
  fix?: { lat: number; lng: number; heading: number | null } | null;
};

export function RunScreen(p: RunScreenProps) {
  const { t, lang, dir } = useLang();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [help, setHelp] = useState(false);
  const step = p.kind === 'morning' ? 'picked' : 'dropped';
  const allDone = p.groups.every((g) => g.state !== 'waiting');
  const join = (names: string[]) => names.join(lang === 'ur' ? '، ' : ', ');
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  const next = p.groups.find((g) => g.isNext && g.state === 'waiting') ?? null;
  const waitingAtNext = next ? next.children.filter((c) => c.state === 'waiting') : [];
  const rest = p.groups.filter((g) => g !== next);
  const stopOf = (id: string | null) => (id ? p.stops?.find((s) => s.id === id) : undefined);
  const nextStop = next ? stopOf(next.stopId) : undefined;
  const dist = p.fix && nextStop ? formatDistance(distanceM({ latitude: p.fix.lat, longitude: p.fix.lng }, { latitude: nextStop.lat, longitude: nextStop.lng })) : null;

  const tapText = (names: string[]) => t('undo.marked', { name: join(names), step: t(`step.${step}`) });
  const tapGroup = (g: StopGroup) => p.onTapStop(g, tapText(g.children.filter((c) => c.state === 'waiting').map((c) => c.firstName)));

  const pins: MapPin[] = (p.stops ?? [])
    .filter((s) => p.groups.some((g) => g.stopId === s.id && g.state === 'waiting'))
    .map((s) => ({ id: s.id, kind: 'number' as const, n: s.position, lat: s.lat, lng: s.lng }));
  const sheetMax = Math.round(height * 0.68);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <PohnchMap
        testID="trip-map"
        accessibilityLabel={t('driver.nav.stops')}
        pins={pins}
        van={p.fix ? { lat: p.fix.lat, lng: p.fix.lng, heading: p.fix.heading, stale: false } : null}
        follow
        topInset={insets.top + 120}
        bottomInset={Math.min(sheetMax, 360)}
      />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <TripHeader
          kind={p.kind}
          done={p.progress.done}
          total={p.progress.total}
          practice={p.practice}
          onHelp={() => setHelp(true)}
          next={next ? next.label : undefined}
          distance={dist ? `${dist.n} ${dist.unit}` : undefined}
          topInset={insets.top}
        />
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm }}>
          {p.banner ? (
            <Animated.View entering={FadeInDown.springify()} style={{ backgroundColor: colors.kesarTint, borderRadius: 14, padding: space.md, boxShadow: shadow.float }}>
              <AppText variant="small" bold>{p.banner}</AppText>
            </Animated.View>
          ) : null}
          {p.pending ? <OfflineBanner side="driver" queued={p.pending} /> : null}
        </View>
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: sheetMax, backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, boxShadow: shadow.sheet, paddingTop: 14, paddingHorizontal: 14, paddingBottom: insets.bottom + 14, gap: 10 }}>
        {p.undo ? <UndoBar key={p.undo.at} text={p.undo.text} tappedAt={p.undo.at} onUndo={p.onUndo} onExpire={p.onUndoExpire} /> : null}

        {next ? (
          <Animated.View key={next.stopId ?? 'none'} entering={FadeInDown.springify().damping(20).stiffness(220)} exiting={FadeOutUp.duration(200)} layout={layout} style={{ gap: 10 }} testID={`stop-${p.groups.indexOf(next)}`}>
            <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>
              {[t('driver.trip.nextHere'), waitingAtNext.length > 1 ? t('driver.trip.sameHome') : next.stopId ? next.label : t('driver.trip.noStop')].join(' · ')}
            </AppText>
            <TapButton
              size="next"
              tone={step}
              icon={step}
              label={join(waitingAtNext.map((c) => c.firstName))}
              sublabel={waitingAtNext.length > 1 ? `${t(`step.${step}`)} · ${t('driver.trip.allOne')}` : t(`step.${step}`)}
              onConfirm={() => tapGroup(next)}
              testID={`stop-${p.groups.indexOf(next)}-tap`}
            />
            {waitingAtNext.length > 1 ? (
              <View style={{ flexDirection: row, gap: 8 }}>
                {waitingAtNext.map((c) => (
                  <View key={c.childId} style={{ flex: 1 }}>
                    <TapButton label={t('driver.trip.only', { name: c.firstName })} onConfirm={() => p.onTapStop(next, tapText([c.firstName]), [c.childId])} testID={`only-${c.childId}`} />
                  </View>
                ))}
              </View>
            ) : null}
            {/* The how-it-works line steps aside while the undo bar needs the room. */}
            {!p.undo ? <AppText variant="small" color={colors.ink2}>{t(p.kind === 'morning' ? 'driver.trip.autoNote' : 'driver.trip.autoNoteAfternoon')}</AppText> : null}
          </Animated.View>
        ) : allDone && p.groups.length > 0 ? (
          <Animated.View entering={FadeInDown.springify()} layout={layout}>
            <AppText bold align="center" color={colors.zamurradOnTint}>{t('driver.trip.allDone')}</AppText>
          </Animated.View>
        ) : null}

        {rest.length > 0 ? (
          <Animated.View layout={layout} style={{ flexShrink: 1, gap: 6 }}>
            <AppText variant="small" bold color={colors.ink2}>{t('driver.trip.later')}</AppText>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {rest.map((g, i) => (
                <ChildRow key={g.stopId ?? `none-${i}`} index={i} testID={`stop-${p.groups.indexOf(g)}`} names={g.children.map((c) => c.firstName)} stop={g.stopId ? g.label : t('driver.trip.noStop')}
                  step={step} state={g.state} onTap={() => tapGroup(g)} />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        <Animated.View layout={layout}>
          <TapButton
            testID="finish-trip"
            hold
            size={allDone ? 'next' : 'later'}
            tone={p.kind === 'morning' ? 'reachedSchool' : allDone ? 'left' : 'neutral'}
            icon={p.kind === 'morning' ? 'reachedSchool' : allDone ? 'check' : undefined}
            label={p.kind === 'morning' ? t('driver.trip.reachedSchool') : t('driver.trip.end')}
            onConfirm={() => p.onFinish(p.kind === 'morning' ? t('step.reachedSchool') : t('driver.trip.end'))}
          />
        </Animated.View>
      </View>

      <HelpSheet visible={help} onClose={() => setHelp(false)} onReason={(r) => { p.onLate(r); setHelp(false); }} />
    </View>
  );
}
