// Van details: name and number plate (v24: the plate is required; the schools are not asked here any more:
// they are the van's school drop-off stops, so a van can serve several). Parents see the name and plate.
// Verification is done by the Pohnch team from the papers the driver sends (verify.tsx).
import { driver } from '@pohnch/client';
import { normalisePlate } from '@pohnch/core';
import { colors, useLang } from '@pohnch/ui';
import { AppText, TapButton, TextField } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

export default function Setup() {
  const { t } = useLang();
  const d = useDriver();
  const [name, setName] = useState(d.van?.name ?? '');
  const [plate, setPlate] = useState(d.van?.plate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const p = normalisePlate(plate);
    setPlateError(p ? null : t('driver.van.plateBad'));
    if (!name.trim()) return setError(t('error.generic'));
    if (!p) return;
    setBusy(true);
    setError(null);
    try {
      const v = { name: name.trim(), plate: p };
      if (d.van) await driver.updateVan(d.van.id, v);
      else await driver.createVan(v);
      await d.actions.refresh();
      router.replace(d.van ? '/' : '/stops');
    } catch {
      setError(t('error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('driver.setup.title')}>
      <AppText variant="secondary">{t('driver.setup.hint')}</AppText>
      <TextField label={t('driver.van.name')} placeholder={t('driver.van.namePlaceholder')} value={name} onChange={setName} maxLength={40} testID="van-name" />
      <TextField label={t('driver.van.plate')} value={plate} onChange={(v) => setPlate(v.toUpperCase())} onBlur={() => plate && setPlateError(normalisePlate(plate) ? null : t('driver.van.plateBad'))} error={plateError} ltr maxLength={16} testID="van-plate" />
      <AppText variant="secondary">{t('driver.setup.schoolsHint')}</AppText>
      {error ? <AppText color={colors.dangerText}>{error}</AppText> : null}
      <TapButton size="next" tone="left" label={t('driver.save')} disabled={busy} onConfirm={save} testID="van-save" />
    </Screen>
  );
}
