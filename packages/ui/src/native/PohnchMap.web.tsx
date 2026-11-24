// v24: the real map in the browser (pohnch.pk/try and the web previews), the same MapLibre + OpenFreeMap
// tiles + brand colours as the phone apps, so a pin placed here is a real place. Pins and the van are our
// own components laid over the map at their projected positions; the trail and the road ahead are map
// lines. Browsers without WebGL get the old sketch (SketchMap). It never asks for the browser's location.
import maplibregl, { type GeoJSONSource, type LngLatBoundsLike, type Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { brandMapStyle, type MapStyleJson } from '../mapStyle';
import { BASE_MAP_STYLE_URL, colorScheme, colors, karachiRegion } from '../theme';
import { AppText } from './AppText';
import { SketchMap } from './SketchMap.web';
import { StopPin } from './StopPin';
import { VanMarker } from './VanMarker';
import type { PohnchMapProps } from './PohnchMap';

export type { MapPin, PohnchMapProps } from './PohnchMap';

let styleCache: Promise<MapStyleJson> | null = null;
const loadStyle = () => (styleCache ??= fetch(BASE_MAP_STYLE_URL).then((r) => r.json() as Promise<MapStyleJson>));

const webgl = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
})();

type Pt = { lat: number; lng: number };
const line = (pts: Pt[] | undefined) => ({
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'LineString' as const, coordinates: (pts ?? []).map((p) => [p.lng, p.lat]) },
});

export function PohnchMap(props: PohnchMapProps) {
  if (!webgl) return <SketchMap {...props} />;
  return <RealMap {...props} />;
}

function RealMap({ accessibilityLabel, pins = [], van, onPress, style, testID, bottomInset = 0, topInset = 0, interactive = true, follow = false, recenterKey = 0, trail, ahead, focus }: PohnchMapProps) {
  const host = useRef<unknown>(null); // on the web a View's ref is its DOM element
  const map = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0); // re-render overlays when the map moves
  const moved = useRef(false); // the person panned: stop re-framing until recentred
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    let m: MlMap | null = null;
    let gone = false;
    loadStyle()
      .then((raw) => {
        if (gone) return;
        const brand = brandMapStyle(structuredClone(raw), colorScheme() === 'dark' ? 'night' : 'day');
        m = new maplibregl.Map({
          container: el,
          style: brand as unknown as maplibregl.StyleSpecification,
          center: [karachiRegion.longitude, karachiRegion.latitude],
          zoom: 11,
          attributionControl: { compact: true },
          interactive,
          dragRotate: false,
          pitchWithRotate: false,
        });
        m.touchZoomRotate.disableRotation();
        map.current = m;
        m.on('load', () => {
          m!.addSource('trail', { type: 'geojson', data: line([]) });
          m!.addSource('ahead', { type: 'geojson', data: line([]) });
          m!.addLayer({ id: 'trail', type: 'line', source: 'trail', paint: { 'line-color': colors.neel, 'line-width': 6, 'line-opacity': 0.55 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
          m!.addLayer({ id: 'ahead', type: 'line', source: 'ahead', paint: { 'line-color': colors.neel, 'line-width': 5, 'line-dasharray': [0.5, 2.5], 'line-opacity': 0.85 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
          setReady(true);
        });
        const bump = () => setTick((n) => n + 1);
        m.on('move', bump);
        m.on('dragstart', () => { moved.current = true; });
        m.on('click', (e) => onPressRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
      })
      .catch(() => undefined);
    return () => {
      gone = true;
      m?.remove();
      map.current = null;
    };
  }, [interactive]);

  // Lines.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    (m.getSource('trail') as GeoJSONSource | undefined)?.setData(line(trail));
    (m.getSource('ahead') as GeoJSONSource | undefined)?.setData(line(ahead));
  }, [ready, trail, ahead]);

  // Framing: everything in view (or follow the van), until the person moves the map themselves.
  const key = JSON.stringify([pins.map((p) => [p.lat.toFixed(5), p.lng.toFixed(5)]), van && follow ? [van.lat.toFixed(4), van.lng.toFixed(4)] : null]);
  useEffect(() => { moved.current = false; }, [recenterKey]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m || moved.current) return;
    const padding = { top: 90 + topInset, bottom: 60 + bottomInset, left: 50, right: 50 };
    if (follow && van) {
      m.easeTo({ center: [van.lng, van.lat], zoom: Math.max(m.getZoom(), 15), padding, duration: 900 });
      return;
    }
    const pts: Pt[] = [...pins, ...(van ? [van] : [])];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      m.easeTo({ center: [pts[0]!.lng, pts[0]!.lat], zoom: Math.max(m.getZoom(), 15), padding, duration: 600 });
      return;
    }
    const lngs = pts.map((p) => p.lng);
    const lats = pts.map((p) => p.lat);
    const b: LngLatBoundsLike = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
    m.fitBounds(b, { padding, maxZoom: 16, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, recenterKey, bottomInset, topInset]);

  // v24: a search result or an area chip moves the map there (and stops the automatic framing).
  useEffect(() => {
    const mm = map.current;
    if (!ready || !mm || !focus) return;
    moved.current = true;
    mm.easeTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? 16, duration: 900 });
  }, [ready, focus?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const m = map.current;
  const at = (p: Pt) => (m ? m.project([p.lng, p.lat]) : null);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[style ?? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { overflow: 'hidden', backgroundColor: colors.paper }]}
    >
      <View ref={host as never} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: onPress ? 'crosshair' : undefined } as object} />
      {ready
        ? pins.map((p) => {
            const xy = at(p);
            if (!xy) return null;
            const size = p.kind === 'number' ? 34 : p.kind === 'stop' ? 24 : p.kind === 'home' ? 52 : 44;
            // A home pin's point is its tip (bottom centre); the others are centred.
            const top = p.kind === 'home' ? xy.y - size : xy.y - size / 2;
            return (
              <View key={p.id} pointerEvents="none" style={{ position: 'absolute', left: xy.x - size / 2, top }}>
                {p.kind === 'number' ? (
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.neel, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 2px 6px rgba(20,26,51,0.25)' }}>
                    <AppText variant="small" bold color={colors.onFill}>{String(p.n)}</AppText>
                  </View>
                ) : (
                  <StopPin kind={p.kind} />
                )}
              </View>
            );
          })
        : null}
      {ready && van
        ? (() => {
            const xy = at(van);
            return xy ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: xy.x - 32, top: xy.y - 32 }}>
                <VanMarker heading={van.heading ?? 90} stale={van.stale} speed={van.speed} waiting={van.waiting} lights={colorScheme() === 'dark'} />
              </View>
            ) : null;
          })()
        : null}
    </View>
  );
}
