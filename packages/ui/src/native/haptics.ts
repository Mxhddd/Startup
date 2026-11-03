// Small taps you feel, one per kind of moment. Phones without a vibration motor (and the web
// preview) simply skip them, so a missing haptic is never an error.
import * as Haptics from 'expo-haptics';

const quiet = () => undefined;

export const haptic = {
  /** A finger lands on a button. */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(quiet),
  /** A heavier press: a big button, a sheet snapping into place. */
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(quiet),
  /** Moving through choices (child chips, the hold fill passing a quarter). */
  tick: () => Haptics.selectionAsync().catch(quiet),
  /** Something was done: a child marked in, a trip started. */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(quiet),
  /** Taken back (undo) or needs attention (help). */
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(quiet),
};

export type HapticKind = keyof typeof haptic | 'none';
