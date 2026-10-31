// The timers behind TapButton (hold to confirm) and UndoBar (5-second undo), kept free of React
// so they can be tested with simulated time. The components only draw what these decide.
import { HOLD_MS, UNDO_MS, undoSecondsLeft } from './taps';

type Timers = {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
  setInterval: (fn: () => void, ms: number) => unknown;
  clearInterval: (id: unknown) => void;
  now: () => number;
};

const realTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id as ReturnType<typeof setInterval>),
  now: () => Date.now(),
};

/** Press starts a hold; only a hold that lasts the full time confirms. Releasing early cancels. */
export function createHold(onConfirm: () => void, holdMs = HOLD_MS, timers: Timers = realTimers) {
  let id: unknown = null;
  return {
    press() {
      if (id !== null) return;
      id = timers.setTimeout(() => {
        id = null;
        onConfirm();
      }, holdMs);
    },
    release() {
      if (id === null) return false;
      timers.clearTimeout(id);
      id = null;
      return true; // true = the hold was cancelled
    },
    get holding() {
      return id !== null;
    },
  };
}

/** Counts 5, 4 ... 1 after a tap; calls onExpire once when undo closes. Stop it when undone. */
export function createUndoCountdown(tappedAt: number, onTick: (secondsLeft: number) => void, onExpire: () => void, windowMs = UNDO_MS, timers: Timers = realTimers) {
  let done = false;
  const tick = () => {
    if (done) return;
    const left = undoSecondsLeft(tappedAt, timers.now(), windowMs);
    onTick(left);
    if (left === 0) {
      done = true;
      timers.clearInterval(id);
      onExpire();
    }
  };
  const id = timers.setInterval(tick, 200);
  tick();
  return {
    stop() {
      done = true;
      timers.clearInterval(id);
    },
  };
}
