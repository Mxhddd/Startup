// The route: tap the map to add stops in order, rename them, move them up or down, remove them.
import { driver } from '@pohnch/client';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, Icon, type IconName } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { DriverMap } from '../components/DriverMap';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

function SmallButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} hitSlop={4}
      style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ghee, opacity: disabled ? 0.35 : 1 }}>
      <Icon name={icon} size={22} color={colors.siyahi} />
    </Pressable>
  );
}

export default function Stops() {
  const { t, dir } = useLang();
  const d = useDriver();
  const [labels, setLabels] = useState<Record<string, string>>({});
  useEffect(() => setLabels(Object.fromEntries(d.stops.map((s) => [s.id, s.label]))), [d.stops]);
  if (!d.van) return null;
  const van = d.van;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  const add = async ({ lat, lng }: { lat: number; lng: number }) => {
    await driver.addStop(van.id, { label: t('driver.stops.default', { n: d.stops.length + 1 }), lat, lng });
    await d.actions.refresh();
  };
  const move = async (i: number, by: -1 | 1) => {
    const ids = d.stops.map((s) => s.id);
    const [x] = ids.splice(i, 1);
    if (!x) return;
    ids.splice(i + by, 0, x);
    await driver.reorderStops(van.id, ids);
    await d.actions.refresh();
  };

  return (
    <Screen title={t('driver.stops.title')}>
      <AppText variant="secondary">{t('driver.stops.hint')}</AppText>
      <DriverMap pins={d.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, n: s.position }))} onPress={add} />
      {d.stops.length === 0 ? <AppText variant="secondary">{t('driver.stops.empty')}</AppText> : null}
      {d.stops.map((s, i) => (
        <View key={s.id} testID={`stop-row-${i}`} style={{ flexDirection: row, alignItems: 'center', gap: 8, minHeight: 64, backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="small" bold color={colors.white}>{String(s.position)}</AppText>
          </View>
          <TextInput
            value={labels[s.id] ?? s.label}
            onChangeText={(v) => setLabels((l) => ({ ...l, [s.id]: v }))}
            onBlur={() => { const v = (labels[s.id] ?? '').trim(); if (v && v !== s.label) driver.updateStop(s.id, { label: v }).then(d.actions.refresh); }}
            maxLength={40}
            accessibilityLabel={t('driver.stops.title')}
            style={{ flex: 1, minHeight: 48, fontSize: 17, color: colors.siyahi, textAlign: dir === 'rtl' ? 'right' : 'left' }}
          />
          <SmallButton icon="up" label={t('driver.stops.up')} disabled={i === 0} onPress={() => move(i, -1)} />
          <SmallButton icon="down" label={t('driver.stops.down')} disabled={i === d.stops.length - 1} onPress={() => move(i, 1)} />
          <SmallButton icon="close" label={t('driver.stops.remove')} onPress={() => driver.removeStop(s.id).then(d.actions.refresh)} />
        </View>
      ))}
    </Screen>
  );
}
