// A child (v8, canvas "Z8P-Child"): add one, or, opened from the menu with ?id=, change their first
// name, school or home pin. The home pin is placed by hand on the map (the app never reads the
// phone's location). In edit mode two holds at the bottom take the child off their van, or remove the
// child and everything about them.
// Data: children (row-level security: only the child's family can change or remove them); the pin goes
// through set_home_pin; taking a child off a van goes through the "app" Edge Function (van.leave).
import { parent, places, type School } from '@pohnch/client';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, ArchAvatar, FlowSteps, Icon, MorphTarget, PlacePicker, SchoolPicker, SectionCaption, TapButton, TextField } from '@pohnch/ui/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';
import { takeInvite } from '../state/pendingInvite';

export default function ChildPage() {
  const { t, dir } = useLang();
  const p = useParent();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? p.children.find((c) => c.id === id) ?? null : null;
  const [name, setName] = useState(existing?.first_name ?? '');
  // v24: the school comes from Pohnch's list (one spelling per school); an old free-text name is kept until changed.
  const [school, setSchool] = useState<{ id: string; name: string } | null>(existing ? { id: '', name: existing.school_name } : null);
  const [schools, setSchools] = useState<School[]>([]);
  useEffect(() => {
    places.listSchools().then(setSchools).catch(() => setSchools([]));
  }, []);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(existing?.lat != null && existing?.lng != null ? { lat: existing.lat, lng: existing.lng } : null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The store may still be loading when the page opens from a link: fill the fields once it arrives.
  useEffect(() => {
    if (!existing) return;
    setName((v) => v || existing.first_name);
    setSchool((v) => v ?? { id: '', name: existing.school_name });
    setPin((v) => v ?? (existing.lat != null && existing.lng != null ? { lat: existing.lat, lng: existing.lng } : null));
  }, [existing]);

  // Whether this child is on (or waiting for) a van, for "take off this van".
  const [onVan, setOnVan] = useState(false);
  useEffect(() => {
    if (!existing) return;
    parent.membershipOf(existing.id).then((m) => setOnVan(m !== null)).catch(() => setOnVan(false));
  }, [existing]);

  // v21: `wait` = the next screen needs the new data (a first child, before joining a van). Edits go back
  // at once and the reload follows behind.
  const run = async (fn: () => Promise<unknown>, then: () => void, wait = true) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (wait) await p.actions.refresh();
      else void p.actions.refresh();
      then();
    } catch {
      setError(t('error.generic'));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!name.trim() || !school?.name.trim()) return setError(t('parent.child.needed'));
    if (!pin) return setError(t('parent.child.pinNeeded'));
    const c = { firstName: name.trim(), schoolName: school.name.trim(), ...(school.id ? { schoolId: school.id } : {}) };
    if (!existing) {
      // v9 guided path: back to a waiting invite card, or on to joining a van if this is the first child.
      const first = p.children.length === 0;
      return run(() => parent.addChild({ ...c, lat: pin.lat, lng: pin.lng }), () => {
        const tok = takeInvite();
        if (tok) router.replace({ pathname: '/i/[token]', params: { token: tok } });
        else router.replace(first ? '/join' : '/');
      });
    }
    const moved = existing.lat !== pin.lat || existing.lng !== pin.lng;
    return run(async () => {
      await parent.updateChild(existing.id, c);
      if (moved) await parent.setHomePin(existing.id, pin.lat, pin.lng);
    }, () => (router.canGoBack() ? router.back() : router.replace('/')), false);
  };

  return (
    <Page
      title={existing ? existing.first_name : t('parent.addChild')}
      sub={existing ? existing.school_name : null}
      accent={existing ? (
        // v9: the initial flies here from the child's portrait in the menu (Morph), then stays (v10: in an arch).
        <MorphTarget morphKey={`child-${existing.id}`}>
          <Animated.View entering={ZoomIn.springify().damping(16).stiffness(220)}>
            <ArchAvatar letter={(name || existing.first_name).slice(0, 1)} size={64} ring={colors.onBrand} />
          </Animated.View>
        </MorphTarget>
      ) : null}>
      {!existing && p.children.length === 0 ? <FlowSteps step={2} total={3} label={t('parent.flow.label', { n: 2, of: 3 })} /> : null}
      <TextField label={t('parent.child.firstName')} value={name} onChange={setName} maxLength={30} testID="child-name" />
      <SchoolPicker schools={schools} value={school?.name ? school : null} onChange={setSchool} onAdd={(n) => places.addSchool(n)} testID="child-school" />
      <View style={{ gap: 8 }}>
        <SectionCaption>{t('parent.child.pin')}</SectionCaption>
        {/* v24: search the area or street (or tap an area), the map flies there, then tap the gate. */}
        <PlacePicker pin={pin} onPin={setPin} search={places.searchPlaces} testID="child-place" />
        <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 }}>
          <Icon name="shield" size={16} color={colors.zamurrad} />
          <AppText variant="small" color={colors.ink2} style={{ flex: 1 }}>{t('parent.child.pinHint')}</AppText>
        </View>
      </View>
      {error ? <AppText color={colors.dangerText}>{error}</AppText> : null}
      <TapButton size="next" tone="left" icon="check" label={existing ? t('common.save') : t('parent.addChild')} disabled={busy} onConfirm={save} testID="child-save" />

      {existing ? (
        <Animated.View entering={FadeInDown.delay(120).springify().damping(22).stiffness(300)} style={{ gap: space.md, marginTop: space.lg }}>
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
