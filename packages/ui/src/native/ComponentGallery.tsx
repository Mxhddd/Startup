// The hidden gallery: every component in every state, in Urdu and English (switch at the top).
// Open it in either app by long-pressing the screen title, or with the link pohnch://gallery.
// Section labels are the component names from the code, so they stay in English.
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../lang';
import { colors, fonts, mapColors, radius, space } from '../theme';
import { AbsentChip } from './AbsentChip';
import { AppText } from './AppText';
import { ApprovalCard } from './ApprovalCard';
import { ChildRow } from './ChildRow';
import { EtaPill } from './EtaPill';
import { HelpSheet } from './HelpSheet';
import { InviteCard } from './InviteCard';
import { LangSwitch } from './LangSwitch';
import { MapSheet } from './MapSheet';
import { OfflineBanner } from './OfflineBanner';
import { RouteDots } from './RouteDots';
import { StopPin } from './StopPin';
import { TapButton } from './TapButton';
import { TimelineEvent } from './TimelineEvent';
import { TripHeader } from './TripHeader';
import { UndoBar } from './UndoBar';
import { VanBadge } from './VanBadge';
import { VanMarker } from './VanMarker';

// Sample data only: first names, no real families.
const sample = {
  ur: { a: 'علی', b: 'سارہ', c: 'حمزہ', d: 'عائشہ', stop1: 'بلاک 13', stop2: 'گلی 4', who: 'رفیق بھائی' },
  en: { a: 'Ali', b: 'Sara', c: 'Hamza', d: 'Ayesha', stop1: 'Block 13', stop2: 'Street 4', who: 'Rafiq bhai' },
};

function Section({ name, children, dark = false }: { name: string; children: ReactNode; dark?: boolean }) {
  return (
    <View style={{ gap: space.md }}>
      <Text style={{ fontFamily: fonts.latin.bold, fontSize: 14, color: colors.ink2, letterSpacing: 1 }}>{name}</Text>
      <View style={{ gap: space.md, padding: dark ? space.lg : 0, backgroundColor: dark ? colors.siyahi : 'transparent', borderRadius: radius.card }}>{children}</View>
    </View>
  );
}

export function ComponentGallery() {
  const { t, lang, dir } = useLang();
  const s = sample[lang];
  const insets = useSafeAreaInsets();
  const [log, setLog] = useState('—');
  const [undoAt, setUndoAt] = useState(() => Date.now());
  const [help, setHelp] = useState(false);
  const [heading, setHeading] = useState(30);

  // Turn the demo van every 2 s so the marker's smooth turn can be seen.
  useEffect(() => {
    const id = setInterval(() => setHeading((h) => (h + 70) % 360), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <ScrollView testID="gallery" style={{ flex: 1, backgroundColor: colors.ghee }} contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + 120, gap: space.xxl }}>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="display">{t('gallery.title')}</AppText>
        <LangSwitch />
      </View>
      <Text testID="gallery-log" style={{ fontFamily: fonts.latin.regular, fontSize: 14, color: colors.ink2 }}>{`last action: ${log}`}</Text>

      <Section name="TapButton">
        <TapButton size="next" tone="picked" icon="picked" label={[s.a, s.b].join(lang === 'ur' ? '، ' : ', ')} sublabel={t('step.picked')} onConfirm={() => setLog('picked')} />
        <TapButton size="next" tone="left" icon="left" hold label={t('trip.start')} onConfirm={() => setLog('trip started (hold)')} testID="hold-demo" />
        <TapButton tone="reachedSchool" icon="reachedSchool" hold label={t('step.reachedSchool')} onConfirm={() => setLog('reached school (hold)')} />
        <TapButton label={t('approval.decline')} onConfirm={() => setLog('neutral')} />
        <TapButton tone="dropped" label={t('step.dropped')} disabled onConfirm={() => undefined} />
      </Section>

      <Section name="UndoBar">
        <UndoBar key={undoAt} text={t('undo.marked', { name: s.a, step: t('step.picked') })} tappedAt={undoAt} onUndo={() => setLog('undo')} />
        <TapButton label="↺ UndoBar" onConfirm={() => setUndoAt(Date.now())} testID="undo-restart" />
      </Section>

      <Section name="ChildRow">
        <ChildRow names={[s.a, s.b]} stop={s.stop1} step="picked" state="waiting" isNext onTap={() => setLog('row next')} />
        <ChildRow names={[s.c]} stop={s.stop2} step="picked" state="waiting" onTap={() => setLog('row later')} />
        <ChildRow names={[s.d]} stop={s.stop2} step="picked" state="done" onTap={() => undefined} />
        <ChildRow names={[s.c]} stop={s.stop1} step="dropped" state="absent" onTap={() => undefined} />
      </Section>

      <Section name="AbsentChip">
        <AbsentChip />
        <AbsentChip onUndo={() => setLog('chutti undone')} />
      </Section>

      <Section name="OfflineBanner">
        <OfflineBanner side="driver" queued={3} />
        <OfflineBanner side="parent" secondsAgo={40} />
      </Section>

      <Section name="TripHeader + HelpSheet">
        <TripHeader kind="morning" done={4} total={12} onHelp={() => setHelp(true)} />
        <TripHeader kind="afternoon" done={0} total={12} practice onHelp={() => setHelp(true)} />
        <HelpSheet visible={help} onClose={() => setHelp(false)} onReason={(r) => { setLog(`late: ${r}`); setHelp(false); }} />
      </Section>

      <Section name="EtaPill">
        <EtaPill minutes={6} />
        <EtaPill minutes={24} to="school" />
        <EtaPill minutes="door" />
        <EtaPill minutes={6} stale />
      </Section>

      <Section name="VanMarker · StopPin">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl, backgroundColor: mapColors.land, borderRadius: radius.card, padding: space.lg, flexWrap: 'wrap' }}>
          <VanMarker heading={heading} />
          <VanMarker heading={heading} stale />
          <StopPin kind="stop" />
          <StopPin kind="home" />
          <StopPin kind="school" />
        </View>
      </Section>

      <Section name="RouteDots">
        <RouteDots total={9} done={4} />
        <RouteDots total={9} done={0} />
      </Section>
      <Section name="RouteDots (dark)" dark>
        <RouteDots total={9} done={6} tone="dark" />
      </Section>

      <Section name="TimelineEvent">
        <View>
          <TimelineEvent step="left" time="7:05" by={s.who} />
          <TimelineEvent step="picked" time="7:12" by={s.who} />
          <TimelineEvent step="reachedSchool" pending />
          <TimelineEvent step="dropped" pending last />
        </View>
      </Section>

      <Section name="VanBadge">
        <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <VanBadge status="verified" />
          <VanBadge status="waiting" />
          <VanBadge status="off" />
        </View>
      </Section>

      <Section name="ApprovalCard">
        <ApprovalCard child={s.a} stop={s.stop1} onApprove={() => setLog('approved')} onDecline={() => setLog('declined')} />
      </Section>

      <Section name="InviteCard">
        <InviteCard onShare={() => setLog('share')} />
      </Section>

      <Section name="MapSheet">
        <View style={{ height: 460, borderRadius: radius.card, overflow: 'hidden', backgroundColor: mapColors.land }}>
          <View style={{ position: 'absolute', top: 60, left: 40 }}>
            <VanMarker heading={heading} />
          </View>
          <MapSheet peek={180} open={400}>
            <EtaPill minutes={6} />
            <RouteDots total={9} done={4} />
            <TimelineEvent step="picked" time="7:12" by={s.who} last />
          </MapSheet>
        </View>
      </Section>
    </ScrollView>
  );
}
