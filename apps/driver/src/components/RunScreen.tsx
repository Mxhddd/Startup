// The trip screen, used by the real trip and the practice run alike.
// Plain and high-contrast. The next stop is the only big button; van-wide taps need a hold.
import type { StopGroup } from '@pohnch/core';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, ChildRow, HelpSheet, OfflineBanner, TapButton, TripHeader, UndoBar, type LateReason } from '@pohnch/ui/native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type RunScreenProps = {
  kind: 'morning' | 'afternoon';
  groups: StopGroup[];
  progress: { done: number; total: number };
  practice?: boolean;
  pending?: number;
  undo: { text: string; at: number } | null;
  onTapStop: (g: StopGroup, undoText: string) => void;
  onUndo: () => void;
  onUndoExpire: () => void;
  /** Morning: "reached school" (then the trip ends). Afternoon: "end trip". */
  onFinish: (undoText: string) => void;
  onLate: (r: LateReason) => void;
  banner?: string;
};

export function RunScreen(p: RunScreenProps) {
  const { t, lang } = useLang();
  const insets = useSafeAreaInsets();
  const [help, setHelp] = useState(false);
  const step = p.kind === 'morning' ? 'picked' : 'dropped';
  const allDone = p.groups.every((g) => g.state !== 'waiting');
  const join = (names: string[]) => names.join(lang === 'ur' ? '، ' : ', ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee, paddingTop: insets.top + space.sm }}>
      <View style={{ paddingHorizontal: space.xl, gap: space.sm }}>
        <TripHeader kind={p.kind} done={p.progress.done} total={p.progress.total} practice={p.practice} onHelp={() => setHelp(true)} />
        {p.banner ? (
          <View style={{ backgroundColor: colors.kesarTint, borderRadius: 14, padding: space.md }}>
            <AppText variant="small" bold>{p.banner}</AppText>
          </View>
        ) : null}
        {p.pending ? <OfflineBanner side="driver" queued={p.pending} /> : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: insets.bottom + 260 }}>
        {p.groups.map((g, i) => (
          <ChildRow
            key={g.stopId ?? `none-${i}`}
            testID={`stop-${i}`}
            names={g.children.map((c) => c.firstName)}
            stop={g.stopId ? g.label : t('driver.trip.noStop')}
            step={step}
            state={g.state}
            isNext={g.isNext}
            onTap={() => {
              const waiting = g.children.filter((c) => c.state === 'waiting').map((c) => c.firstName);
              p.onTapStop(g, t('undo.marked', { name: join(waiting), step: t(`step.${step}`) }));
            }}
          />
        ))}
        {allDone && p.groups.length > 0 ? (
          <AppText variant="secondary" align="center">{t('driver.trip.allDone')}</AppText>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: space.xl, right: space.xl, bottom: insets.bottom + space.lg, gap: space.md }}>
        {p.undo ? (
          <UndoBar key={p.undo.at} text={p.undo.text} tappedAt={p.undo.at} onUndo={p.onUndo} onExpire={p.onUndoExpire} />
        ) : null}
        <TapButton
          testID="finish-trip"
          hold
          size={allDone ? 'next' : 'later'}
          tone={p.kind === 'morning' ? 'reachedSchool' : 'neutral'}
          icon={p.kind === 'morning' ? 'reachedSchool' : undefined}
          label={p.kind === 'morning' ? t('driver.trip.reachedSchool') : t('driver.trip.end')}
          onConfirm={() => p.onFinish(p.kind === 'morning' ? t('step.reachedSchool') : t('driver.trip.end'))}
        />
      </View>

      <HelpSheet visible={help} onClose={() => setHelp(false)} onReason={(r) => { p.onLate(r); setHelp(false); }} />
    </View>
  );
}
