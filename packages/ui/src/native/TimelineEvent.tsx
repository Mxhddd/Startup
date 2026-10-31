// One step in the parent's timeline: the step's colour and icon, what happened, who marked it, and when.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, stepColors, type Step } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';

export function TimelineEvent({
  step,
  time,
  by,
  last = false,
  pending = false,
}: {
  step: Step;
  time?: string;
  /** Who marked it ("Rafiq bhai"), or undefined when the map marked it ("arriving"). */
  by?: string;
  last?: boolean;
  pending?: boolean;
}) {
  const { t, dir } = useLang();
  const c = stepColors[step];
  const meta = [by ? t('timeline.by', { who: by }) : t('timeline.auto'), time].filter(Boolean).join(' · ');
  return (
    <View testID={`timeline-${step}`} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 14, minHeight: 64 }}>
      <View style={{ alignItems: 'center', width: 36 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pending ? colors.white : c.fill, borderWidth: pending ? 2 : 0, borderColor: colors.line }}>
          <Icon name={step} size={20} color={pending ? colors.ink2 : c.text} />
        </View>
        {!last ? <View style={{ flex: 1, width: 2, backgroundColor: pending ? colors.line : c.fill, marginVertical: 4 }} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: 14 }}>
        <AppText bold color={pending ? colors.ink2 : colors.siyahi}>
          {t(`step.${step}`)}
        </AppText>
        {!pending ? <AppText variant="small" color={colors.ink2}>{meta}</AppText> : null}
      </View>
    </View>
  );
}
