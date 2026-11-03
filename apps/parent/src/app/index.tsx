// Parent home (v5): the map fills the screen; chips for each child and the menu float over it; a live
// pill shows while the van is on its way; the MapSheet holds today's trip for the chosen child.
// "Trip" opens the sheet to the full timeline. In development builds, a long press on the menu opens
// the component gallery.
import { karachiClock } from '@pohnch/core';
import { colors, useLang } from '@pohnch/ui';
import { MapSheet } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMap } from '../components/BrandMap';
import { LivePill } from '../components/LivePill';
import { TopBar } from '../components/TopBar';
import { TripSheet } from '../components/TripSheet';
import { useParent } from '../state/ParentStore';

export default function ParentHome() {
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const p = useParent();
  const [open, setOpen] = useState(false);
  const live = p.phase === 'live';
  const onboarding = p.phase !== 'live' && p.phase !== 'idle';
  const peek = onboarding ? 300 : live ? 360 : 330;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <BrandMap
        accessibilityLabel={t('parent.map.label')}
        van={live && p.position ? { lat: p.position.lat, lng: p.position.lng, heading: p.position.heading, stale: p.signal?.stale ?? false } : null}
        stop={p.stop ? { lat: p.stop.lat, lng: p.stop.lng } : null}
        home={p.child?.lat != null && p.child.lng != null ? { lat: p.child.lat, lng: p.child.lng } : null}
        bottomInset={peek}
      />

      <TopBar
        top={insets.top}
        kids={p.children}
        selected={p.child?.id ?? null}
        onSelect={p.actions.selectChild}
        onMenu={() => router.push('/family')}
        onMenuLong={__DEV__ ? () => router.push('/gallery') : undefined}
      />
      {live ? <LivePill top={insets.top} clock={karachiClock(new Date(p.now))} staleSeconds={p.signal?.stale ? p.signal.secondsAgo : null} /> : null}

      <MapSheet peek={peek} open={onboarding ? 300 : 640} bottomInset={insets.bottom} expanded={open} onExpandedChange={setOpen}>
        <TripSheet expanded={open} onOpenTrip={() => setOpen((o) => !o)} />
      </MapSheet>
    </View>
  );
}
