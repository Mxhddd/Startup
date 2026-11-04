// One table for "what happens when a trip step happens", so every surface tells the same story:
// the app (haptic and celebration), the push (sound, and whether it may break through Focus), the
// Live Activity and the Android live notification (colour). Change a step's feel here, once.
export type MomentStep = 'left' | 'picked' | 'arriving' | 'reached_school' | 'left_school' | 'dropped' | 'late';

export type Moment = {
  /** The brand colour of the step (one colour per meaning). */
  tone: 'neel' | 'zamurrad' | 'kesar' | 'shingarf';
  /** The haptic the parent feels if the app is open. */
  haptic: 'tick' | 'success' | 'warn';
  /**
   * v9: the step's own tone in the Pohnch tones family (scripts/sounds/make-tones.py): "m_<sound>"
   * in the app, "a_<sound>.wav" for the push, and Android channel "step-<sound>". One tone per step,
   * so a parent knows what happened without looking.
   */
  sound: MomentStep;
  /** The in-app celebration: none, a ring that closes, or a burst of stars. */
  celebrate: 'none' | 'ring' | 'burst';
  /** iPhone "time-sensitive": may show through Focus. Only for things a parent must act on now. */
  timeSensitive: boolean;
};

export const MOMENTS: Record<MomentStep, Moment> = {
  left: { tone: 'neel', haptic: 'tick', sound: 'left', celebrate: 'none', timeSensitive: false },
  picked: { tone: 'zamurrad', haptic: 'success', sound: 'picked', celebrate: 'ring', timeSensitive: false },
  arriving: { tone: 'zamurrad', haptic: 'tick', sound: 'arriving', celebrate: 'none', timeSensitive: true },
  reached_school: { tone: 'kesar', haptic: 'success', sound: 'reached_school', celebrate: 'burst', timeSensitive: false },
  left_school: { tone: 'neel', haptic: 'tick', sound: 'left_school', celebrate: 'none', timeSensitive: false },
  dropped: { tone: 'zamurrad', haptic: 'success', sound: 'dropped', celebrate: 'ring', timeSensitive: false },
  late: { tone: 'shingarf', haptic: 'warn', sound: 'late', celebrate: 'none', timeSensitive: true },
};

/** The steps a parent can switch off one by one in settings (the same list, in timeline order). */
export const ALERT_STEPS: MomentStep[] = ['left', 'picked', 'arriving', 'reached_school', 'left_school', 'dropped', 'late'];

/**
 * Which step just happened, comparing what the timeline showed before and now. Only a step that
 * newly has a time counts, so opening the app on a finished trip plays nothing.
 */
export function newMoment(
  before: { step: string; at: string | null }[] | null,
  now: { step: string; at: string | null }[],
): MomentStep | null {
  if (!before) return null;
  for (const item of [...now].reverse()) {
    const was = before.find((b) => b.step === item.step);
    if (item.at && was && !was.at) return item.step as MomentStep;
  }
  return null;
}
