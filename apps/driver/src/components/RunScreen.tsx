// The trip screen (v5 "next stop"), used by the real trip and the practice run alike.
// The map fills the screen behind; the neel header says the run, the progress and the next stop (with
// how far it is); the bottom sheet holds the one big button for the next stop, a button per child when
// siblings share a stop, the rest of the stops, and "reached school" (hold).
//
// How it moves: when a stop is done the big button lifts away and the next one rises in its place;
// the undo bar slides in above it; rows reflow on a spring; the map eases along with the van.
import { distanceM, formatDistance, nudges, type StopGroup } from '@pohnch/core';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, ChildRow, DrawnCheck, HelpSheet, Icon, OfflineBanner, PohnchMap, PressableScale, TapButton, TripHeader, UndoBar, type LateReason, type MapPin } from '@pohnch/ui/native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutUp, LinearTransition, SlideInDown, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { say } from '../voice';
import { haptic } from '@pohnch/ui/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const layout = LinearTransition.springify().damping(24).stiffness(200);

/** Just marked: a calm green panel, the tick drawing itself, and who was told. Stays for the undo time. */
function MarkedPanel({ text }: { text: string }) {
  const { t, dir } = useLang();
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(240)}
      exiting={FadeOutUp.duration(220)}
      layout={layout}
      testID="marked-panel"
      style={{ minHeight: 112, borderRadius: radius.big, borderCurve: 'continuous', backgroundColor: colors.zamurradTint, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14 }}
    >
      <View style={{ borderRadius: 40, borderCurve: 'continuous', boxShadow: '0px 0px 0px 8px rgba(23,112,90,0.14)' }}>
        <DrawnCheck fill={colors.zamurrad} color={colors.white} size={64} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText bold color={colors.zamurradOnTint} style={{ fontSize: 20 }}>{text}</AppText>
        <AppText bold variant="small" color={colors.zamurradOnTint}>{t('driver.trip.told')}</AppText>
      </View>
    </Animated.View>
  );
}

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
  fix?: { lat: number; lng: number; heading: number | null; speed?: number | null } | null;
  /** v8: children whose family said "we're ready" (ids). */
  ready?: string[];
  /** v8: the school pin, for the "reached school" nudge. */
  school?: { lat: number; lng: number } | null;
  /** v8: spoken prompts, and the switch for them. */
  voice?: boolean;
  onVoice?: () => void;
};

/** A soft, slow breath (scale and glow) around the button that is due now; still otherwise. */
function Breathe({ on, children }: { on: boolean; children: ReactNode }) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (on) v.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    else {
      cancelAnimation(v);
      v.value = withTiming(0, { duration: 200 });
    }
  }, [on, v]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + v.value * 0.025 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Once, when the last child is in: a zamurrad wash sweeps across the sheet from the reading start. */
