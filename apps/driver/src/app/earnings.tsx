// Fees, this month (v10 stage 2, canvas "Z10S-Earnings"; plain like every driver screen): the monthly
// fee and seats, what has come in against what is due, and one "Cash received" per riding family (by
// the children's first names). Nothing moves through Pohnch; this is the driver's own record that the
// parents see too.
import { stage2, type VanFee } from '@pohnch/client';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, Shimmer, TapButton, TextField, Toggle } from '@pohnch/ui/native';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

export default function Earnings() {
  const { t, dir } = useLang();
  const d = useDriver();
  const van = d.van;
  const [rows, setRows] = useState<VanFee[] | null>(null);
  const [fee, setFee] = useState('');
  const [seats, setSeats] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  const load = useCallback(() => {
    if (!van) return;
    stage2.vanFees(van.id).then((r) => { setRows(r); if (r[0] && !fee) setFee(String(r[0].amount || '')); }).catch(() => setFailed(true));
  }, [van?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  const paidSum = (rows ?? []).filter((r) => r.paid).reduce((a, r) => a + r.amount, 0);
  const total = (rows ?? []).reduce((a, r) => a + r.amount, 0);
  const save = async () => {
    if (!van) return;
    const f = Number(fee.replace(/[^0-9]/g, ''));
    const s = seats ? Number(seats.replace(/[^0-9]/g, '')) : undefined;
    try {
      await stage2.setVanFee(van.id, f, s);
      setMsg(t('s2.earn.saved'));
      load();
    } catch {
      setMsg(t('error.generic'));
    }
  };

  return (
    <Screen title={t('s2.fees.title')}>
      {failed ? (
        <AppText bold color={colors.dangerText}>{t('s2.off')}</AppText>
      ) : !rows ? (
        <Shimmer lines={[{ w: '60%', h: 40 }, { w: '100%', h: 64 }, { w: '100%', h: 64 }]} />
      ) : (
        <>
          <View style={{ flexDirection: row, alignItems: 'flex-end', gap: 8 }}>
            <AppText variant="number" style={{ fontSize: 36, lineHeight: 42 }} testID="earn-sum">{`Rs ${paidSum.toLocaleString('en-US')}`}</AppText>
            <AppText color={colors.ink2} style={{ fontSize: 15 }}>{t('s2.earn.of', { total: total.toLocaleString('en-US') })}</AppText>
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.inset, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, [dir === 'rtl' ? 'right' : 'left']: 0, width: `${total ? Math.round((paidSum / total) * 100) : 0}%`, borderRadius: 6, backgroundColor: colors.zamurrad }} />
          </View>
          {rows.length === 0 ? (
            <AppText variant="secondary">{t('s2.earn.none')}</AppText>
          ) : (
            <View style={{ backgroundColor: colors.white, borderRadius: 28, padding: 6, boxShadow: elevation.e1 }}>
              {rows.map((r) => (
                <View key={r.membership_id} style={{ flexDirection: row, alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.neelTint, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText bold color={colors.link}>{r.first_name.slice(0, 1)}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText bold style={{ fontSize: 17 }}>{r.first_name}</AppText>
                    <AppText variant="small" color={r.paid ? colors.zamurradOnTint : colors.ink2}>{r.paid ? t('s2.fees.paid') : t('s2.fees.due')}</AppText>
                  </View>
                  <Toggle value={r.paid} label={`${t('s2.earn.cash')} ${r.first_name}`} onChange={async (v) => { setRows((x) => x?.map((y) => (y.membership_id === r.membership_id ? { ...y, paid: v } : y)) ?? null); await stage2.markFeePaid(r.membership_id, v).catch(load); }} testID={`paid-${r.first_name}`} />
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: row, gap: space.sm }}>
            <View style={{ flex: 2 }}><TextField label={t('s2.earn.setFee')} value={fee} onChange={setFee} ltr maxLength={6} testID="earn-fee" /></View>
            <View style={{ flex: 1 }}><TextField label={t('s2.earn.seats')} value={seats} onChange={setSeats} ltr maxLength={2} testID="earn-seats" /></View>
          </View>
          {msg ? <AppText bold color={colors.zamurradOnTint}>{msg}</AppText> : null}
          <TapButton tone="neutral" icon="check" label={t('s2.earn.save')} onConfirm={save} testID="earn-save" />
        </>
      )}
    </Screen>
  );
}
