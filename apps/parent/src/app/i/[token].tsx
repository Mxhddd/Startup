// Opened from a driver's link (pohnch.pk/i/<token> or pohnch://i/<token>), v9 (canvas "Z9P-Invite"):
// a card that shows what you are joining (the van, the school, the driver, and whether Pohnch has
// verified it), which child, and one hold to send the request. Then a moment, and home.
// The token is held in memory for this screen only; it is never logged or stored. If no child is added
// yet, it waits in memory (pendingInvite.ts) while the parent adds one, then this card opens again.
import { parent } from '@pohnch/client';
import { ApiError } from '@pohnch/core';
import { colors, elevation, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, ArchAvatar, ArchShape, ChoiceChip, FlowSteps, Gradient, Icon, MomentFX, SectionCaption, Shimmer, StarPattern, TapButton, TiltLayer, useTilt } from '@pohnch/ui/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
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
  const { width } = useWindowDimensions();
  const tilt = useTilt();
  const cardW = Math.min(width, 480) - space.lg * 2;
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
    <View style={{ flex: 1, backgroundColor: colors.headerBottom }}>
      {/* v11: a starry sky behind the card; tilt the phone and the card floats over it. */}
      <TiltLayer tilt={tilt} depth={-10} style={{ position: 'absolute', left: -30, right: -30, top: -30, bottom: -30 }}>
        <Gradient stops={[[0, colors.headerTop], [0.5, colors.neel], [1, colors.headerBottom]]} />
        <StarPattern opacity={0.08} />
      </TiltLayer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: space.lg, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl, gap: space.lg }}>
        {p.children.length === 0 || !p.membership ? <FlowSteps step={3} total={4} label={t('parent.flow.label', { n: 3, of: 4 })} /> : null}
        {/* v10: the card is a jharoka arch: a pale arch with a kesar seal at its crown, the van's name in Gulzar. */}
        <TiltLayer tilt={tilt} depth={14}>
        <Animated.View entering={FadeInDown.springify().damping(20).stiffness(300)} style={{ boxShadow: shadow.raised, borderBottomLeftRadius: radius.sheet, borderBottomRightRadius: radius.sheet }}>
          <ArchShape width={cardW} height={Math.round(cardW * 0.62)} rise={Math.round(cardW * 0.5)} color={colors.ghee}>
            <View style={{ position: 'absolute', left: space.xl, right: space.xl, top: 34, alignItems: 'center', gap: 4 }}>
              <ArchShape width={64} height={76} color={colors.kesar}>
                <View style={{ position: 'absolute', left: 0, right: 0, top: 30, alignItems: 'center' }}>
                  <Icon name="van" size={28} color={colors.onKesar} />
                </View>
              </ArchShape>
              <AppText bold color={colors.kesarText} style={{ fontSize: 15 }}>{t('parent.invite.eyebrow')}</AppText>
              {peek ? (
                <AppText variant="display" align="center" style={{ fontSize: 32 }}>{t('parent.invite.title', { van: peek.vanName })}</AppText>
              ) : (
                <Shimmer lines={[{ w: '80%', h: 34 }]} />
              )}
            </View>
          </ArchShape>
          <View style={{ backgroundColor: colors.ghee, borderBottomLeftRadius: radius.sheet, borderBottomRightRadius: radius.sheet, marginTop: -1 }}>
          <View style={{ padding: space.xl, gap: space.lg }}>
            {peek ? (
              <Animated.View entering={FadeIn} style={{ flexDirection: row, alignItems: 'center', gap: space.md, backgroundColor: colors.white, borderRadius: 28, borderCurve: 'continuous', padding: 14, boxShadow: elevation.e1 }}>
                <ArchAvatar letter={peek.driverName.slice(0, 1)} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText bold style={{ fontSize: 18 }}>{peek.driverName}</AppText>
                  <AppText variant="small" color={colors.ink2}>{peek.schoolName}</AppText>
                  {peek.verified ? (
                    <View style={{ flexDirection: row, alignItems: 'center', gap: 4 }}>
                      <Icon name="shield" size={15} color={colors.zamurrad} />
                      <AppText bold color={colors.zamurradOnTint} style={{ fontSize: 14 }}>{t('van.verified')}</AppText>
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            ) : (
              <Shimmer lines={[{ w: '100%', h: 52 }]} />
            )}

            {state === 'sent' ? (
              <Animated.View entering={ZoomIn.springify().damping(18).stiffness(300)} style={{ alignItems: 'stretch', gap: space.sm, paddingVertical: space.md }}>
                {/* A kesar seal with room above it, so the stars rise into empty space, not over the driver's name. */}
                <View style={{ height: 112, alignItems: 'center', justifyContent: 'flex-end' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ position: 'absolute', left: 28, top: 28, width: 0, height: 0 }}><MomentFX kind="burst" color={colors.kesar} size={200} /></View>
                    <Icon name="check" size={28} color={colors.onKesar} strokeWidth={2.8} />
                  </View>
                </View>
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
                  <View style={{ gap: 8 }}>
                    <SectionCaption>{t('parent.join.which')}</SectionCaption>
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
          </View>
        </Animated.View>
        </TiltLayer>
      </ScrollView>
    </View>
  );
}
