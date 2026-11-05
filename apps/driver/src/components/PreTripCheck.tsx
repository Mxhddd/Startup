// v12: the pre-trip checklist. Once a day, before the first real trip: doors, seatbelts, fuel, phone.
// Each line is a big tap (64 px) that ticks; "start" lights up when all four are ticked. Stored on the
// phone only (the date it was last done), nothing is sent: it's a habit, not a report.
import { karachiDate, preTripDue } from '@pohnch/core';
import { colors, radius, radius10, space, useLang } from '@pohnch/ui';
import { AppText, DrawnCheck, PressableScale, TapButton, feel } from '@pohnch/ui/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Modal, View } from 'react-native';

const KEY = 'pohnch.driver.preTrip.v1';
const ITEMS = ['doors', 'belts', 'fuel', 'phone'] as const;

/** True when today's checklist hasn't been done yet. */
export async function preTripNeeded(): Promise<boolean> {
  const last = await AsyncStorage.getItem(KEY).catch(() => null);
  return preTripDue(last, karachiDate(new Date()));
}

export function PreTripCheck({ visible, onDone, onClose }: { visible: boolean; onDone: () => void; onClose: () => void }) {
  const { t, dir } = useLang();
  const [ticked, setTicked] = useState<string[]>([]);
  const all = ITEMS.every((i) => ticked.includes(i));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,26,51,0.5)' }}>
        <View testID="pretrip" style={{ backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.xl, gap: space.md }}>
          <AppText variant="title">{t('driver.check.title')}</AppText>
          <AppText color={colors.ink2}>{t('driver.check.body')}</AppText>
          {ITEMS.map((i) => {
            const on = ticked.includes(i);
            return (
              <PressableScale key={i} accessibilityRole="checkbox" accessibilityState={{ checked: on }} testID={`pretrip-${i}`}
                onPress={() => {
                  feel(on ? 'toggleOff' : 'toggleOn');
                  setTicked((x) => (on ? x.filter((y) => y !== i) : [...x, i]));
                }}
                faceStyle={{ minHeight: 64, borderRadius: radius10.row, borderCurve: 'continuous', backgroundColor: on ? colors.zamurradTint : colors.white, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: on ? colors.zamurrad : colors.sand, alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <DrawnCheck fill={colors.zamurrad} color={colors.white} size={36} /> : null}
                </View>
                <AppText bold color={on ? colors.zamurradOnTint : colors.siyahi} style={{ flex: 1, fontSize: 17 }}>{t(`driver.check.${i}`)}</AppText>
              </PressableScale>
            );
          })}
          <TapButton size={all ? 'next' : 'later'} tone={all ? 'left' : 'neutral'} icon="van" label={t('driver.check.go')} testID="pretrip-go"
            onConfirm={async () => {
              if (!all) return feel('error');
              await AsyncStorage.setItem(KEY, karachiDate(new Date())).catch(() => undefined);
              setTicked([]);
              onDone();
            }} />
          {/* Audit: a way out on iPhone too (Android also has its back button). */}
          <TapButton tone="quiet" label={t('common.cancel')} testID="pretrip-cancel" onConfirm={() => { setTicked([]); onClose(); }} />
        </View>
      </View>
    </Modal>
  );
}
