// Turns the free OpenFreeMap "positron" style into the Pohnch map (design/BRAND.md, Map): warm land,
// soft green parks, blue-grey water, white roads with a light casing, few labels in ink-2.
// Works on the style JSON, so it needs no map key and no Google account.
import { colors, mapColors } from './theme';

type Layer = { id: string; type: string; paint?: Record<string, unknown>; layout?: Record<string, unknown> };
export type MapStyleJson = { layers: Layer[]; [k: string]: unknown };

const has = (id: string, ...parts: string[]) => parts.some((p) => id.includes(p));

export function brandMapStyle<T extends MapStyleJson>(style: T): T {
  const layers = style.layers
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
        paint['text-halo-color'] = colors.ghee;
        paint['text-halo-width'] = 1.2;
      }
      return { ...l, paint, layout };
    });
  return { ...style, layers };
}
