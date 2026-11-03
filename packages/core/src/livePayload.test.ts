import { describe, expect, it } from 'vitest';
import { findLivePayload, LIVE_KEY } from './livePayload';

const card = { state: 'coming', initial: 'A', lead: "Ali's van", headline: 'min', arriveAt: 1, startAt: 0, progress: 0.4, minutes: '6', ahead: '', footer: '' };

describe('the Android live data message', () => {
  it('is found however Android wraps it', () => {
    const json = JSON.stringify({ card, unit: 'min' });
    expect(findLivePayload({ data: { [LIVE_KEY]: json } })?.card.minutes).toBe('6');
    expect(findLivePayload({ notification: { request: { content: { data: { [LIVE_KEY]: json } } } } })?.unit).toBe('min');
    expect(findLivePayload({ data: { dataString: JSON.stringify({ [LIVE_KEY]: json }) } })?.card.lead).toBe("Ali's van");
  });
  it('ignores anything else', () => {
    expect(findLivePayload({ data: { kind: 'trip', step: 'left' } })).toBeNull();
    expect(findLivePayload('not json')).toBeNull();
    expect(findLivePayload(null)).toBeNull();
  });
});
