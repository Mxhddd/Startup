// Fees (v10 stage 2, canvas "Z10S-Fees"): this month's fee for the child and the two months before,
// paid or due, as the driver marked them. No money moves through Pohnch yet; parents pay the driver in
// cash or by transfer. Also here: rate the van (stars and a few words), shown only as an average from 5.
import { stage2, type FeeMonth } from '@pohnch/client';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, ChoiceChip, EditSheet, Group, GroupRow, RowIcon, SectionCaption, Shimmer, StarPattern, TapButton } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

const TAGS = ['on_time', 'safe_driving', 'clean_van', 'kind', 'careful'] as const;
const MONTHS = ['month.1', 'month.2', 'month.3', 'month.4', 'month.5', 'month.6', 'month.7', 'month.8', 'month.9', 'month.10', 'month.11', 'month.12'] as const;

export default function Fees() {
  const { t, dir } = useLang();
  const p = useParent();
  const child = p.child;
  const [months, setMonths] = useState<FeeMonth[] | null>(null);
  const [error, setError] = useState(false);
  const [rating, setRating] = useState(false);
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [rated, setRated] = useState(false);
  const [rateError, setRateError] = useState(false);

  useEffect(() => {
    if (!child) return;
    stage2.childFees(child.id).then(setMonths).catch(() => setError(true));
  }, [child?.id]);

  const now = months?.[0];
  const name = (m: string) => t(MONTHS[Number(m.slice(5, 7)) - 1] as (typeof MONTHS)[number]);
  return (
    <Page title={t('s2.fees.title')} sub={child ? `${child.first_name}${now ? ` · ${now.van_name}` : ''}` : null}>
      {error ? (
        <AppText bold color={colors.dangerText}>{t('s2.off')}</AppText>
      ) : !months ? (
        <Shimmer lines={[{ w: '100%', h: 120 }, { w: '100%', h: 64 }]} />
      ) : (
        <>
          {now ? (
            <View style={{ borderRadius: 28, overflow: 'hidden', padding: 18, backgroundColor: colors.neel, experimental_backgroundImage: `linear-gradient(160deg, ${colors.headerTop}, ${colors.neel})` }} testID="fee-now">
              <StarPattern opacity={0.07} tile={36} />
              <AppText color={colors.mutedOnDark} style={{ fontSize: 15 }}>{t('s2.fees.next')}</AppText>
              <AppText variant="number" color={colors.onBrand} style={{ fontSize: 40, lineHeight: 48 }}>{now.amount ? `Rs ${now.amount.toLocaleString('en-US')}` : '—'}</AppText>
              <AppText bold color={now.paid ? colors.onBrand : colors.kesar}>{now.amount ? (now.paid ? t('s2.fees.paid') : t('s2.fees.due')) : t('s2.fees.none')}</AppText>
            </View>
          ) : null}
          <SectionCaption>{t('s2.fees.title')}</SectionCaption>
          <Group>
            {months.map((m) => (
              <GroupRow key={m.month} title={name(m.month)} sub={m.paid ? t('s2.fees.paid') : t('s2.fees.due')}
                lead={<RowIcon name={m.paid ? 'check' : 'calendar'} tint={m.paid ? colors.zamurradTint : colors.kesarTint} ink={m.paid ? colors.zamurradOnTint : colors.onKesar} />}
                trail={<AppText variant="number" style={{ fontSize: 16, lineHeight: 22 }}>{m.amount ? `Rs ${m.amount.toLocaleString('en-US')}` : '—'}</AppText>} />
            ))}
          </Group>
          <AppText variant="small" color={colors.ink2}>{t('s2.fees.cash')}</AppText>
          {p.van ? <TapButton tone="neutral" icon="star" label={t('s2.rate.title')} onConfirm={() => { setRated(false); setRating(true); }} testID="rate-open" /> : null}
        </>
      )}
      <EditSheet visible={rating} title={t('s2.rate.title')} onClose={() => setRating(false)} testID="rate-sheet">
        {rated ? (
          <AppText bold color={colors.zamurradOnTint}>{t('s2.rate.done')}</AppText>
        ) : (
          <>
            <AppText variant="secondary">{t('s2.rate.body')}</AppText>
            <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 8, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <ChoiceChip key={n} label={'★'.repeat(1) + ` ${n}`} on={n === stars} onPress={() => setStars(n)} testID={`rate-${n}`} />
              ))}
            </View>
            <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
              {TAGS.map((tag) => (
                <ChoiceChip key={tag} label={t(`s2.tag.${tag}`)} on={tags.includes(tag)} onPress={() => setTags((x) => (x.includes(tag) ? x.filter((y) => y !== tag) : [...x, tag]))} />
              ))}
            </View>
            <TapButton size="next" tone="left" icon="check" label={t('s2.rate.save')} onConfirm={async () => { if (p.van) { try { await stage2.rateVan(p.van.id, stars, tags); setRated(true); setRateError(false); } catch { setRateError(true); } } }} testID="rate-save" />
            {rateError ? <AppText bold color={colors.dangerText}>{t('error.offline')}</AppText> : null}
          </>
        )}
      </EditSheet>
      <View style={{ height: space.lg }} />
    </Page>
  );
}
