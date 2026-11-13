// Families (v8): requests first (the thing to act on), each with the stop to pick and approve or
// decline; then the van's invite link; then the children riding, in stop order, in one quiet list.
// Removing a child from the van opens a sheet with a hold, so it never happens by accident.
// Data: memberships via the "app" Edge Function (membership.decide, rider.remove); the invite link
// goes straight to the share sheet and is never shown or logged.
import { driver } from '@pohnch/client';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, ApprovalCard, ChoiceChip, EditSheet, InviteCard, PressableScale, TapButton } from '@pohnch/ui/native';
import { useState } from 'react';
import { Share, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

const layout = LinearTransition.springify().damping(24).stiffness(200);

export default function Families() {
  const { t, dir } = useLang();
  const d = useDriver();
  const [stopFor, setStopFor] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [removing, setRemoving] = useState<{ membershipId: string; name: string } | null>(null);
  const [decided, setDecided] = useState<string[]>([]);
  const decidedRef = decided;
  const requests = d.requests.filter((r) => !decided.includes(r.membershipId));
  if (!d.van) return null;
  const van = d.van;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const position = (stopId: string | null) => d.stops.find((s) => s.id === stopId)?.position ?? 999;
  const riders = [...d.riders].filter((r) => !r.membershipId || !decidedRef.includes(r.membershipId)).sort((a, b) => position(a.stopId) - position(b.stopId) || a.firstName.localeCompare(b.firstName));

  const share = async () => {
    try {
      const { url } = await driver.driverApi.inviteLink(van.id);
      await Share.share({ message: `${van.name} · ${t('app.parent.name')}\n${url}` });
    } catch {
      setError(true);
    }
  };
  // v21: the card leaves the list on the tap; the reload follows. If the server says no, it comes back.
  const decide = async (membershipId: string, approve: boolean) => {
    setError(false);
    setDecided((x) => [...x, membershipId]);
    try {
      await driver.driverApi.decide(membershipId, approve, approve ? stopFor[membershipId] ?? null : null);
    } catch {
      setError(true);
      setDecided((x) => x.filter((y) => y !== membershipId));
    }
    void d.actions.refresh();
  };
  const remove = async () => {
    if (!removing) return;
    const { membershipId } = removing;
    setRemoving(null);
    setDecided((x) => [...x, membershipId]);
    try {
      await driver.driverApi.removeRider(membershipId);
    } catch {
      setError(true);
      setDecided((x) => x.filter((y) => y !== membershipId));
    }
    void d.actions.refresh();
  };

  return (
    <Screen title={t('driver.families.title')}>
      {error ? <AppText bold color={colors.dangerText}>{t('error.generic')}</AppText> : null}

      {requests.length > 0 ? (
        <Animated.View layout={layout} style={{ gap: space.md }}>
          <AppText variant="headline">{t('driver.families.requests')} · {String(requests.length)}</AppText>
          {requests.map((r) => (
            <Animated.View key={r.membershipId} entering={FadeInDown.springify().damping(22).stiffness(300)} layout={layout} style={{ gap: space.sm }}>
              <AppText variant="small" bold color={colors.ink2}>{t('driver.families.pickStop')}</AppText>
              <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
                {d.stops.map((s) => (
                  <ChoiceChip key={s.id} label={`${s.position}. ${s.label}`} on={stopFor[r.membershipId] === s.id} onPress={() => setStopFor((m) => ({ ...m, [r.membershipId]: s.id }))} />
                ))}
              </View>
              <ApprovalCard child={r.firstName} stop={d.stops.find((s) => s.id === stopFor[r.membershipId])?.label ?? '—'}
                onApprove={() => decide(r.membershipId, true)} onDecline={() => decide(r.membershipId, false)} />
            </Animated.View>
          ))}
        </Animated.View>
      ) : null}

      {van.verified_at ? <InviteCard onShare={share} /> : <AppText variant="secondary">{t('driver.families.needsCheck')}</AppText>}
      {requests.length === 0 ? <AppText variant="secondary">{t('driver.families.none')}</AppText> : null}

      <Animated.View layout={layout} style={{ gap: space.sm }}>
        <AppText variant="headline">{t('driver.families.riders', { n: riders.length })}</AppText>
        {riders.length > 0 ? (
          <View style={{ backgroundColor: colors.white, borderRadius: 24, borderCurve: 'continuous', boxShadow: elevation.e1, paddingHorizontal: space.lg }}>
            {riders.map((r, i) => {
              const stop = d.stops.find((s) => s.id === r.stopId);
              return (
                <Animated.View key={r.childId} entering={FadeInDown.delay(i * 30).springify().damping(22).stiffness(300)} layout={layout}
                  style={{ flexDirection: row, alignItems: 'center', gap: space.md, minHeight: 72 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="number" color={colors.white} style={{ fontSize: 15, lineHeight: 20 }}>{stop ? String(stop.position) : '—'}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText bold style={{ fontSize: 18 }}>{r.firstName}</AppText>
                    <AppText variant="small" color={colors.ink2}>{stop?.label ?? '—'}</AppText>
                  </View>
                  <PressableScale accessibilityRole="button" accessibilityLabel={`${t('driver.families.remove')} ${r.firstName}`} scaleTo="chip"
                    onPress={() => r.membershipId && setRemoving({ membershipId: r.membershipId, name: r.firstName })} testID={`rider-remove-${i}`}
                    faceStyle={{ minHeight: 64, paddingHorizontal: 14, justifyContent: 'center' }}>
                    <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{t('parent.menu.remove')}</AppText>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        ) : null}
      </Animated.View>

      <EditSheet visible={removing !== null} title={removing ? t('driver.families.removeTitle', { name: removing.name }) : ''} onClose={() => setRemoving(null)} testID="rider-remove-sheet">
        <AppText variant="secondary">{t('driver.families.removeBody')}</AppText>
        <TapButton hold tone="quiet" label={t('driver.families.remove')} onConfirm={remove} testID="rider-remove-confirm" />
      </EditSheet>
    </Screen>
  );
}
