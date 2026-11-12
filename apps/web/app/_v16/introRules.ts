// When the opening logo moment plays (v19): the full sunrise intro (about 4 s) on every visit, never
// with reduced motion. Nothing is stored. The timings are shared by the component and its CSS.
export type IntroMode = 'full' | 'none';
/** When the layer starts to open (ms) and how long the opening takes (ms). */
export const INTRO_OPEN_AT = 3200, INTRO_OPEN_MS = 800;

export function introMode(reducedMotion: boolean): IntroMode {
  return reducedMotion ? 'none' : 'full';
}
