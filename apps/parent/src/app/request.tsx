// Ask for a new van (v10 stage 2, canvas "Z10S-Request"): for the child's neighbourhood and school.
// It opens at 4 children and Pohnch brings a verified van at 8; nobody pays until a van runs. The
// progress counts open requests for the same school within 2 km (no names, no places shown).
import { stage2 } from '@pohnch/client';
import { ApiError } from '@pohnch/core';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, ArchShape, Icon, Shimmer, TapButton } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

const OPENS = 4;
const LAUNCH = 8;

export default function Request() {
  const { t, dir } = useLang();
  const p = useParent();
  const child = p.child;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const [id, setId] = useState<string | null>(null);
  const [n, setN] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    if (!child) return;
    setBusy(true);
    setError(null);
    try {
      const rid = await stage2.requestVan(child.id);
      setId(rid);
      setN(await stage2.requestProgress(rid));
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'no_home_pin' ? t('s2.find.noPin') : e instanceof ApiError && e.code === 'stage2_off' ? t('s2.off') : t('error.generic'));
    } finally {
      setBusy(false);
    }
  };
  // Audit: opening the page no longer creates a request; the parent asks with the button.
  useEffect(() => {
    setId(null);
    setN(null);
    setError(null);
  }, [child?.id]);

  const count = n ?? 0;
  return (
    <Page title={t('s2.req.title')} sub={t('s2.req.sub')}>
      {error ? <AppText bold color={colors.dangerText}>{error}</AppText> : null}
      {n === null && busy ? (
        <Shimmer lines={[{ w: '100%', h: 200 }]} />
      ) : n === null ? (
        <View style={{ gap: 12 }} testID="request-start">
          <AppText variant="secondary">{t('s2.req.body', { n: LAUNCH })}</AppText>
          <TapButton size="next" tone="left" icon="plus" label={t('s2.req.start')} onConfirm={ask} testID="request-ask" />
        </View>
      ) : n !== null ? (
        <Animated.View entering={FadeInDown.springify().damping(22)} style={{ backgroundColor: colors.white, borderRadius: 28, padding: 18, gap: 14, boxShadow: elevation.e1 }} testID="request-card">
          <AppText bold style={{ fontSize: 18 }}>{child?.school_name ?? ''}</AppText>
          {/* One arch per child, filling in as neighbours join. */}
          <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
            {Array.from({ length: LAUNCH }, (_, i) => (
              <ArchShape key={i} width={32} height={38} color={i < count ? colors.zamurrad : colors.inset}>
                {i < count ? <View style={{ position: 'absolute', left: 0, right: 0, top: 14, alignItems: 'center' }}><Icon name="picked" size={16} color={colors.onFill} /></View> : null}
              </ArchShape>
            ))}
          </View>
          <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
            <AppText bold color={count >= OPENS ? colors.zamurradOnTint : colors.ink2} style={{ fontSize: 14 }}>{count >= OPENS ? t('s2.req.opened') : t('s2.req.open')}</AppText>
            <AppText bold color={colors.ink2} style={{ fontSize: 14 }}>{t('s2.req.launch')}</AppText>
          </View>
          <AppText bold style={{ fontSize: 16 }}>{t('s2.req.progress', { n: count })}</AppText>
          {count < LAUNCH ? <AppText variant="secondary">{t('s2.req.body', { n: LAUNCH - count })}</AppText> : null}
        </Animated.View>
      ) : null}
      {id ? (
        <View style={{ gap: space.sm }}>
          <TapButton size="next" tone="picked" icon="share" label={t('s2.req.share')} onConfirm={() => Share.share({ message: t('s2.req.shareText') })} testID="request-share" />
          <TapButton tone="quiet" hold label={t('s2.req.withdraw')} disabled={busy} onConfirm={async () => { await stage2.withdrawVanRequest(id).catch(() => undefined); setId(null); setN(null); }} testID="request-withdraw" />
        </View>
      ) : !busy && !error ? (
        <TapButton size="next" tone="left" icon="plus" label={t('s2.req.start')} onConfirm={ask} testID="request-start" />
      ) : null}
    </Page>
  );
}
