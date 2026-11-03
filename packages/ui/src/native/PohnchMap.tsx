// The map in both apps: MapLibre with free OpenFreeMap tiles (OpenStreetMap data), recoloured to the
// brand. No Google account, map key or billing is needed. It never shows the phone's own location.
import { Camera, Map, Marker, type CameraRef, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { brandMapStyle, type MapStyleJson } from '../mapStyle';
import { BASE_MAP_STYLE_URL, colors, karachiRegion } from '../theme';
import { AppText } from './AppText';
import { StopPin } from './StopPin';
import { VanMarker } from './VanMarker';

export type MapPin =
  | { id: string; kind: 'stop' | 'home' | 'school'; lat: number; lng: number }
  | { id: string; kind: 'number'; n: number; lat: number; lng: number };

export type PohnchMapProps = {
  accessibilityLabel: string;
  pins?: MapPin[];
  van?: { lat: number; lng: number; heading: number | null; stale: boolean } | null;
  onPress?: (p: { lat: number; lng: number }) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Space the sheet covers at the bottom, so framing keeps pins in view. */
  bottomInset?: number;
  /** Space a header covers at the top. */
  topInset?: number;
  /** false for a still picture of the route (inside a scrolling screen). */
  interactive?: boolean;
  /** Keep the van in view as it moves (the driver's trip screen). */
  follow?: boolean;
};

// Fetched once per app run and shared by every map.
let cachedStyle: MapStyleJson | null = null;
async function loadStyle(): Promise<MapStyleJson | string> {
  if (cachedStyle) return cachedStyle;
  try {
    const res = await fetch(BASE_MAP_STYLE_URL);
    cachedStyle = brandMapStyle((await res.json()) as MapStyleJson);
    return cachedStyle;
  } catch {
    return BASE_MAP_STYLE_URL; // no signal: the plain style still works (and caches tiles)
  }
}

function PinView({ pin }: { pin: MapPin }) {
  if (pin.kind === 'number') {
    return (
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.neel, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 2px 6px rgba(20,26,51,0.25)' }}>
        <AppText variant="small" bold color={colors.white}>{String(pin.n)}</AppText>
      </View>
    );
  }
  return <StopPin kind={pin.kind} />;
}

export function PohnchMap({ accessibilityLabel, pins = [], van, onPress, style, testID, bottomInset = 0, topInset = 0, interactive = true, follow = false }: PohnchMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyleJson | string | null>(cachedStyle);
  const camera = useRef<CameraRef>(null);
  const framed = useRef(false);

  useEffect(() => {
    if (!mapStyle) loadStyle().then(setMapStyle);
  }, [mapStyle]);

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

  // Following: ease the camera to the van each time it moves, keeping the zoom.
  useEffect(() => {
    if (!follow || !van || !framed.current) return;
    camera.current?.easeTo({ center: [van.lng, van.lat], duration: 1200, padding: { top: topInset, bottom: bottomInset, left: 0, right: 0 } });
  }, [follow, van?.lat, van?.lng, topInset, bottomInset]); // eslint-disable-line react-hooks/exhaustive-deps

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
    >
      <Camera ref={camera} initialViewState={{ center: [karachiRegion.longitude, karachiRegion.latitude], zoom: 11 }} />
      {pins.map((p) => (
        <Marker key={p.id} id={p.id} lngLat={[p.lng, p.lat]} anchor={p.kind === 'home' || p.kind === 'school' ? 'bottom' : 'center'}>
          <PinView pin={p} />
        </Marker>
      ))}
      {van ? (
        <Marker id="van" lngLat={[van.lng, van.lat]} anchor="center">
          <VanMarker heading={van.heading ?? 0} stale={van.stale} />
        </Marker>
      ) : null}
    </Map>
  );
}
