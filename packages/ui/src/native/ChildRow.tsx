// One stop on the driver's list: the first names at that stop (siblings tap together), and its state.
// The next stop holds the big TapButton; other stops are 64 px rows.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, stepColors, tap, type Step } from '../theme';
import { AbsentChip } from './AbsentChip';
import { AppText } from './AppText';
import { Icon } from './icons';
import { TapButton } from './TapButton';

export type ChildRowState = 'waiting' | 'done' | 'absent';

export function ChildRow({
  names,
  stop,
  step,
  state,
  isNext = false,
  onTap,
  testID,
}: {
  names: string[];
  stop: string;
  /** The step this tap records at this stop: picked in the morning, dropped in the afternoon. */
  step: Extract<Step, 'picked' | 'dropped'>;
  state: ChildRowState;
  isNext?: boolean;
  onTap: () => void;
  testID?: string;
}) {
  const { t, dir, lang } = useLang();
  const joined = names.join(lang === 'ur' ? '، ' : ', ');
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  if (isNext && state === 'waiting') {
    return (
      <View testID={testID} style={{ gap: 8 }}>
        <AppText variant="small" bold color={colors.ink2}>
          {`${t('tap.next')} · ${stop}`}
        </AppText>
        <TapButton size="next" tone={step} icon={step} label={joined} sublabel={t(`step.${step}`)} onConfirm={onTap} testID={testID ? `${testID}-tap` : undefined} />
      </View>
    );
  }

  const done = state === 'done';
  return (
    <View
      testID={testID}
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 12,
        minHeight: tap.min,
        paddingHorizontal: 16,
        borderRadius: radius.card,
        backgroundColor: done ? colors.zamurradTint : colors.white,
        borderWidth: 1,
        borderColor: done ? colors.zamurradTint : colors.line,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? stepColors[step].fill : colors.absentBg }}>
        {done ? <Icon name="check" size={20} color={colors.white} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText bold color={state === 'absent' ? colors.absentText : done ? colors.zamurradOnTint : colors.siyahi}>
          {joined}
        </AppText>
        <AppText variant="small" color={colors.ink2}>
          {done ? t(`step.${step}`) : stop}
        </AppText>
      </View>
      {state === 'absent' ? <AbsentChip /> : null}
      {state === 'waiting' ? (
        <View style={{ width: 128 }}>
          <TapButton size="later" tone={step} label={t(`tap.${step}.short`)} onConfirm={onTap} />
        </View>
      ) : null}
    </View>
  );
}
