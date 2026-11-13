// v12 family view: every child at once, for families with more than one. Each child's line says
// where they are today (on the way, in the van, at school, home, off today), from their own van's
// trip. Tap a child to follow them on the map. Data: the same reads as the home screen, per child
// (row-level security shows only this family's children and their vans).
import { parent, type Child } from '@pohnch/client';
import { childPlace, defaultRunKind, karachiDate, timelineFor } from '@pohnch/core';
import { childColors, colors, radius10, space, useLang } from '@pohnch/ui';
import { AppText, Niche, PressableScale, Shimmer } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

type Line = { key: 'off' | 'none' | 'waiting' | 'coming' | 'inVan' | 'atSchool' | 'home' | 'idle' | 'over' | 'vanOff'; live: boolean };

async function lineFor(c: Child): Promise<Line> {
  const today = karachiDate(new Date());
  const [m, off] = await Promise.all([parent.membershipOf(c.id), parent.absenceDates(c.id)]);
  if (off.includes(today)) return { key: 'off', live: false };
  if (!m) return { key: 'none', live: false };
  if (m.status !== 'approved') return { key: 'waiting', live: false };
  const van = await parent.van(m.van_id);
  if (!van) return { key: 'none', live: false };
  const [trips, daysOff, runOff] = await Promise.all([
    parent.tripsToday(van.id),
    parent.vanDaysOff(van.id, today).catch(() => [] as string[]),
    parent.runAbsences(c.id, today).catch(() => [] as { date: string; kind: 'morning' | 'afternoon' }[]),
  ]);
  if (daysOff.includes(today)) return { key: 'vanOff', live: false };
  const running = trips.find((x) => x.status === 'running');
  const shown = running ?? trips[trips.length - 1];
  if (!shown) return { key: 'idle', live: false };
  // Off for this run only: say so rather than "on the way".
  if (runOff.some((r) => r.date === today && r.kind === shown.kind)) return { key: 'off', live: false };
  const events = await parent.eventsOf(shown.id, { id: van.driver_id, name: null });
  const tl = timelineFor(shown.kind ?? defaultRunKind(new Date()), c.id, events);
  const place = childPlace(shown.kind, tl.items);
  // A finished run that never picked the child up is over, not "on the way".
  if (!running && place === 'coming') return { key: 'over', live: false };
  return { key: place, live: !!running };
}

export default function Kids() {
  const { t, dir } = useLang();
  const p = useParent();
  const [lines, setLines] = useState<Record<string, Line>>({});
  useEffect(() => {
    let alive = true;
    const load = () => Promise.all(p.children.map(async (c) => [c.id, await lineFor(c).catch(() => ({ key: 'none', live: false }) as Line)] as const)).then((r) => alive && setLines(Object.fromEntries(r)));
    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [p.children.map((c) => c.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={t('kids.title')}>
      {p.children.map((c, i) => {
        const l = lines[c.id];
        const col = childColors(i);
        const text = !l ? '' : ['coming', 'inVan', 'atSchool', 'home'].includes(l.key) ? t(`parent.place.${l.key as 'home'}`, { name: c.first_name }) : t(`kids.${l.key as 'off'}`, { name: c.first_name });
        return (
          <Animated.View key={c.id} entering={FadeInDown.delay(i * 90).springify().damping(22).stiffness(300)}>
            <PressableScale accessibilityRole="button" accessibilityLabel={text || c.first_name} testID={`kid-${i}`} onPress={() => { p.actions.selectChild(c.id); router.navigate('/'); }}
              faceStyle={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius10.group, backgroundColor: colors.white }}>
              <Niche letter={c.first_name.slice(0, 1)} fill={col.fill} ink={col.ink} width={64} height={78} floating={false} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText bold style={{ fontSize: 18 }}>{c.first_name}</AppText>
                {l ? <AppText bold color={l.live ? colors.zamurradOnTint : colors.ink2} style={{ fontSize: 16 }}>{text}</AppText> : <Shimmer lines={[{ w: '70%', h: 16 }]} />}
              </View>
              {l?.live ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.zamurrad }} /> : null}
            </PressableScale>
          </Animated.View>
        );
      })}
    </Page>
  );
}
