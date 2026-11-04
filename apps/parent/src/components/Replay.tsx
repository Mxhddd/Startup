// v12 ride replay: a finished trip's route played back on the map in about 20 seconds: the van moves
// along its recorded positions (replayAt in @pohnch/core), leaving its trail behind, with the clock
// of that moment. Play/pause and close. Only trips this family can see; nothing new is stored.
import { parent } from '@pohnch/client';
import { karachiClock, replayAt } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, LiquidProgress, PohnchMap, TapButton } from '@pohnch/ui/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LENGTH_MS = 20_000;

export function Replay({ tripId, title, onClose }: { tripId: string | null; title: string; onClose: () => void }) {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const [path, setPath] = useState<{ lat: number; lng: number; at: string }[] | null>(null);
  const [f, setF] = useState(0);
  const [playing, setPlaying] = useState(true);
  const started = useRef<number>(0);

  useEffect(() => {
    if (!tripId) return;
    setPath(null);
    setF(0);
    setPlaying(true);
    parent.tripPath(tripId).then(setPath).catch(() => setPath([]));
  }, [tripId]);

  useEffect(() => {
    if (!playing || !path || path.length < 2) return;
    started.current = Date.now() - f * LENGTH_MS;
    const id = setInterval(() => {
      const next = Math.min(1, (Date.now() - started.current) / LENGTH_MS);
      setF(next);
      if (next >= 1) setPlaying(false);
    }, 120);
    return () => clearInterval(id);
  }, [playing, path]); // eslint-disable-line react-hooks/exhaustive-deps

  const at = path ? replayAt(path, f) : null;
  const trail = useMemo(() => (path && at ? [...path.slice(Math.max(0, at.index - 40), at.index + 1).map((x) => ({ lat: x.lat, lng: x.lng })), { lat: at.lat, lng: at.lng }] : []), [path, at?.index, at?.lat]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal visible={tripId !== null} animationType="slide" onRequestClose={onClose}>
      <View testID="replay" style={{ flex: 1, backgroundColor: colors.ghee }}>
        {path && path.length >= 2 && at ? (
          <PohnchMap accessibilityLabel={title} van={{ lat: at.lat, lng: at.lng, heading: at.heading, stale: false }} trail={trail} follow bottomInset={200} topInset={insets.top + 60} style={{ flex: 1 }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
            <AppText variant="secondary" align="center" testID="replay-empty">{path ? t('replay.none') : ''}</AppText>
          </View>
        )}
        <View style={{ position: 'absolute', top: insets.top + 12, left: space.gutter, right: space.gutter, alignItems: dir === 'rtl' ? 'flex-end' : 'flex-start' }}>
          <View style={{ backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 }}>
            <AppText bold style={{ fontSize: 16 }}>{title}</AppText>
          </View>
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.gutter, paddingBottom: insets.bottom + space.lg, gap: space.md, backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet }}>
          {at ? <AppText variant="number" align="center" style={{ fontSize: 28, lineHeight: 34 }} testID="replay-clock">{karachiClock(new Date(at.at))}</AppText> : null}
          <LiquidProgress value={f} color={colors.neel} />
          <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: space.sm }}>
            {path && path.length >= 2 ? (
              <View style={{ flex: 1 }}>
                <TapButton tone="left" label={playing ? t('replay.pause') : t('replay.play')} testID="replay-play"
                  onConfirm={() => { if (!playing && f >= 1) setF(0); setPlaying(!playing); }} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <TapButton tone="quiet" label={t('replay.close')} onConfirm={onClose} testID="replay-close" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
