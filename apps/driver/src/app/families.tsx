// Families: share the van's invite link, and approve each request with the child's stop.
import { driver } from '@pohnch/client';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, ApprovalCard, ChoiceChip, InviteCard, TapButton } from '@pohnch/ui/native';
import { useState } from 'react';
import { Share, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

export default function Families() {
  const { t, dir } = useLang();
  const d = useDriver();
  const [stopFor, setStopFor] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  if (!d.van) return null;
  const van = d.van;

  const share = async () => {
    try {
      const { url } = await driver.driverApi.inviteLink(van.id);
      // The link goes straight to the share sheet; it is never shown or logged.
      await Share.share({ message: `${van.name} · ${t('app.parent.name')}\n${url}` });
    } catch {
      setError(true);
    }
  };
  const decide = async (membershipId: string, approve: boolean) => {
    try {
      await driver.driverApi.decide(membershipId, approve, approve ? stopFor[membershipId] ?? null : null);
      await d.actions.refresh();
    } catch {
      setError(true);
    }
  };

  return (
    <Screen title={t('driver.families.title')}>
      {van.verified_at ? <InviteCard onShare={share} /> : <AppText variant="secondary">{t('driver.families.needsCheck')}</AppText>}
      {error ? <AppText color={colors.dangerText}>{t('error.generic')}</AppText> : null}
      <AppText variant="secondary">{t('driver.families.riders', { n: d.riders.length })}</AppText>
      {d.riders.length > 0 ? <AppText variant="title">{t('driver.families.ridersTitle')}</AppText> : null}
      {d.riders.map((r) => (
        <View key={r.childId} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.md }}>
          <View style={{ flex: 1 }}>
            <AppText bold>{r.firstName}</AppText>
            <AppText variant="small" color={colors.ink2}>{d.stops.find((s) => s.id === r.stopId)?.label ?? '—'}</AppText>
          </View>
          <View style={{ width: 170 }}>
            {/* Hold to confirm: removing a child is not something to do by accident. */}
            <TapButton hold label={t('driver.families.remove')} onConfirm={() => r.membershipId && driver.driverApi.removeRider(r.membershipId).then(d.actions.refresh).catch(() => setError(true))} />
          </View>
        </View>
      ))}
      <AppText variant="title">{t('driver.families.requests')}</AppText>
      {d.requests.length === 0 ? <AppText variant="secondary">{t('driver.families.none')}</AppText> : null}
      {d.requests.map((r) => (
        <View key={r.membershipId} style={{ gap: space.sm }}>
          <AppText variant="small" bold color={colors.ink2}>{t('driver.families.pickStop')}</AppText>
          <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
            {d.stops.map((s) => {
              const on = stopFor[r.membershipId] === s.id;
              return (
                <ChoiceChip key={s.id} label={`${s.position}. ${s.label}`} on={on} onPress={() => setStopFor((m) => ({ ...m, [r.membershipId]: s.id }))} />
              );
            })}
          </View>
          <ApprovalCard child={r.firstName} stop={d.stops.find((s) => s.id === stopFor[r.membershipId])?.label ?? '—'}
            onApprove={() => decide(r.membershipId, true)} onDecline={() => decide(r.membershipId, false)} />
        </View>
      ))}
    </Screen>
  );
}
