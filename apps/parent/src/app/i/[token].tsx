// Opened from a driver's link (pohnch.pk/i/<token> or pohnch://i/<token>), v9 (canvas "Z9P-Invite"):
// a card that shows what you are joining (the van, the school, the driver, and whether Pohnch has
// verified it), which child, and one hold to send the request. Then a moment, and home.
// The token is held in memory for this screen only; it is never logged or stored. If no child is added
// yet, it waits in memory (pendingInvite.ts) while the parent adds one, then this card opens again.
import { parent } from '@pohnch/client';
import { ApiError } from '@pohnch/core';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, ChoiceChip, FlowSteps, MomentFX, Shimmer, TapButton } from '@pohnch/ui/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JoinForm } from '../../components/JoinForm';
import { Page } from '../../components/Page';
import { useParent } from '../../state/ParentStore';
import { rememberInvite } from '../../state/pendingInvite';

type Peek = { vanName: string; schoolName: string; driverName: string; verified: boolean };

export default function JoinFromLink() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const p = useParent();
  const { token } = useLocalSearchParams<{ token: string }>();
  const tok = typeof token === 'string' ? token : '';
  const [peek, setPeek] = useState<Peek | null | 'bad'>(null);
  const [childId, setChildId] = useState<string | null>(p.child?.id ?? p.children[0]?.id ?? null);
  const [state, setState] = useState<'ready' | 'busy' | 'sent'>('ready');
  const [error, setError] = useState<string | null>(null);
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  useEffect(() => {
    let live = true;
    parent.parentApi.peekInvite(tok).then((v) => live && setPeek(v)).catch(() => live && setPeek('bad'));
    return () => {
      live = false;
    };
  }, [tok]);
  useEffect(() => {
    if (!childId && p.children[0]) setChildId(p.children[0].id);
  }, [p.children, childId]);

  // A link that doesn't work: say so calmly and offer the paste form.
  if (peek === 'bad') {
    return (
      <Page title={t('parent.join.title')}>
        <AppText bold color={colors.dangerText}>{t('parent.join.bad')}</AppText>
        <JoinForm />
      </Page>
    );
  }

  const join = async () => {
    if (!childId) return;
    setState('busy');
    setError(null);
    try {
      await parent.parentApi.joinVan(tok, childId);
      setState('sent');
      await p.actions.refresh();
    } catch (e) {
      setState('ready');
      const code = e instanceof ApiError ? e.code : '';
      setError(code === 'child_already_on_a_van' ? t('parent.invite.already') : code === 'invite_invalid' ? t('parent.join.bad') : t('error.generic'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.neelDeep }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: space.lg, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl, gap: space.lg }}>
        {p.children.length === 0 || !p.membership ? <FlowSteps step={3} total={4} label={t('parent.flow.label', { n: 3, of: 4 })} /> : null}
        <Animated.View entering={FadeInDown.springify().damping(20)} style={{ backgroundColor: colors.white, borderRadius: radius.sheet, borderCurve: 'continuous', overflow: 'hidden', boxShadow: shadow.raised }}>
          <View style={{ backgroundColor: colors.neel, experimental_backgroundImage: `linear-gradient(160deg, ${colors.neelRaised}, ${colors.neel})`, padding: space.xl, gap: 4 }}>
            <AppText bold color={colors.kesar} style={{ fontSize: 15 }}>{t('parent.invite.eyebrow')}</AppText>
            {peek ? (
              <AppText variant="display" color={colors.onBrand} style={{ fontSize: 32 }}>{t('parent.invite.title', { van: peek.vanName })}</AppText>
            ) : (
              <Shimmer lines={[{ w: '80%', h: 34 }]} />
            )}
          </View>
          <View style={{ padding: space.xl, gap: space.lg }}>
            {peek ? (
              <Animated.View entering={FadeIn} style={{ flexDirection: row, alignItems: 'center', gap: space.md }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 0px 0px 3px ${colors.white}, 0px 0px 0px 5px ${colors.gold}` }}>
                  <AppText bold color={colors.onKesar} style={{ fontSize: 22 }}>{peek.driverName.slice(0, 1)}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText bold style={{ fontSize: 18 }}>{peek.driverName}</AppText>
                  <AppText variant="small" color={colors.ink2}>{peek.schoolName}</AppText>
                </View>
                {peek.verified ? (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.zamurradTint }}>
                    <AppText bold color={colors.zamurradOnTint} style={{ fontSize: 14 }}>{t('van.verified')}</AppText>
                  </View>
                ) : null}
              </Animated.View>
            ) : (
              <Shimmer lines={[{ w: '100%', h: 52 }]} />
            )}

            {state === 'sent' ? (
              <Animated.View entering={ZoomIn.springify().damping(16)} style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
                <View style={{ width: 0, height: 0 }}><MomentFX kind="burst" color={colors.kesar} size={200} /></View>
                <AppText variant="display" align="center" style={{ fontSize: 28 }}>{t('parent.invite.sentTitle')}</AppText>
                <AppText variant="secondary" align="center">{t('parent.invite.sentBody', { who: peek ? peek.driverName : '' })}</AppText>
                <TapButton size="next" tone="left" label={t('parent.invite.home')} onConfirm={() => router.replace('/')} testID="invite-home" />
              </Animated.View>
            ) : p.children.length === 0 ? (
              <View style={{ gap: space.md }}>
                <AppText variant="secondary">{t('parent.invite.addFirst')}</AppText>
                <TapButton size="next" tone="left" icon="plus" label={t('parent.addChild')} testID="invite-add-child"
                  onConfirm={() => { rememberInvite(tok); router.push('/child'); }} />
              </View>
            ) : (
              <View style={{ gap: space.md }}>
                {p.children.length > 1 ? (
                  <View style={{ gap: 6 }}>
                    <AppText variant="small" bold color={colors.ink2}>{t('parent.join.which')}</AppText>
                    <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
                      {p.children.map((c) => <ChoiceChip key={c.id} label={c.first_name} on={c.id === childId} onPress={() => setChildId(c.id)} />)}
                    </View>
                  </View>
                ) : (
                  <AppText variant="secondary">{t('parent.invite.for', { name: p.children[0]?.first_name ?? '' })}</AppText>
                )}
                {error ? <AppText bold color={colors.dangerText}>{error}</AppText> : null}
                <TapButton size="next" tone="left" hold feel="success" label={t('parent.invite.join')} disabled={!peek || state === 'busy' || !childId} onConfirm={join} testID="invite-join" />
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
