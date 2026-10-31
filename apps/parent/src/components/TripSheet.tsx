// What the bottom sheet shows, depending on where the family is: no child yet, not on a van,
// waiting for approval, no trip right now, or the van live on the map.
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AbsentChip, AppText, EtaPill, OfflineBanner, TapButton, TimelineEvent } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { Pressable, Share, View } from 'react-native';
import { parent as data } from '@pohnch/client';
import { useParent } from '../state/ParentStore';

const STEP_KEY = { left: 'left', picked: 'picked', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped' } as const;

function clock(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(/\s?[AP]M$/, '');
}

export function TripSheet() {
  const { t, dir } = useLang();
  const p = useParent();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const name = p.child?.first_name ?? '';

  const inviteDriver = async () => {
    if (!p.child) return;
    const { url } = await data.parentApi.inviteDriver(p.child.id);
    await Share.share({ message: `${t('parent.inviteDriver.message')}\n${url}` });
  };

  if (p.phase === 'notConfigured' || p.phase === 'error') {
    return (
      <View testID="trip-sheet" style={{ gap: space.sm }}>
        <AppText variant="title">{t('parent.sheet.title')}</AppText>
        <AppText variant="secondary">{p.phase === 'error' ? t('error.offline') : t('parent.sheet.empty')}</AppText>
        {p.phase === 'error' ? <TapButton label={t('common.retry')} onConfirm={p.actions.refresh} /> : null}
      </View>
    );
  }
  if (p.phase === 'loading') return <AppText variant="secondary">{t('common.loading')}</AppText>;

  if (p.phase === 'noChild') {
    return (
      <View testID="trip-sheet" style={{ gap: space.md }}>
        <AppText variant="title">{t('parent.noChild.title')}</AppText>
        <AppText variant="secondary">{t('parent.noChild.body')}</AppText>
        <TapButton size="next" tone="left" label={t('parent.addChild')} onConfirm={() => router.push('/child')} testID="add-child" />
      </View>
    );
  }

  if (p.phase === 'notOnVan') {
    return (
      <View testID="trip-sheet" style={{ gap: space.md }}>
        <AppText variant="title">{t('parent.notOnVan.title', { name })}</AppText>
        <AppText variant="secondary">{t('parent.notOnVan.body')}</AppText>
        <TapButton tone="left" label={t('parent.join')} onConfirm={() => router.push('/join')} testID="open-join" />
        <TapButton label={t('parent.inviteDriver')} onConfirm={inviteDriver} testID="invite-driver" />
      </View>
    );
  }

  if (p.phase === 'waiting') {
    return (
      <View testID="trip-sheet" style={{ gap: space.sm }}>
        <AppText variant="title">{t('parent.waiting.title')}</AppText>
        <AppText variant="secondary">{t('parent.waiting.body', { van: p.van?.name ?? '' })}</AppText>
      </View>
    );
  }

  // idle or live
  const items = p.timeline.items;
  const offline = p.error !== null;
  const stale = p.signal?.stale ?? false;
  const nextTime = p.kind === 'morning' ? p.stop?.morning_time : p.stop?.afternoon_time;

  return (
    <View testID="trip-sheet" style={{ gap: space.md }}>
      {p.children.length > 1 ? (
        <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap' }}>
          {p.children.map((c) => (
            <Pressable key={c.id} accessibilityRole="tab" accessibilityState={{ selected: c.id === p.child?.id }} onPress={() => p.actions.selectChild(c.id)}
              style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: c.id === p.child?.id ? colors.neel : colors.white, borderWidth: 1, borderColor: colors.line }}>
              <AppText bold color={c.id === p.child?.id ? colors.ghee : colors.siyahi}>{c.first_name}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {offline ? (
        <View accessibilityRole="alert" style={{ backgroundColor: colors.siyahi, borderRadius: radius.card, padding: space.md }}>
          <AppText color={colors.ghee}>{t('parent.offline')}</AppText>
        </View>
      ) : null}
      {p.phase === 'live' && p.eta !== null ? <EtaPill minutes={p.eta} to="home" stale={stale} /> : null}
      {p.phase === 'live' && stale && p.signal ? (
        <OfflineBanner side="parent" secondsAgo={p.signal.secondsAgo} />
      ) : null}
      {p.timeline.late ? (
        <View style={{ backgroundColor: colors.dangerBg, borderRadius: radius.card, padding: space.md }}>
          <AppText bold color={colors.dangerText}>{t('parent.late', { reason: t(`help.reason.${p.timeline.late as 'traffic'}`) })}</AppText>
        </View>
      ) : null}

      {p.phase === 'idle' ? (
        <View style={{ gap: 2 }}>
          <AppText variant="title">{t('parent.idle.title')}</AppText>
          {nextTime ? <AppText variant="secondary">{t(p.kind === 'morning' ? 'parent.idle.morning' : 'parent.idle.afternoon', { time: nextTime.slice(0, 5) })}</AppText> : null}
        </View>
      ) : null}

      {p.absentToday ? (
        <View style={{ gap: space.sm }}>
          <AppText bold>{t('parent.chutti.on', { name })}</AppText>
          {p.canUndoChuttiToday ? <AbsentChip onUndo={() => p.actions.toggleChutti(p.today)} /> : <AppText variant="small" color={colors.ink2}>{t('parent.chutti.locked')}</AppText>}
        </View>
      ) : (
        <View>
          {items.map((i, n) => (
            <TimelineEvent key={i.step} step={STEP_KEY[i.step]} time={clock(i.at)} by={i.by ?? undefined} pending={!i.at} last={n === items.length - 1} />
          ))}
        </View>
      )}

      {!p.absentToday && p.kind === 'morning' && !items.some((i) => i.step === 'picked' && i.at) ? (
        <TapButton label={t('parent.chutti.set')} onConfirm={() => p.actions.toggleChutti(p.today)} testID="chutti" />
      ) : null}
      <AppText variant="small" color={colors.ink2}>{[p.van?.name, p.driverName].filter(Boolean).join(' · ')}</AppText>
    </View>
  );
}
