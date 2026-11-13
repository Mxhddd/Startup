// The week's story (v10, canvas "Z10P-Story"): a picture of the child's school week to send to family
// on WhatsApp. A neel jharoka arch with our star pattern, the child's first name, how many days they
// rode and the average ride, and a bar per school day. The picture carries the first name only: no map,
// no place, no times of day (weekStory in @pohnch/core returns numbers only).
// How it is shared: the card is drawn as ordinary views, Skia takes a picture of them
// (makeImageFromView), the picture is saved to the phone's cache and handed to the share sheet.
import { parent } from '@pohnch/client';
import { addDays, onTimeStreak, storyOf, timelineFor, weekStory, type StoryDay } from '@pohnch/core';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, ArchShape, Icon, Shimmer, StarIcon, TapButton, TiltLayer, useTilt, StarBurst } from '@pohnch/ui/native';
import { makeImageFromView } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Platform, Share, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

const CARD_W = 300;
const CARD_H = 440;

export default function Story() {
  const { t, dir } = useLang();
  const p = useParent();
  const [days, setDays] = useState<(StoryDay & { label: string })[] | null>(null);
  // Audit: this week's chutti days (the store only holds today and later), so they don't break the streak.
  const [pastOff, setPastOff] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const tilt = useTilt();
  const card = useRef<ComponentRef<typeof View>>(null);
  const van = p.van;
  const child = p.child;
  const name = child?.first_name ?? '';

  // The last 7 days' morning runs: did the child ride, and how long was it.
  useEffect(() => {
    if (!van || !child) return;
    let live = true;
    (async () => {
      const dates = Array.from({ length: 7 }, (_, i) => addDays(p.today, -i));
      const out: (StoryDay & { label: string })[] = [];
      for (const date of dates) {
        const trips = (await parent.tripsOn(van.id, date)).filter((tr) => tr.kind === 'morning');
        const tr = trips[0];
        if (!tr) continue;
        const events = await parent.eventsOf(tr.id, { id: van.driver_id, name: p.driverName });
        const tl = timelineFor('morning', child.id, events);
        const rode = tl.items.some((i) => i.step === 'picked' && i.at);
        const story = storyOf('morning', tl.items);
        const wd = new Date(`${date}T12:00:00+05:00`).getUTCDay();
        out.push({ date, rode, minutes: story?.minutes ?? null, label: t(`dayShort.${wd}` as 'dayShort.0') });
      }
      const off = await parent.absenceDates(child.id, addDays(p.today, -7)).catch(() => [] as string[]);
      if (live) {
        setPastOff(off);
        setDays(out);
      }
    })().catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [van?.id, child?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = days ? weekStory(days) : null;
  const labels = new Map((days ?? []).map((d) => [d.date, d.label]));
  // v12: school days in a row the child rode (newest first; chutti days don't break it).
  const streak = days ? onTimeStreak(days.map((d) => ({ rode: d.rode, off: pastOff.includes(d.date) }))) : 0;

  const share = async () => {
    const line = s ? `${t('story.title', { name })} · ${t('story.line', { n: s.rode, of: s.schoolDays })}` : t('story.title', { name });
    try {
      if (Platform.OS === 'web') throw new Error('web');
      // Skia's type wants a class ref; a View ref works the same at run time.
      const image = await makeImageFromView(card as unknown as RefObject<number | null>);
      if (!image) throw new Error('no picture');
      const file = new File(Paths.cache, 'pohnch-week.png');
      file.write(image.encodeToBase64(), { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: line, UTI: 'public.png' });
    } catch {
      // No picture (the website preview, or sharing not available): send the words instead.
      await Share.share({ message: line }).catch(() => undefined);
    }
  };

  return (
    <Page title={t('story.page')} sub={t('story.sub')}>
      {!van || !child ? (
        <AppText variant="secondary">{t('history.none')}</AppText>
      ) : failed ? (
        <AppText bold color={colors.dangerText}>{t('error.offline')}</AppText>
      ) : !s ? (
        <View style={{ alignItems: 'center' }}><Shimmer arches={{ count: 1, w: 260, h: 300 }} /></View>
      ) : (
        <Animated.View entering={FadeInDown.springify().damping(20).stiffness(300)} style={{ gap: space.lg, alignItems: 'center' }}>
          {/* The card that becomes the picture. collapsable={false} so Android keeps it as one view. */}
          <TiltLayer tilt={tilt} depth={10}>
          <View ref={card} collapsable={false} style={{ width: CARD_W, height: CARD_H + 30, backgroundColor: colors.ghee, alignItems: 'center' }} testID="story-card">
            <ArchShape width={CARD_W} height={CARD_H} rise={170} color={colors.neel} gradient={[colors.headerTop, colors.neel]} pattern>
              <View style={{ position: 'absolute', left: 20, right: 20, top: 64, alignItems: 'center', gap: 2 }}>
                <StarIcon size={28} color={colors.kesar} />
                <AppText variant="display" color={colors.onBrand} align="center" style={{ fontSize: 34 }}>{t('story.title', { name })}</AppText>
                <AppText bold color={colors.mutedOnDark} align="center" style={{ fontSize: 15 }}>
                  {s.schoolDays ? t('story.line', { n: s.rode, of: s.schoolDays }) : t('story.empty')}
                </AppText>
                {s.avgMinutes ? <AppText bold color={colors.mutedOnDark} align="center" style={{ fontSize: 15 }}>{t('story.avg', { m: s.avgMinutes })}</AppText> : null}
              </View>
              {s.bars.length ? <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, padding: 14, paddingBottom: 8, borderRadius: 24, backgroundColor: colors.ghee }}>
                <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, height: 104 }}>
                  {s.bars.map((b) => (
                    <View key={b.date} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <View style={{ width: '100%', height: Math.round(b.height * 72), borderRadius: 8, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: b.rode ? colors.zamurrad : colors.kesar }} />
                      <AppText bold color={colors.ink2} style={{ fontSize: 14 }} numberOfLines={1}>{labels.get(b.date) ?? ''}</AppText>
                    </View>
                  ))}
                </View>
              </View> : null}
            </ArchShape>
            <AppText variant="number" color={colors.ink2} style={{ fontSize: 14, lineHeight: 26 }}>pohnch.pk</AppText>
          </View>
          </TiltLayer>
          {/* v12: on Friday, the week ends with a small burst of stars over the card. */}
          <StarBurst play={new Date(Date.now() + 5 * 3600_000).getUTCDay() === 5} />
          {streak >= 2 ? (
            <Animated.View entering={FadeInDown.delay(300).springify().damping(20).stiffness(300)} testID="streak-card"
              style={{ alignSelf: 'stretch', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: 24, backgroundColor: colors.zamurradTint }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.zamurrad, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="number" color={colors.onFill} style={{ fontSize: 24, lineHeight: 30 }}>{String(streak)}</AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText bold color={colors.zamurradOnTint} style={{ fontSize: 17 }}>{t('streak.title', { n: streak })}</AppText>
                <AppText color={colors.zamurradOnTint} style={{ fontSize: 15 }}>{t('streak.body', { name })}</AppText>
              </View>
            </Animated.View>
          ) : null}
          <View style={{ alignSelf: 'stretch', gap: space.sm }}>
            <TapButton size="next" tone="picked" icon="share" label={t('story.share')} onConfirm={share} testID="story-share" />
            <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 6, borderRadius: 16, backgroundColor: colors.white, boxShadow: elevation.e1 }}>
              <Icon name="shield" size={16} color={colors.zamurrad} />
              <AppText variant="small" color={colors.ink2}>{t('story.privacy')}</AppText>
            </View>
          </View>
        </Animated.View>
      )}
    </Page>
  );
}
