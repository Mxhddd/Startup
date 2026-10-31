// Practice run: the real trip screen with pretend children. Nothing is sent and nobody gets an alert.
import { buildRun, runProgress, type EventRow, type StopGroup } from '@pohnch/core';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, TapButton } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { RunScreen } from '../components/RunScreen';

const SAMPLE = {
  ur: { stops: ['بلاک 13', 'گلی 4', 'گیٹ 2'], kids: [['علی', 0], ['سارہ', 0], ['حمزہ', 1], ['عائشہ', 2], ['زویا', 2]] as const },
  en: { stops: ['Block 13', 'Street 4', 'Gate 2'], kids: [['Ali', 0], ['Sara', 0], ['Hamza', 1], ['Ayesha', 2], ['Zoya', 2]] as const },
};

export default function Practice() {
  const { t, lang } = useLang();
  const s = SAMPLE[lang];
  const [events, setEvents] = useState<(EventRow & { tap: string })[]>([]);
  const [undo, setUndo] = useState<{ text: string; at: number; tap: string } | null>(null);
  const [finished, setFinished] = useState(false);

  const groups = useMemo(
    () =>
      buildRun({
        stops: s.stops.map((label, i) => ({ id: `p${i}`, position: i + 1, label })),
        riders: s.kids.map(([firstName, stop], i) => ({ childId: `k${i}`, firstName, stopId: `p${stop}` })),
        absentChildIds: ['k2'], // one pretend chutti, so the driver sees how it looks
        events,
        kind: 'morning',
        noStopLabel: '—',
      }),
    [s, events],
  );

  if (finished) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ghee, padding: space.xl, justifyContent: 'center', gap: space.lg }}>
        <AppText variant="title" align="center">{t('driver.practice.finished')}</AppText>
        <TapButton size="next" tone="left" label={t('driver.practice.again')} onConfirm={() => { setEvents([]); setFinished(false); }} />
        <TapButton label={t('common.back')} onConfirm={() => router.back()} />
      </View>
    );
  }

  const tap = (g: StopGroup, text: string) => {
    const id = `${Date.now()}`;
    const ids = g.children.filter((c) => c.state === 'waiting').map((c) => c.childId);
    setEvents((e) => [...e, ...ids.map((childId) => ({ childId, step: 'picked', undone: false, tap: id }))]);
    setUndo({ text, at: Date.now(), tap: id });
  };

  return (
    <RunScreen
      kind="morning"
      practice
      banner={t('driver.practice.note')}
      groups={groups}
      progress={runProgress(groups)}
      undo={undo}
      onTapStop={tap}
      onUndo={() => { if (undo) setEvents((e) => e.filter((x) => x.tap !== undo.tap)); setUndo(null); }}
      onUndoExpire={() => setUndo(null)}
      onLate={() => undefined}
      onFinish={() => setFinished(true)}
    />
  );
}
