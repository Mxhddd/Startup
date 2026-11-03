import { describe, expect, it } from 'vitest';
import { brandMapStyle, type MapStyleJson } from './mapStyle';
import { colors, mapColors } from './theme';

const style: MapStyleJson = {
  version: 8,
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
    { id: 'water', type: 'fill', paint: { 'fill-color': '#aad' } },
    { id: 'park', type: 'fill' },
    { id: 'highway_major_casing', type: 'line' },
    { id: 'highway_major_inner', type: 'line' },
    { id: 'highway-shield-us-interstate', type: 'symbol' },
    { id: 'label_city', type: 'symbol', layout: { 'text-field': '{name}' } },
  ],
};

describe('the Pohnch map style', () => {
  const out = brandMapStyle(style);
  const layer = (id: string) => out.layers.find((l) => l.id === id);

  it('uses the brand colours for land, water, parks and roads', () => {
    expect(layer('background')?.paint?.['background-color']).toBe(mapColors.land);
    expect(layer('water')?.paint?.['fill-color']).toBe(mapColors.water);
    expect(layer('park')?.paint?.['fill-color']).toBe(mapColors.parks);
    expect(layer('highway_major_casing')?.paint?.['line-color']).toBe(mapColors.roadCasing);
    expect(layer('highway_major_inner')?.paint?.['line-color']).toBe(mapColors.road);
  });

  it('keeps labels readable in ink-2 on a ghee halo, and drops road shields', () => {
    expect(layer('label_city')?.paint?.['text-color']).toBe(mapColors.labels);
    expect(layer('label_city')?.paint?.['text-halo-color']).toBe(colors.ghee);
    expect(layer('label_city')?.layout?.['text-field']).toBe('{name}');
    expect(layer('highway-shield-us-interstate')).toBeUndefined();
  });

  it('leaves the rest of the style alone', () => {
    expect(out.version).toBe(8);
    expect(style.layers[0]?.paint?.['background-color']).toBe('#fff'); // the input is not changed
  });

  it('adds 3D buildings under the labels when the style has a vector source, once', () => {
    const withSource = { ...style, sources: { openmaptiles: { type: 'vector' } } };
    const once = brandMapStyle(withSource);
    const twice = brandMapStyle(once);
    const ids = twice.layers.map((l) => l.id);
    expect(ids.filter((i) => i === 'pohnch-3d-buildings')).toHaveLength(1);
    expect(ids.indexOf('pohnch-3d-buildings')).toBeLessThan(ids.indexOf('label_city'));
    expect(brandMapStyle(style).layers.some((l) => l.id === 'pohnch-3d-buildings')).toBe(false);
  });
});
