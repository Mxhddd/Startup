// Parent home (v5): the map fills the screen; chips for each child and the menu float over it; a live
// pill shows while the van is on its way; the MapSheet holds today's trip for the chosen child.
// "Trip" opens the sheet to the full timeline. In development builds, a long press on the menu opens
// the component gallery.
import { karachiClock } from '@pohnch/core';
import { colors, space, useLang } from '@pohnch/ui';
import { ArchMoment, Glass, Icon, LivingSky, MapSheet, PressableScale, RainStreaks } from '@pohnch/ui/native';
import { useRain } from '@pohnch/client';
import { childPlace } from '@pohnch/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMap } from '../components/BrandMap';
import { LivePill } from '../components/LivePill';
import { TopBar } from '../components/TopBar';
import { TripSheet } from '../components/TripSheet';
import { useParent } from '../state/ParentStore';

export default function ParentHome() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const p = useParent();
  const [open, setOpen] = useState(false);
  // Follow mode: on while the van moves; a pan stops it and shows the recentre button.
  const [following, setFollowing] = useState(true);
  const [arch, setArch] = useState<{ step: string; letter: string; title: string; sub?: string } | null>(null);
  const [recenter, setRecenter] = useState(0);
  // 0 when the sheet peeks, 1 when it's open: the map sinks 3% and dims, so the sheet feels lifted off it.
  const sheet = useSharedValue(0);
  const mapStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.03 * Math.min(1, sheet.value) }] }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: 0.24 * Math.min(1, sheet.value) }));
  const barStyle = useAnimatedStyle(() => ({ opacity: 1 - 0.5 * Math.min(1, sheet.value) }));
  const live = p.phase === 'live';
  const onboarding = p.phase !== 'live' && p.phase !== 'idle';
  // v21: sheet sizes come from the screen height (they were fixed 360/196/640, which overflowed short phones).
  const { height: screenH } = useWindowDimensions();
  const usable = screenH - insets.top - insets.bottom;
  const peek = Math.round(onboarding ? Math.min(360, usable * 0.46) : Math.min(196, Math.max(160, usable * 0.26)));
  const openH = Math.round(onboarding ? Math.min(360, usable * 0.6) : Math.min(640, usable * 0.88));
  // v12: rain over the sky, and the sheet tinted by the moment of the trip.
  const rain = useRain(p.membership?.status === 'approved');
  const place = live ? childPlace(p.kind, p.timeline.items) : null;
  const accent = !live ? null : p.lateMin >= 5 ? colors.shingarf : place === 'inVan' || place === 'home' ? colors.zamurrad : place === 'atSchool' ? colors.kesar : colors.neel;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transformOrigin: 'top' }, mapStyle]}>
      <BrandMap
        accessibilityLabel={t('parent.map.label')}
        van={live && p.position ? { lat: p.position.lat, lng: p.position.lng, heading: p.position.heading, stale: p.signal?.stale ?? false, speed: p.position.speed, waiting: p.eta === 'door' } : null}
        stop={p.stop ? { lat: p.stop.lat, lng: p.stop.lng } : null}
        home={p.child?.lat != null && p.child.lng != null ? { lat: p.child.lat, lng: p.child.lng } : null}
        bottomInset={peek}
        trail={live ? p.trail : undefined}
        follow={live}
        onFollowChange={setFollowing}
        recenterKey={recenter}
      />
      </Animated.View>
      {/* v9: the living sky over the top of the map, following the time of day (night when dark). */}
      <LivingSky height={insets.top + 190} />
      {rain ? <RainStreaks height={insets.top + 190} /> : null}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.night }, dimStyle]} />
      <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, barStyle]}>

      <TopBar
        top={insets.top}
        kids={p.children}
        selected={p.child?.id ?? null}
        onSelect={p.actions.selectChild}
        onMenu={() => router.push('/family')}
        onMenuLong={__DEV__ ? () => router.push('/gallery') : undefined}
      />
      {live && !following ? (
        <Animated.View entering={ZoomIn.springify().damping(18).stiffness(300)} exiting={ZoomOut.duration(150)} style={{ position: 'absolute', bottom: peek + insets.bottom + 16, [dir === 'rtl' ? 'left' : 'right']: space.gutter }}>
          <PressableScale accessibilityRole="button" accessibilityLabel={t('parent.recenter')} onPress={() => setRecenter((n) => n + 1)} scaleTo="chip" haptic="tick" testID="recenter">
            <Glass style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="navigate" size={22} color={colors.link} strokeWidth={2.3} />
            </Glass>
          </PressableScale>
        </Animated.View>
      ) : null}
      {live ? <LivePill top={insets.top} clock={karachiClock(new Date(p.now))} staleSeconds={p.signal?.stale ? p.signal.secondsAgo : null} /> : null}
      </Animated.View>

      <MapSheet peek={peek} open={Math.max(peek, openH)} bottomInset={insets.bottom} expanded={open} onExpandedChange={setOpen} progress={sheet} accent={accent}>
        <TripSheet expanded={open} onOpenTrip={() => setOpen((o) => !o)} progress={sheet} onMoment={setArch} />
      </MapSheet>
      {/* v11: the step as an arch of light over everything, then it settles away. */}
      <ArchMoment visible={!!arch} tone={arch?.step === 'reached_school' ? 'kesar' : 'zamurrad'} letter={arch?.letter ?? ''} title={arch?.title ?? ''} sub={arch?.sub} onDone={() => setArch(null)} />
    </View>
  );
}
