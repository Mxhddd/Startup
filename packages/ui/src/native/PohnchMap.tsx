// The map in both apps: MapLibre with free OpenFreeMap tiles (OpenStreetMap data), recoloured to the
// brand. No Google account, map key or billing is needed. It never shows the phone's own location.
import { Camera, GeoJSONSource, Layer, Map, Marker, type CameraRef, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { brandMapStyle, type MapStyleJson } from '../mapStyle';
import { karachiHour } from '@pohnch/core';
import { BASE_MAP_STYLE_URL, colorScheme, colors, karachiRegion, mapMoodAt, type MapMood } from '../theme';
import { AppText } from './AppText';
import { StopPin } from './StopPin';
import { VanMarker } from './VanMarker';

export type MapPin =
  | { id: string; kind: 'stop' | 'home' | 'school'; lat: number; lng: number }
  | { id: string; kind: 'number'; n: number; lat: number; lng: number };

export type PohnchMapProps = {
  accessibilityLabel: string;
  pins?: MapPin[];
  van?: { lat: number; lng: number; heading: number | null; stale: boolean; speed?: number | null; waiting?: boolean } | null;
  onPress?: (p: { lat: number; lng: number }) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Space the sheet covers at the bottom, so framing keeps pins in view. */
  bottomInset?: number;
  /** Space a header covers at the top. */
  topInset?: number;
  /** false for a still picture of the route (inside a scrolling screen). */
  interactive?: boolean;
  /** Keep the van in view as it moves, tilted and turned with it, until the person pans. */
  follow?: boolean;
  /** Told when following stops (the person moved the map) or starts again. */
  onFollowChange?: (following: boolean) => void;
  /** Change this number to start following again (the "recentre" button). */
  recenterKey?: number;
  /** Where the van has been in the last few minutes, oldest first: drawn as a fading trail. */
  trail?: { lat: number; lng: number }[];
  /** The road still ahead (van -> your stop): drawn dashed, the dashes flowing forward. */
  ahead?: { lat: number; lng: number }[];
  /** Force one map mood (dark mode uses 'night'); otherwise it follows the time of day in Karachi. */
  mood?: MapMood;
};

// The flowing dashes: the same dash pattern shifted a little each frame (the MapLibre way to animate a line).
const DASH_STEPS: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];

function useDashStep(on: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setI((n) => (n + 1) % DASH_STEPS.length), 90);
    return () => clearInterval(id);
  }, [on]);
  return DASH_STEPS[i] as number[];
}

const line = (pts: { lat: number; lng: number }[]) => ({
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'LineString' as const, coordinates: pts.map((p) => [p.lng, p.lat]) },
});

// The base style is fetched once per app run and shared by every map; each mood is coloured from it once.
let baseStyle: MapStyleJson | null = null;
const styled: Partial<Record<MapMood, MapStyleJson>> = {};
async function loadStyle(mood: MapMood): Promise<MapStyleJson | string> {
  if (styled[mood]) return styled[mood] as MapStyleJson;
  try {
    if (!baseStyle) baseStyle = (await (await fetch(BASE_MAP_STYLE_URL)).json()) as MapStyleJson;
    const out = brandMapStyle(baseStyle, mood);
    styled[mood] = out;
    return out;
  } catch {
    return BASE_MAP_STYLE_URL; // no signal: the plain style still works (and caches tiles)
  }
}

/** The mood for now in Karachi, checked every 10 minutes (morning, day, dusk). */
function useMood(fixed?: MapMood): MapMood {
  const [mood, setMood] = useState<MapMood>(() => fixed ?? mapMoodAt(karachiHour(new Date())));
  useEffect(() => {
    if (fixed) return setMood(fixed);
    const id = setInterval(() => setMood(mapMoodAt(karachiHour(new Date()))), 10 * 60_000);
    return () => clearInterval(id);
  }, [fixed]);
  return mood;
}

