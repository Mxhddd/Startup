import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHold, createUndoCountdown } from './controllers';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(() => vi.useRealTimers());

describe('TapButton hold', () => {
  it('confirms only after a full 800 ms hold', () => {
    const onConfirm = vi.fn();
    const hold = createHold(onConfirm);
    hold.press();
    vi.advanceTimersByTime(799);
    expect(onConfirm).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(hold.holding).toBe(false);
  });

  it('does nothing if let go early (a bump in traffic)', () => {
    const onConfirm = vi.fn();
    const hold = createHold(onConfirm);
    hold.press();
    vi.advanceTimersByTime(500);
    expect(hold.release()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ignores a second press while holding, so it confirms once', () => {
    const onConfirm = vi.fn();
    const hold = createHold(onConfirm);
    hold.press();
    vi.advanceTimersByTime(400);
    hold.press();
    vi.advanceTimersByTime(400);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('UndoBar countdown', () => {
  it('counts 5 down to 0 and expires once', () => {
    const ticks: number[] = [];
    const onExpire = vi.fn();
    createUndoCountdown(Date.now(), (s) => ticks.push(s), onExpire);
    vi.advanceTimersByTime(6000);
    expect([...new Set(ticks)]).toEqual([5, 4, 3, 2, 1, 0]);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('never expires after Undo stops it', () => {
    const onExpire = vi.fn();
    const c = createUndoCountdown(Date.now(), () => undefined, onExpire);
    vi.advanceTimersByTime(2000);
    c.stop();
    vi.advanceTimersByTime(10000);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
