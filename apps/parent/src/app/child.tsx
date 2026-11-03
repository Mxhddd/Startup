// Add a child: first name, school, and the home pin placed by hand on the map.
import { parent } from '@pohnch/client';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, TapButton, TextField } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { BrandMap } from '../components/BrandMap';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

export default function AddChild() {
  const { t } = useLang();
  const p = useParent();
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim() || !school.trim()) return setError(t('error.generic'));
    if (!pin) return setError(t('parent.child.pinNeeded'));
    setBusy(true);
    try {
      await parent.addChild({ firstName: name.trim(), schoolName: school.trim(), lat: pin.lat, lng: pin.lng });
      await p.actions.refresh();
      router.replace('/');
    } catch {
      setError(t('error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title={t('parent.addChild')}>
      <TextField label={t('parent.child.firstName')} value={name} onChange={setName} maxLength={30} testID="child-name" />
      <TextField label={t('parent.child.school')} value={school} onChange={setSchool} maxLength={80} testID="child-school" />
      <View style={{ gap: 6 }}>
        <AppText variant="small" bold color={colors.ink2}>{t('parent.child.pin')}</AppText>
        <View style={{ height: 300, borderRadius: radius.big, overflow: 'hidden', boxShadow: shadow.card }}>
          <BrandMap accessibilityLabel={t('parent.child.pin')} home={pin} onPress={setPin} style={{ flex: 1 }} />
        </View>
        <AppText variant="small" color={colors.ink2}>{t('parent.child.pinHint')}</AppText>
      </View>
      {error ? <AppText color={colors.dangerText}>{error}</AppText> : null}
      <TapButton size="next" tone="left" label={t('parent.addChild')} disabled={busy} onConfirm={save} testID="child-save" />
      <View style={{ height: space.lg }} />
    </Page>
  );
}
