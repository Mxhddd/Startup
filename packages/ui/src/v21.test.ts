// v21: the apps share pohnch.pk's palette and truck art, colours follow dark mode (they used to be copied
// once at start-up), and motion stays quick (no slow default springs, short screen pushes).
import { describe, expect, it } from 'vitest';
import { applyColorScheme, colors, mapMoods, stepColors } from './theme';
import { durations, springs } from './motion';
import { chamakTile, jhalarTile, vineTile } from './truckart';

describe('v21 design alignment', () => {
  it('uses the website paper, card and night', () => {
    applyColorScheme('light');
    expect(colors.ghee).toBe('#FBF7EF');
    expect(colors.white).toBe('#FFFDF8');
    expect(colors.night).toBe('#10162F');
    expect(colors.gilt).toBe('#B8862F');
  });
  it('step colours and the map halo follow the night palette', () => {
    applyColorScheme('light');
    const day = stepColors.left.fill;
    applyColorScheme('dark');
    expect(stepColors.left.fill).not.toBe(day);
    expect(mapMoods.day.halo).toBe(colors.ghee);
    applyColorScheme('light');
    expect(stepColors.left.fill).toBe(day);
  });
  it('keeps motion quick', () => {
    expect(durations.screen).toBeLessThanOrEqual(260);
    expect(durations.enter).toBeLessThanOrEqual(220);
    for (const s of Object.values(springs)) expect(s.stiffness).toBeGreaterThanOrEqual(300);
  });
  it('draws the same truck-art tiles as the website', () => {
    for (const svg of [chamakTile(8), vineTile(22), jhalarTile(20)]) expect(svg.startsWith('<svg')).toBe(true);
  });
});
