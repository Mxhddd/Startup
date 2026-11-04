// A child (v8, canvas "Z8P-Child"): add one, or, opened from the menu with ?id=, change their first
// name, school or home pin. The home pin is placed by hand on the map (the app never reads the
// phone's location). In edit mode two holds at the bottom take the child off their van, or remove the
// child and everything about them.
// Data: children (row-level security: only the child's family can change or remove them); the pin goes
// through set_home_pin; taking a child off a van goes through the "app" Edge Function (van.leave).
import { parent } from '@pohnch/client';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, MorphTarget, TapButton, TextField } from '@pohnch/ui/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { BrandMap } from '../components/BrandMap';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

export default function ChildPage() {
  const { t } = useLang();
  const p = useParent();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? p.children.find((c) => c.id === id) ?? null : null;
  const [name, setName] = useState(existing?.first_name ?? '');
  const [school, setSchool] = useState(existing?.school_name ?? '');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(existing?.lat != null && existing?.lng != null ? { lat: existing.lat, lng: existing.lng } : null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The store may still be loading when the page opens from a link: fill the fields once it arrives.
  useEffect(() => {
    if (!existing) return;
    setName((v) => v || existing.first_name);
    setSchool((v) => v || existing.school_name);
    setPin((v) => v ?? (existing.lat != null && existing.lng != null ? { lat: existing.lat, lng: existing.lng } : null));
  }, [existing]);

  // Whether this child is on (or waiting for) a van, for "take off this van".
  const [onVan, setOnVan] = useState(false);
  useEffect(() => {
    if (!existing) return;
    parent.membershipOf(existing.id).then((m) => setOnVan(m !== null)).catch(() => setOnVan(false));
  }, [existing]);

  const run = async (fn: () => Promise<unknown>, then: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await p.actions.refresh();
      then();
    } catch {
      setError(t('error.generic'));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!name.trim() || !school.trim()) return setError(t('parent.child.needed'));
    if (!pin) return setError(t('parent.child.pinNeeded'));
    const c = { firstName: name.trim(), schoolName: school.trim() };
    if (!existing) return run(() => parent.addChild({ ...c, lat: pin.lat, lng: pin.lng }), () => router.replace('/'));
    const moved = existing.lat !== pin.lat || existing.lng !== pin.lng;
    return run(async () => {
      await parent.updateChild(existing.id, c);
      if (moved) await parent.setHomePin(existing.id, pin.lat, pin.lng);
    }, () => (router.canGoBack() ? router.back() : router.replace('/')));
  };

  return (
    <Page title={existing ? existing.first_name : t('parent.addChild')}>
      {existing ? (
        // v9: the kesar initial flies here from the child's row in the menu (Morph), then stays.
        <MorphTarget morphKey={`child-${existing.id}`} style={{ alignSelf: 'center' }}>
          <Animated.View entering={ZoomIn.springify().damping(16).stiffness(220)} style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 0px 0px 4px ${colors.white}, 0px 0px 0px 6px ${colors.gold}, ${shadow.card}` }}>
            <AppText bold color={colors.onKesar} style={{ fontSize: 36, lineHeight: 52 }}>{(name || existing.first_name).slice(0, 1)}</AppText>
          </Animated.View>
        </MorphTarget>
      ) : null}
      <TextField label={t('parent.child.firstName')} value={name} onChange={setName} maxLength={30} testID="child-name" />
      <TextField label={t('parent.child.school')} value={school} onChange={setSchool} maxLength={80} testID="child-school" />
      <View style={{ gap: 6 }}>
        <AppText variant="small" bold color={colors.ink2}>{t('parent.child.pin')}</AppText>
        <View style={{ height: 300, borderRadius: radius.big, borderCurve: 'continuous', overflow: 'hidden', boxShadow: shadow.card }}>
          <BrandMap accessibilityLabel={t('parent.child.pin')} home={pin} onPress={setPin} style={{ flex: 1 }} />
        </View>
        <AppText variant="small" color={colors.ink2}>{t('parent.child.pinHint')}</AppText>
      </View>
      {error ? <AppText color={colors.dangerText}>{error}</AppText> : null}
      <TapButton size="next" tone="left" label={existing ? t('common.save') : t('parent.addChild')} disabled={busy} onConfirm={save} testID="child-save" />

      {existing ? (
        <Animated.View entering={FadeInDown.delay(120).springify().damping(22)} style={{ gap: space.md, marginTop: space.lg, paddingTop: space.lg, borderTopWidth: 1, borderColor: colors.hairline }}>
          {onVan ? (
            <>
              <TapButton hold tone="quiet" label={t('parent.family.leave', { name: existing.first_name })} disabled={busy} testID="leave-van"
                onConfirm={() => run(() => parent.parentApi.leaveVan(existing.id), () => router.replace('/'))} />
              <AppText variant="small" color={colors.ink2}>{t('parent.family.leaveHint')}</AppText>
            </>
          ) : null}
          <TapButton hold tone="quiet" label={t('parent.child.remove', { name: existing.first_name })} disabled={busy} testID="child-remove"
            onConfirm={() => run(() => parent.removeChild(existing.id), () => router.replace('/'))} />
          <AppText variant="small" color={colors.ink2}>{t('parent.child.removeHint')}</AppText>
        </Animated.View>
      ) : null}
      <View style={{ height: space.lg }} />
    </Page>
  );
}
