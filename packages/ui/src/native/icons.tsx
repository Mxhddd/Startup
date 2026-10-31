// The star (the logo's eight-point khatim with its punched centre) and one icon per trip step.
import Svg, { Circle, Path } from 'react-native-svg';
import type { Step } from '../theme';

const STAR =
  'M32 4 L40.2 12.2 L51.8 12.2 L51.8 23.8 L60 32 L51.8 40.2 L51.8 51.8 L40.2 51.8 L32 60 L23.8 51.8 L12.2 51.8 L12.2 40.2 L4 32 L12.2 23.8 L12.2 12.2 L23.8 12.2 Z ' +
  'M41.5 32 A9.5 9.5 0 1 0 22.5 32 A9.5 9.5 0 1 0 41.5 32 Z';

export function StarIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={STAR} fill={color} fillRule="evenodd" />
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
} satisfies Record<Step | string, string>;

export type IconName = keyof typeof STEP_PATHS;

export function Icon({ name, size = 24, color, strokeWidth = 2.2 }: { name: IconName; size?: number; color: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={STEP_PATHS[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
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
