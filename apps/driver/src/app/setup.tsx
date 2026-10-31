// Van details: name, school, plate. Parents see these. Verification is done by the Pohnch team, not here.
import { driver } from '@pohnch/client';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, TapButton, TextField } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

export default function Setup() {
  const { t } = useLang();
  const d = useDriver();
  const [name, setName] = useState(d.van?.name ?? '');
  const [school, setSchool] = useState(d.van?.school_name ?? '');
  const [plate, setPlate] = useState(d.van?.plate ?? '');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim() || !school.trim()) return setError(true);
    setBusy(true);
    try {
      const v = { name: name.trim(), schoolName: school.trim(), plate: plate.trim() || null };
      if (d.van) await driver.updateVan(d.van.id, v);
      else await driver.createVan(v);
      await d.actions.refresh();
      router.replace(d.van ? '/' : '/stops');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('driver.setup.title')}>
      <AppText variant="secondary">{t('driver.setup.hint')}</AppText>
      <TextField label={t('driver.van.name')} placeholder={t('driver.van.namePlaceholder')} value={name} onChange={setName} maxLength={40} testID="van-name" />
      <TextField label={t('driver.van.school')} value={school} onChange={setSchool} maxLength={80} testID="van-school" />
      <TextField label={t('driver.van.plate')} value={plate} onChange={(v) => setPlate(v.toUpperCase())} ltr maxLength={16} testID="van-plate" />
      {error ? <AppText color={colors.dangerText}>{t('error.generic')}</AppText> : null}
      <TapButton size="next" tone="left" label={t('driver.save')} disabled={busy} onConfirm={save} testID="van-save" />
    </Screen>
  );
}
