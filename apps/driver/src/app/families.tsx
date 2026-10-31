// Families: share the van's invite link, and approve each request with the child's stop.
import { driver } from '@pohnch/client';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, ApprovalCard, InviteCard } from '@pohnch/ui/native';
import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
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
      <AppText variant="title">{t('driver.families.requests')}</AppText>
      {d.requests.length === 0 ? <AppText variant="secondary">{t('driver.families.none')}</AppText> : null}
      {d.requests.map((r) => (
        <View key={r.membershipId} style={{ gap: space.sm }}>
          <AppText variant="small" bold color={colors.ink2}>{t('driver.families.pickStop')}</AppText>
          <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
            {d.stops.map((s) => {
              const on = stopFor[r.membershipId] === s.id;
              return (
                <Pressable key={s.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setStopFor((m) => ({ ...m, [r.membershipId]: s.id }))}
                  style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center', borderWidth: 2, borderColor: colors.siyahi, backgroundColor: on ? colors.siyahi : colors.white }}>
                  <AppText bold color={on ? colors.ghee : colors.siyahi}>{`${s.position}. ${s.label}`}</AppText>
                </Pressable>
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
