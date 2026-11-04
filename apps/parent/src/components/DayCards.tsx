// v12: the small cards in the trip sheet that change with the day.
//   DayNotes    - running late (shingarf), rain (neel), a team notice (kesar), today's changed time,
//                 and "off this morning/afternoon" for a one-run chutti. One line each, newest matter first.
//   QuickSignals - four fixed messages to the driver ("2 minutes", "coming down", "sick today",
//                 "left something"): one tap each, sent once a day; never free text (no chat).
//   FoundItems  - what the driver found in the van for this child, with "collected".
import { useRain } from '@pohnch/client';
import { colors, radius, radius10, space, useLang } from '@pohnch/ui';
import { AppText, Icon, PressableScale, SectionCaption, feel, type IconName } from '@pohnch/ui/native';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useParent } from '../state/ParentStore';

const layout = LinearTransition.springify().damping(24).stiffness(200);

function Note({ tint, ink, icon, title, sub, testID }: { tint: string; ink: string; icon: IconName; title: string; sub?: string; testID: string }) {
  const { dir } = useLang();
  return (
    <Animated.View entering={FadeInDown.springify().damping(20)} exiting={FadeOut.duration(200)} layout={layout} testID={testID} accessibilityRole="alert"
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius10.row, borderCurve: 'continuous', backgroundColor: tint }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={ink} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText bold color={ink} style={{ fontSize: 16 }}>{title}</AppText>
        {sub ? <AppText variant="small" color={ink}>{sub}</AppText> : null}
      </View>
    </Animated.View>
  );
}

export function DayNotes() {
  const { t } = useLang();
  const p = useParent();
  const rain = useRain(p.membership?.status === 'approved');
  const name = p.child?.first_name ?? '';
  const changed = p.runChange[p.kind];
  return (
    <View style={{ gap: space.sm }}>
      {p.lateMin >= 5 ? <Note testID="late-banner" tint={colors.shingarfTint} ink={colors.dangerText} icon="clock" title={t('parent.late.banner', { min: p.lateMin })} sub={t('parent.late.body')} /> : null}
      {p.notices.map((n) => <Note key={n.id} testID="notice" tint={colors.kesarTint} ink={colors.onKesar} icon="bell" title={t('push.notice.title')} sub={n.body} />)}
      {rain ? <Note testID="rain-banner" tint={colors.neelTint} ink={colors.link} icon="cloud" title={t('rain.title')} sub={t('rain.parent')} /> : null}
      {changed ? <Note testID="time-change" tint={colors.neelTint} ink={colors.link} icon="clock" title={t(p.kind === 'morning' ? 'parent.change.morning' : 'parent.change.afternoon', { time: changed.replace(/^0/, '') })} sub={t('parent.change.by', { who: p.driverName ?? t('parent.chutti.theDriver') })} /> : null}
      {p.runOffToday ? <Note testID="run-off" tint={colors.kesarTint} ink={colors.onKesar} icon="calendar" title={t(p.kind === 'morning' ? 'parent.runOff.morning' : 'parent.runOff.afternoon', { name })} /> : null}
      {p.learned && typeof p.eta === 'number' ? <AppText variant="small" color={colors.ink2} testID="eta-learned">{t('eta.learned')}</AppText> : null}
    </View>
  );
}

const SIGNALS: { kind: 'two_minutes' | 'coming_down' | 'sick_today' | 'left_item'; icon: IconName; live?: boolean }[] = [
  { kind: 'two_minutes', icon: 'clock', live: true },
  { kind: 'coming_down', icon: 'home', live: true },
  { kind: 'sick_today', icon: 'calendar' },
  { kind: 'left_item', icon: 'bag' },
];

export function QuickSignals() {
  const { t, dir } = useLang();
  const p = useParent();
  if (p.membership?.status !== 'approved' || !p.child) return null;
  const live = p.phase === 'live';
  const shown = SIGNALS.filter((s) => (s.live ? live : true)).filter((s) => !(s.kind === 'sick_today' && (p.absentToday || !p.canUndoChuttiToday)));
  if (shown.length === 0) return null;
  return (
    <Animated.View layout={layout} style={{ gap: space.sm }} testID="quick-signals">
      <SectionCaption>{t('signal.title')}</SectionCaption>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
        {shown.map((s) => {
          const sent = p.signals.includes(s.kind);
          return (
            <PressableScale key={s.kind} accessibilityRole="button" accessibilityState={{ disabled: sent }} disabled={sent} testID={`signal-${s.kind}`}
              onPress={() => p.actions.signal(s.kind).then(() => feel('confirm')).catch(() => feel('error'))}
              style={{ flexBasis: '47%', flexGrow: 1 }}
              faceStyle={{ minHeight: 56, borderRadius: radius.pill, borderCurve: 'continuous', paddingHorizontal: 14, backgroundColor: sent ? colors.zamurradTint : colors.inset, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={sent ? 'check' : s.icon} size={20} color={sent ? colors.zamurradOnTint : colors.link} />
              <AppText bold color={sent ? colors.zamurradOnTint : colors.link} style={{ flex: 1, fontSize: 15 }} numberOfLines={2}>{sent ? t('signal.sent') : t(`signal.${s.kind}`)}</AppText>
            </PressableScale>
          );
        })}
      </View>
    </Animated.View>
  );
}

export function FoundItems() {
  const { t, dir } = useLang();
  const p = useParent();
  if (p.found.length === 0) return null;
  const name = p.child?.first_name ?? '';
  return (
    <Animated.View layout={layout} style={{ gap: space.sm }} testID="found-items">
      {p.found.map((f) => (
        <Animated.View key={f.id} entering={FadeInDown.springify()} exiting={FadeOut} layout={layout}
          style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius10.row, backgroundColor: colors.zamurradTint }}>
          <Icon name="bag" size={22} color={colors.zamurradOnTint} />
          <AppText bold color={colors.zamurradOnTint} style={{ flex: 1, fontSize: 16 }}>{t('found.parent', { name, what: t(`found.what.${f.what}`), who: p.driverName ?? t('parent.chutti.theDriver') })}</AppText>
          <PressableScale accessibilityRole="button" onPress={() => p.actions.collect(f.id)} scaleTo="chip" testID="found-collected"
            faceStyle={{ minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.zamurrad, alignItems: 'center', justifyContent: 'center' }}>
            <AppText bold color={colors.onFill} style={{ fontSize: 15 }}>{t('found.collected')}</AppText>
          </PressableScale>
        </Animated.View>
      ))}
    </Animated.View>
  );
}
