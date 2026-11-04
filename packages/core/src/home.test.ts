import { describe, expect, it } from 'vitest';
import { homeState, type HomeInput } from './home';

const at = '2026-11-04T02:10:00Z';
const base: HomeInput = { phase: 'idle', kind: 'morning', items: [], eta: null, vanOff: null, absentToday: false, canUndoChutti: true, ready: false, storyDone: false };
const items = (...steps: ('left' | 'picked' | 'reached_school' | 'left_school' | 'dropped')[]) => steps.map((step) => ({ step, at, by: null }));

describe('the home sheet states (v9)', () => {
  it('guides set-up first', () => {
    expect(homeState({ ...base, phase: 'noChild' })).toEqual({ state: 'noChild', action: 'addChild' });
    expect(homeState({ ...base, phase: 'notOnVan' })).toEqual({ state: 'notOnVan', action: 'join' });
    expect(homeState({ ...base, phase: 'waiting' }).action).toBeNull();
  });
  it('morning: idle → coming → door → in the van → school, one next action each', () => {
    expect(homeState(base)).toEqual({ state: 'idle', action: 'offToday' });
    expect(homeState({ ...base, phase: 'live', items: items('left'), eta: 9 })).toEqual({ state: 'coming', action: 'openTrip' });
    expect(homeState({ ...base, phase: 'live', items: items('left'), eta: 3 })).toEqual({ state: 'coming', action: 'ready' });
    expect(homeState({ ...base, phase: 'live', items: items('left'), eta: 'door' })).toEqual({ state: 'door', action: 'ready' });
    expect(homeState({ ...base, phase: 'live', items: items('left'), eta: 'door', ready: true }).action).toBe('openTrip');
    expect(homeState({ ...base, phase: 'live', items: items('left', 'picked') }).state).toBe('inVan');
    expect(homeState({ ...base, phase: 'live', items: items('left', 'picked', 'reached_school') })).toEqual({ state: 'school', action: 'week' });
  });
  it('afternoon and the end of the day', () => {
    expect(homeState({ ...base, kind: 'afternoon', phase: 'live', items: items('left_school') }).state).toBe('leftSchool');
    expect(homeState({ ...base, kind: 'afternoon', phase: 'live', items: items('left_school', 'dropped') })).toEqual({ state: 'home', action: 'week' });
    expect(homeState({ ...base, kind: 'afternoon', storyDone: true })).toEqual({ state: 'story', action: 'week' });
  });
  it('days off come before everything else outside a trip', () => {
    expect(homeState({ ...base, vanOff: 'today' })).toEqual({ state: 'vanOff', action: 'plan' });
    expect(homeState({ ...base, absentToday: true })).toEqual({ state: 'chutti', action: 'undoOff' });
    expect(homeState({ ...base, absentToday: true, canUndoChutti: false }).action).toBe('plan');
  });
});