function AllDoneSweep({ show }: { show: boolean }) {
  const { dir } = useLang();
  const v = useSharedValue(0);
  const was = useRef(show);
  useEffect(() => {
    if (show && !was.current) {
      haptic.success();
      v.value = 0;
      v.value = withSequence(withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }), withTiming(2, { duration: 500 }));
    }
    was.current = show;
  }, [show, v]);
  const style = useAnimatedStyle(() => ({ width: `${Math.min(1, v.value) * 100}%`, opacity: v.value === 0 ? 0 : v.value <= 1 ? 0.22 : 0.22 * (2 - v.value) }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.zamurrad }, dir === 'rtl' ? { right: 0 } : { left: 0 }, style]} />;
}

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
  const toStop = p.fix && nextStop ? distanceM({ latitude: p.fix.lat, longitude: p.fix.lng }, { latitude: nextStop.lat, longitude: nextStop.lng }) : null;
  const dist = toStop !== null ? formatDistance(toStop) : null;
  const toSchool = p.fix && p.school ? distanceM({ latitude: p.fix.lat, longitude: p.fix.lng }, { latitude: p.school.lat, longitude: p.school.lng }) : null;
  const nudge = nudges({ toStop, toSchool, speed: p.fix?.speed ?? null, morning: p.kind === 'morning', allDone });
  const readyHere = waitingAtNext.filter((c) => p.ready?.includes(c.childId));

  // One bump when the van stops at the next stop (once per stop).
  const bumped = useRef<string | null>(null);
  useEffect(() => {
    const key = next?.stopId ?? null;
    if (nudge.atStop && key && bumped.current !== key) {
      bumped.current = key;
      haptic.press();
    }
  }, [nudge.atStop, next?.stopId]);

  // Spoken prompts: the next stop when the van comes near it, and each mark after the tap.
  const spokenStop = useRef<string | null>(null);
  useEffect(() => {
    const key = next?.stopId ?? null;
    if (!p.voice || !nudge.nearStop || !next || !key || spokenStop.current === key) return;
    spokenStop.current = key;
    say(t('driver.voice.next', { stop: next.label, names: join(waitingAtNext.map((c) => c.firstName)) }), lang);
  }, [p.voice, nudge.nearStop, next?.stopId]); // eslint-disable-line react-hooks/exhaustive-deps
  const spokenUndo = useRef<number | null>(null);
  useEffect(() => {
    if (!p.voice || !p.undo || spokenUndo.current === p.undo.at) return;
    spokenUndo.current = p.undo.at;
    say(p.undo.text, lang);
  }, [p.voice, p.undo?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  const tapText = (names: string[]) => t('undo.marked', { name: join(names), step: t(`step.${step}`) });
  const tapGroup = (g: StopGroup) => p.onTapStop(g, tapText(g.children.filter((c) => c.state === 'waiting').map((c) => c.firstName)));

  const pins: MapPin[] = (p.stops ?? [])
    .filter((s) => p.groups.some((g) => g.stopId === s.id && g.state === 'waiting'))
    .map((s) => ({ id: s.id, kind: 'number' as const, n: s.position, lat: s.lat, lng: s.lng }));
  const sheetMax = Math.round(height * 0.7);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <PohnchMap
        testID="trip-map"
        accessibilityLabel={t('driver.nav.stops')}
        pins={pins}
        van={p.fix ? { lat: p.fix.lat, lng: p.fix.lng, heading: p.fix.heading, stale: false, speed: p.fix.speed } : null}
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
            <Animated.View entering={FadeInDown.springify()} style={{ backgroundColor: colors.kesarTint, borderRadius: 14, borderCurve: 'continuous', padding: space.md, boxShadow: shadow.float }}>
              <AppText variant="small" bold>{p.banner}</AppText>
            </Animated.View>
          ) : null}
          {p.pending ? <OfflineBanner side="driver" queued={p.pending} /> : null}
        </View>
      </View>

      <Animated.View entering={SlideInDown.springify().damping(26).stiffness(220)} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: sheetMax, overflow: 'hidden', backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, boxShadow: shadow.sheet, paddingTop: 22, paddingHorizontal: space.gutter, paddingBottom: insets.bottom + 20, gap: 14 }}>
        <AllDoneSweep show={allDone && p.groups.length > 0} />
        {p.undo ? <MarkedPanel key={`m${p.undo.at}`} text={p.undo.text} /> : null}
        {p.undo ? <UndoBar key={p.undo.at} text={t('undo.prompt')} tappedAt={p.undo.at} onUndo={p.onUndo} onExpire={p.onUndoExpire} /> : null}

        {next ? (
          <Animated.View key={next.stopId ?? 'none'} entering={FadeInDown.springify().damping(20).stiffness(220)} exiting={FadeOutUp.duration(200)} layout={layout} style={{ gap: 10 }} testID={`stop-${p.groups.indexOf(next)}`}>
            <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
              <AppText bold color={nudge.atStop ? colors.zamurradOnTint : colors.ink2} style={{ fontSize: 15, flex: 1 }}>
                {nudge.atStop
                  ? [t('driver.trip.atStop'), waitingAtNext.length > 1 ? t('driver.trip.sameHome') : next.label].join(' · ')
                  : [t('driver.trip.nextHere'), waitingAtNext.length > 1 ? t('driver.trip.sameHome') : next.stopId ? next.label : t('driver.trip.noStop')].join(' · ')}
              </AppText>
              {p.onVoice ? (
                <PressableScale accessibilityRole="switch" accessibilityState={{ checked: !!p.voice }} accessibilityLabel={t('driver.voice.label')} onPress={p.onVoice} scaleTo="chip" testID="voice-toggle"
                  faceStyle={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: p.voice ? colors.neel : colors.sand }}>
                  <Icon name="sound" size={24} color={p.voice ? colors.ghee : colors.ink2} />
                </PressableScale>
              ) : null}
            </View>
            {readyHere.length > 0 ? (
              <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: row, alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.zamurradTint }} testID="ready-note">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.zamurrad }} />
                <AppText bold color={colors.zamurradOnTint} style={{ fontSize: 15 }}>{t('driver.trip.ready', { name: join(readyHere.map((c) => c.firstName)) })}</AppText>
              </Animated.View>
            ) : null}
            <Breathe on={nudge.atStop && !p.undo}>
            <TapButton
              size={p.undo ? 'later' : 'next'}
              tone={step}
              icon={step}
              label={join(waitingAtNext.map((c) => c.firstName))}
              sublabel={waitingAtNext.length > 1 ? `${t(`step.${step}`)} · ${t('driver.trip.allOne')}` : t(`step.${step}`)}
              onConfirm={() => tapGroup(next)}
              testID={`stop-${p.groups.indexOf(next)}-tap`}
            />
            </Breathe>
            {waitingAtNext.length > 1 && !p.undo ? (
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

        <Animated.View layout={layout} style={{ gap: 8 }}>
          {nudge.atSchool ? <AppText bold align="center" color={colors.kesarText} testID="at-school">{t('driver.trip.atSchool')}</AppText> : null}
          <Breathe on={nudge.atSchool}>
          <TapButton
            testID="finish-trip"
            hold
            size={allDone ? 'next' : 'later'}
            tone={p.kind === 'morning' ? 'reachedSchool' : allDone ? 'left' : 'neutral'}
            icon={p.kind === 'morning' ? 'reachedSchool' : allDone ? 'check' : undefined}
            label={p.kind === 'morning' ? t('driver.trip.reachedSchool') : t('driver.trip.end')}
            onConfirm={() => p.onFinish(p.kind === 'morning' ? t('step.reachedSchool') : t('driver.trip.end'))}
          />
          </Breathe>
        </Animated.View>
      </Animated.View>

      <HelpSheet visible={help} onClose={() => setHelp(false)} onReason={(r) => { p.onLate(r); setHelp(false); }} />
    </View>
  );
}
