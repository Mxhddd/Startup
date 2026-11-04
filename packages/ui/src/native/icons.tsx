// The star (the logo's eight-point khatim with its punched centre) and one icon per trip step.
import Svg, { Circle, Path } from 'react-native-svg';
import type { Step } from '../theme';

export const STAR_PATH =
  'M32 4 L40.2 12.2 L51.8 12.2 L51.8 23.8 L60 32 L51.8 40.2 L51.8 51.8 L40.2 51.8 L32 60 L23.8 51.8 L12.2 51.8 L12.2 40.2 L4 32 L12.2 23.8 L12.2 12.2 L23.8 12.2 Z ' +
  'M41.5 32 A9.5 9.5 0 1 0 22.5 32 A9.5 9.5 0 1 0 41.5 32 Z';

export function StarIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={STAR_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

// Simple line icons on a 24 grid, drawn with round caps.
const STEP_PATHS = {
  // van leaving: van body with a motion line
  left: 'M3 16V9a2 2 0 0 1 2-2h9l4 4h1a2 2 0 0 1 2 2v3M3 16h18M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  // a child in the van: person with a tick
  picked: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 11l2 2 4-4',
  // school: a building with a flag
  reachedSchool: 'M3 21h18M5 21V11l7-5 7 5v10M10 21v-5h4v5M12 6V2l4 1.5L12 5',
  // leaving school: arrow out of the building
  leftSchool: 'M4 21V10l6-4 6 4M8 21v-4h4M14 15h7M18 12l3 3-3 3',
  // dropped home: house
  dropped: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5',
  home: 'M3 11l9-7 9 7M5 9.5V20h14V9.5',
  help: 'M12 3l9 16H3L12 3ZM12 10v4M12 17v.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  signal: 'M2 20h2M7 20v-4M12 20v-8M17 20V8M22 20V4M3 3l18 18',
  // points right; flip it for the reading direction
  arrow: 'M4 12h15M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  navigate: 'M12 3 L19 20 L12 16 L5 20 Z',
  bell: 'M12 3a6 6 0 0 1 6 6v4l2 3H4l2-3V9a6 6 0 0 1 6-6ZM10 20h4',
  sound: 'M4 9v6h4l5 4V5L8 9H4ZM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  calendar: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  sunset: 'M7 17a5 5 0 0 1 10 0M3 17h18M12 5v3M4.9 9.9l1.4 1.4M19.1 9.9l-1.4 1.4M6 21h12',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  family: 'M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 15.5c.9-.6 1.9-1 3-1 2.8 0 5 2.2 5 5',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  van: 'M2 16V7a1 1 0 0 1 1-1h11l4 4h2a2 2 0 0 1 2 2v4M9 17h6M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2ZM16 14.5h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3ZM8.5 12l2.5 2.5 4.5-5',
  star: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
  chevron: 'M15 6l-6 6 6 6',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8',
} satisfies Record<Step | string, string>;

export type IconName = keyof typeof STEP_PATHS;

/**
 * A line icon. v10: pass `duo` (a soft tint) for the two-tone look: the same shape filled with the
 * tint and nudged down and toward the start, under the line, like a second printed colour.
 */
export function Icon({ name, size = 24, color, strokeWidth = 2.2, duo }: { name: IconName; size?: number; color: string; strokeWidth?: number; duo?: string }) {
  const d = STEP_PATHS[name];
  return (
    <Svg width={size} height={size} viewBox="-1.5 -0.5 26 26" fill="none" style={{ overflow: 'visible' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {duo ? <Path d={d} fill={duo} stroke="none" transform="translate(-1.2 1.4)" /> : null}
      <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Dot({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Circle cx="5" cy="5" r="5" fill={color} />
    </Svg>
  );
}
