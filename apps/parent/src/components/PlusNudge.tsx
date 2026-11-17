// Pricing v2: when the Pohnch team has switched billing on for the van and this child has no paid
// plan, the server sends no alerts and shows no van (nothing is free). This card says so, kindly, and
// opens Pohnch Plus. It never shows while billing is off, so the pilot looks as before.
import { plans, type ChildPlan } from '@pohnch/client';
import { PRICES } from '@pohnch/core';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, Glass, Icon, PressableScale } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export function PlusNudge({ childId, top }: { childId: string | null; top: number }) {
  const { t, dir } = useLang();
  const [rows, setRows] = useState<ChildPlan[] | null>(null);
  useEffect(() => {
    plans.myPlans().then(setRows).catch(() => setRows(null));
  }, [childId]);
  const c = rows?.find((r) => r.childId === childId);
  if (!c || !c.billing || !c.vanId || c.state === 'active' || c.state === 'grace') return null;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <View style={{ position: 'absolute', top, left: space.gutter, right: space.gutter }}>
      <PressableScale accessibilityRole="button" accessibilityLabel={t('plus.see')} onPress={() => router.push('/plans')} scaleTo="big" testID="plus-nudge">
        <Glass style={{ flexDirection: row, alignItems: 'center', gap: 12, padding: 14 }}>
          <Icon name="star" size={22} color={colors.kesarText} strokeWidth={2.4} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText bold style={{ fontSize: 16 }}>{t('plus.locked')}</AppText>
            <AppText color={colors.link} style={{ fontSize: 15 }}>{`${t('plus.see')} · ${t('plus.menuLine', { price: PRICES.intro })}`}</AppText>
          </View>
        </Glass>
      </PressableScale>
    </View>
  );
}
