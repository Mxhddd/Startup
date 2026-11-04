// Turns the free OpenFreeMap "positron" style into the Pohnch map (design/BRAND.md, Map): warm land,
// soft green parks, blue-grey water, white roads with a light casing, few labels in ink-2.
// Works on the style JSON, so it needs no map key and no Google account.
import { mapMoods, type MapMood } from './theme';

type Layer = { id: string; type: string; paint?: Record<string, unknown>; layout?: Record<string, unknown>; [k: string]: unknown };
export type MapStyleJson = { layers: Layer[]; [k: string]: unknown };

const has = (id: string, ...parts: string[]) => parts.some((p) => id.includes(p));

export function brandMapStyle<T extends MapStyleJson>(style: T, mood: MapMood = 'day'): T {
  const mapColors = mapMoods[mood];
  const layers: Layer[] = style.layers
    // Road number shields add clutter and aren't used in Karachi.
    .filter((l) => !has(l.id, 'shield'))
    .map((l) => {
      const paint = { ...(l.paint ?? {}) };
      const layout = { ...(l.layout ?? {}) };
      const id = l.id;
      if (l.type === 'background') paint['background-color'] = mapColors.land;
      else if (l.type === 'fill') {
        if (has(id, 'water')) paint['fill-color'] = mapColors.water;
        else if (has(id, 'park', 'wood', 'grass')) paint['fill-color'] = mapColors.parks;
        else if (has(id, 'building')) paint['fill-color'] = mapColors.building;
        else if (has(id, 'residential', 'landuse')) paint['fill-color'] = mapColors.residential;
      } else if (l.type === 'line') {
        if (has(id, 'water')) paint['line-color'] = mapColors.water;
        else if (has(id, 'casing')) paint['line-color'] = mapColors.roadCasing;
        else if (has(id, 'highway', 'road', 'tunnel', 'bridge')) paint['line-color'] = mapColors.road;
        else if (has(id, 'railway')) paint['line-color'] = mapColors.rail;
        else if (has(id, 'boundary')) paint['line-color'] = mapColors.boundary;
      } else if (l.type === 'symbol') {
        paint['text-color'] = mapColors.labels;
        paint['text-halo-color'] = mapColors.halo;
        paint['text-halo-width'] = 1.2;
      }
      return { ...l, paint, layout };
    });
  // 3D buildings at street zoom, in the warm building colour: they only show when the camera tilts
  // (the parent's follow mode), and fade in from zoom 15 so the city view stays flat and calm.
  const sources = ((style as unknown as { sources?: Record<string, { type?: string }> }).sources ?? {}) as Record<string, { type?: string }>;
  const vector = Object.keys(sources).find((k) => sources[k]?.type === 'vector');
  const existing = layers.findIndex((l) => l.id === 'pohnch-3d-buildings');
  if (existing >= 0) {
    // Already styled once (another mood): only recolour it.
    const l = layers[existing] as Layer;
    layers[existing] = { ...l, paint: { ...(l.paint ?? {}), 'fill-extrusion-color': mapColors.building } };
  } else if (vector) {
    const firstLabel = layers.findIndex((l) => l.type === 'symbol');
    const building: Layer = {
      id: 'pohnch-3d-buildings',
      type: 'fill-extrusion',
      source: vector,
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': mapColors.building,
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, 0.9],
        'fill-extrusion-vertical-gradient': true,
      },
    };
    layers.splice(firstLabel < 0 ? layers.length : firstLabel, 0, building);
  }
  return { ...style, layers };
}