function PinView({ pin }: { pin: MapPin }) {
  if (pin.kind === 'number') {
    return (
      <View style={{ width: 34, height: 34, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.neel, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 2px 6px rgba(20,26,51,0.25)' }}>
        <AppText variant="small" bold color={colors.onFill}>{String(pin.n)}</AppText>
      </View>
    );
  }
  return <StopPin kind={pin.kind} />;
}

export function PohnchMap({ accessibilityLabel, pins = [], van, onPress, style, testID, bottomInset = 0, topInset = 0, interactive = true, follow = false, onFollowChange, recenterKey = 0, trail, ahead, mood: fixedMood }: PohnchMapProps) {
  // At night (a dark phone, parent app) the map is the night mood; otherwise it follows the clock.
  const mood = useMood(fixedMood ?? (colorScheme() === 'dark' ? 'night' : undefined));
  const [mapStyle, setMapStyle] = useState<MapStyleJson | string | null>(styled[mood] ?? null);
  const camera = useRef<CameraRef>(null);
  const framed = useRef(false);

  useEffect(() => {
    let live = true;
    loadStyle(mood).then((st) => live && setMapStyle(st));
    return () => {
      live = false;
    };
  }, [mood]);

  // Frame what matters once it first appears: the van, your stop and your home.
  useEffect(() => {
    const pts: [number, number][] = [...pins.map((p) => [p.lng, p.lat] as [number, number]), ...(van ? [[van.lng, van.lat] as [number, number]] : [])];
    if (framed.current || pts.length === 0) return;
    framed.current = true;
    if (pts.length === 1) {
      camera.current?.flyTo({ center: pts[0] as [number, number], zoom: 15, duration: 1100 });
    } else {
      const lngs = pts.map((p) => p[0]);
      const lats = pts.map((p) => p[1]);
      camera.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
        padding: { top: 80 + topInset, bottom: 60 + bottomInset, left: 50, right: 50 },
        duration: 1100,
      });
    }
  }, [pins, van, bottomInset, topInset]);

  // Following: the camera eases after the van, tilted 35° and turned to its heading, so the road ahead
  // is "up" like in a car. A pan by the person stops it; recenterKey starts it again.
  const [following, setFollowing] = useState(follow);
  // Which way the map itself is turned. The van marker stands on the screen, so it turns by the van's
  // heading minus the map's: while following, the map turns with the van and the van points straight up.
  const [mapBearing, setMapBearing] = useState(0);
  useEffect(() => {
    setFollowing(follow);
    if (follow) onFollowChange?.(true);
  }, [follow, recenterKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!following || !van || !framed.current) return;
    camera.current?.easeTo({
      center: [van.lng, van.lat],
      zoom: 16,
      pitch: 50, // v11: tilted further so the buildings stand up
      bearing: van.heading ?? 0,
      duration: 1400,
      padding: { top: topInset, bottom: bottomInset, left: 0, right: 0 },
    });
    setMapBearing(van.heading ?? 0);
  }, [following, van?.lat, van?.lng, van?.heading, topInset, bottomInset]); // eslint-disable-line react-hooks/exhaustive-deps
  const dash = useDashStep(!!ahead && ahead.length > 1);

  if (!mapStyle) return <View testID={testID} style={[StyleSheet.absoluteFill, { backgroundColor: colors.ghee }, style]} />;

  return (
    <Map
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={style ?? StyleSheet.absoluteFill}
      mapStyle={mapStyle as string | StyleSpecification}
      logo={false}
      attribution
      attributionPosition={{ bottom: 8 + bottomInset, left: 8 }}
      compass={false}
      touchRotate={false}
      touchPitch={false}
      dragPan={interactive}
      touchZoom={interactive}
      doubleTapZoom={interactive}
      onPress={onPress ? (e) => onPress({ lng: e.nativeEvent.lngLat[0], lat: e.nativeEvent.lngLat[1] }) : undefined}
      onRegionWillChange={(e) => {
        if (following && e.nativeEvent.userInteraction) {
          setFollowing(false);
          onFollowChange?.(false);
        }
      }}
    >
      <Camera ref={camera} initialViewState={{ center: [karachiRegion.longitude, karachiRegion.latitude], zoom: 11 }} />
      {trail && trail.length > 1 ? (
        <GeoJSONSource id="pohnch-trail" data={line(trail)} lineMetrics>
          <Layer
            id="pohnch-trail-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-width': 7,
              'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, 'rgba(31,42,92,0)', 1, 'rgba(31,42,92,0.85)'],
            }}
          />
        </GeoJSONSource>
      ) : null}
      {ahead && ahead.length > 1 ? (
        <GeoJSONSource id="pohnch-ahead" data={line(ahead)}>
          {/* v11: the road ahead glows: a soft kesar halo, a neel line, and light flowing along it to your door. */}
          <Layer id="pohnch-ahead-glow" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 18, 'line-color': colors.kesar, 'line-opacity': 0.28, 'line-blur': 8 }} />
          <Layer id="pohnch-ahead-base" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 7, 'line-color': colors.neel, 'line-opacity': 0.85 }} />
          <Layer id="pohnch-ahead-line" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-width': 3.5, 'line-color': colors.kesarHi, 'line-opacity': 0.95, 'line-dasharray': dash }} />
        </GeoJSONSource>
      ) : null}
      {pins.map((p) => (
        <Marker key={p.id} id={p.id} lngLat={[p.lng, p.lat]} anchor={p.kind === 'home' || p.kind === 'school' ? 'bottom' : 'center'}>
          <PinView pin={p} />
        </Marker>
      ))}
      {van ? (
        <Marker id="van" lngLat={[van.lng, van.lat]} anchor="center">
          <VanMarker heading={(van.heading ?? 0) - mapBearing} stale={van.stale} speed={van.speed} waiting={van.waiting} lights={mood === 'dusk' || mood === 'night'} />
        </Marker>
      ) : null}
    </Map>
  );
}
