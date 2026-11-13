// v21: the Android live trip notification's words and its text progress bar.
import { describe, expect, it } from 'vitest';
import { liveText, textBar } from './liveCard';

describe('live trip notification', () => {
  it('draws a 10-cell bar', () => {
    expect(textBar(0)).toBe('▱▱▱▱▱▱▱▱▱▱');
    expect(textBar(0.5)).toBe('▰▰▰▰▰▱▱▱▱▱');
    expect(textBar(1.4)).toBe('▰▰▰▰▰▰▰▰▰▰');
  });
  it('puts the minutes in the title and the bar in the text', () => {
    const card = { state: 'onWay', initial: 'A', lead: "Ali's van", headline: 'min to your door', arriveAt: 1, startAt: 0, progress: 0.3, minutes: '8', ahead: '2 stops before you', footer: '', steps: 1, marks: '' } as never;
    const { title, body } = liveText(card, 'min');
    expect(title).toBe("Ali's van · 8 min");
    expect(body).toContain('▰▰▰▱');
    expect(body).toContain('2 stops before you');
  });
});
