// v9: what every kind of moment sounds and feels like, in one table (no React Native here, so the
// tests can check it). Sounds are files in packages/ui/assets/sounds made by
// scripts/sounds/make-tones.py; haptics are the kinds in native/haptics.ts.
//
// The rule: a sound, a haptic and the picture fire in the same frame. Interface sounds are short and
// quiet; a trip step plays its own tone (the same family as its push alert).
import type { MomentStep } from '@pohnch/core';

export type UiFeel = 'tap' | 'tick' | 'press' | 'toggleOn' | 'toggleOff' | 'sheetUp' | 'sheetDown' | 'confirm' | 'undo' | 'error' | 'hold1' | 'hold2' | 'hold3' | 'hold4' | 'success';
export type FeelKind = UiFeel | MomentStep;
export type HapticName = 'tap' | 'press' | 'tick' | 'success' | 'warn' | 'knock' | 'none';

/** sound: the file name in assets/sounds without ".wav" (null = silent); haptic: the pattern. */
export const FEEL: Record<FeelKind, { sound: string | null; haptic: HapticName }> = {
  tap: { sound: 'ui_tap', haptic: 'tap' },
  tick: { sound: 'ui_hold_1', haptic: 'tick' },
  press: { sound: 'ui_tap', haptic: 'press' },
  toggleOn: { sound: 'ui_toggle_on', haptic: 'tick' },
  toggleOff: { sound: 'ui_toggle_off', haptic: 'tick' },
  sheetUp: { sound: 'ui_sheet_up', haptic: 'press' },
  sheetDown: { sound: 'ui_sheet_down', haptic: 'tap' },
  confirm: { sound: 'ui_confirm', haptic: 'success' },
  undo: { sound: 'ui_undo', haptic: 'warn' },
  error: { sound: 'ui_error', haptic: 'warn' },
  hold1: { sound: 'ui_hold_1', haptic: 'tick' },
  hold2: { sound: 'ui_hold_2', haptic: 'tick' },
  hold3: { sound: 'ui_hold_3', haptic: 'tick' },
  hold4: { sound: 'ui_hold_4', haptic: 'tick' },
  success: { sound: 'ui_success', haptic: 'success' },
  // Trip steps: the step's own tone (the moments table in @pohnch/core names it).
  left: { sound: 'm_left', haptic: 'tap' },
  arriving: { sound: 'm_arriving', haptic: 'knock' },
  picked: { sound: 'm_picked', haptic: 'success' },
  reached_school: { sound: 'm_reached_school', haptic: 'success' },
  left_school: { sound: 'm_left_school', haptic: 'tap' },
  dropped: { sound: 'm_dropped', haptic: 'success' },
  late: { sound: 'm_late', haptic: 'warn' },
};

/** The four quarter ticks of a hold, rising. */
export const HOLD_FEELS: UiFeel[] = ['hold1', 'hold2', 'hold3', 'hold4'];
