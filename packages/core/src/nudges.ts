// The driver's gentle nudges during a trip (v8):
// - "at the stop": the van has stopped (under ~5 km/h) within 60 m of the next stop: the big button
//   breathes and the phone gives one bump, so the tap comes at the right moment;
// - "near the stop": within 250 m: the spoken prompt ("Next stop: Gali 4, Hamza and Ayesha");
// - "at school": on the morning run, everyone in, within 150 m of the school pin: "reached school" breathes.
// Nothing here taps for the driver: every step is still the driver's own tap (or hold).
export const AT_STOP_M = 60;
export const NEAR_STOP_M = 250;
export const AT_SCHOOL_M = 150;
/** Metres per second under which the van counts as stopped (about 5 km/h). */
export const STOPPED_MPS = 1.5;

export type NudgeInput = {
  /** Metres to the next stop, or null (no stop, no position). */
  toStop: number | null;
  /** Metres to the school pin, or null (no pin, no position). */
  toSchool: number | null;
  /** The phone's speed in m/s, or null when unknown. */
  speed: number | null;
  morning: boolean;
  allDone: boolean;
};

export function nudges(n: NudgeInput): { atStop: boolean; nearStop: boolean; atSchool: boolean } {
  const stopped = n.speed === null || n.speed < STOPPED_MPS;
  return {
    atStop: n.toStop !== null && n.toStop <= AT_STOP_M && stopped,
    nearStop: n.toStop !== null && n.toStop <= NEAR_STOP_M,
    atSchool: n.morning && n.allDone && n.toSchool !== null && n.toSchool <= AT_SCHOOL_M,
  };
}
