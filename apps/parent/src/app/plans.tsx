// Pohnch Plus (pricing v2): one plan, no free tier, no free month. The card lists what Plus does and
// its prices (the van's own monthly price, the Rs 99 first month while it is still allowed, siblings,
// term and year); under it, each child and where their plan stands. Payment in the app (Play Billing)
// comes later; in the pilot the Pohnch team takes the payment and switches Plus on, so this screen
// only reads (plans.myPlans). While billing is off for the van, it says there is nothing to pay.
import { PRICES } from '@pohnch/core';
import { plans, type ChildPlan } from '@pohnch/client';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, Icon, Shimmer, StarPattern } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';

function PlusCard({ monthly, introAllowed, founding }: { monthly: number; introAllowed: boolean; founding: boolean }) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const feats = [t('plus.f1'), t('plus.f2'), t('plus.f3'), t('plus.f4')];
  const prices = [
    introAllowed && !founding ? t('plus.intro', { price: PRICES.intro }) : null,
    t('plus.sibling', { price: PRICES.sibling }),
    founding ? null : t('plus.term', { price: PRICES.term }),
    founding ? null : t('plus.year', { price: PRICES.year }),
  ].filter((x): x is string => !!x);
  return (
    <View testID="plus-card" style={{ borderRadius: 28, borderCurve: 'continuous', overflow: 'hidden', padding: 18, gap: 10, backgroundColor: colors.neel, experimental_backgroundImage: `linear-gradient(160deg, ${colors.headerTop}, ${colors.neel})`, boxShadow: elevation.e2 }}>
      <StarPattern opacity={0.07} tile={36} />
      <AppText bold color={colors.onBrand} style={{ fontSize: 20 }}>{t('plus.title')}</AppText>
      <View style={{ flexDirection: row, alignItems: 'flex-end', gap: 6 }}>
        <AppText variant="number" color={colors.onBrand} style={{ fontSize: 34, lineHeight: 40 }}>{`Rs ${monthly}`}</AppText>
        <AppText color={colors.mutedOnDark} style={{ fontSize: 15 }}>{t('plus.per')}</AppText>
      </View>
      {founding ? <AppText bold color={colors.kesar} style={{ fontSize: 15 }}>{t('plus.founding')}</AppText> : null}
      {feats.map((f) => (
        <View key={f} style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={18} color={colors.kesar} strokeWidth={2.8} />
          <AppText color={colors.onBrand} style={{ fontSize: 15, flex: 1 }}>{f}</AppText>
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: colors.glassEdge, marginVertical: 4 }} />
      {prices.map((p) => <AppText key={p} color={colors.onBrand} style={{ fontSize: 15 }}>{p}</AppText>)}
    </View>
  );
}

function ChildLine({ c }: { c: ChildPlan }) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const on = c.state === 'active' || c.state === 'grace';
  const graceEnd = c.paidUntil ? addDays(c.paidUntil, 3) : '';
  const text =
    c.state === 'active' ? t('plus.child.active', { name: c.firstName, date: c.paidUntil ?? '' })
    : c.state === 'grace' ? t('plus.child.grace', { name: c.firstName, date: graceEnd })
    : c.state === 'ended' ? t('plus.child.ended', { name: c.firstName })
    : t('plus.child.none', { name: c.firstName });
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: colors.white, boxShadow: elevation.e1 }} testID={`plan-${c.state}`}>
      <Icon name={on ? 'check' : 'bell'} size={20} color={on ? colors.zamurrad : colors.ink2} strokeWidth={2.6} />
      <AppText bold={on} color={c.state === 'grace' ? colors.dangerText : colors.siyahi} style={{ fontSize: 16, flex: 1 }}>{text}</AppText>
    </View>
  );
}

/** YYYY-MM-DD plus n days (dates are Karachi calendar days, kept as plain strings). */
function addDays(d: string, n: number): string {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

export default function Plans() {
  const { t } = useLang();
  const [kids, setKids] = useState<ChildPlan[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    plans.myPlans().then(setKids).catch(() => setError(true));
  }, []);
  const onVan = (kids ?? []).filter((k) => k.vanId);
  const first = onVan[0];
  const billing = onVan.some((k) => k.billing);
  return (
    <Page title={t('plus.title')} sub={t('plus.sub')}>
      <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} style={{ gap: space.md }}>
        {kids === null && !error ? <Shimmer lines={[{ w: '100%', h: 260 }]} /> : null}
        {error ? <AppText bold color={colors.dangerText} testID="plans-error">{t('error.generic')}</AppText> : null}
        {kids && onVan.length === 0 ? <AppText color={colors.ink2} testID="plans-nokids">{t('plus.noKids')}</AppText> : null}
        {first ? <PlusCard monthly={first.monthly} introAllowed={first.introAllowed} founding={first.founding} /> : null}
        {onVan.map((c) => <ChildLine key={c.childId} c={c} />)}
        {first ? (
          <AppText variant="small" color={colors.ink2} align="center" testID={billing ? 'plans-howtopay' : 'plans-billing-off'}>
            {billing ? t('plus.howToPay') : t('plus.billingOff')}
          </AppText>
        ) : null}
      </Animated.View>
    </Page>
  );
}
