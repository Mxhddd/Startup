import { describe, expect, it } from 'vitest';
import { matchSchools, normaliseInviteCode, normalisePlate } from './places';

const S = [
  { id: '1', name: 'Beaconhouse PECHS', short: 'bcp', area: 'PECHS' },
  { id: '2', name: 'Beaconhouse Clifton', short: null, area: 'Clifton' },
  { id: '3', name: 'The City School PAF Chapter', short: null, area: 'Shahrah-e-Faisal' },
  { id: '4', name: 'Karachi Grammar School Clifton', short: null, area: 'Clifton' },
  { id: '5', name: 'Little Stars Academy', short: null, area: 'Malir', verified: false },
];

describe('matchSchools', () => {
  it('finds a school by its short link name', () => expect(matchSchools('BCP', S)[0]?.id).toBe('1'));
  it('finds by words in any order', () => expect(matchSchools('pechs beacon', S)[0]?.id).toBe('1'));
  it('finds by the start of the name', () => expect(matchSchools('karachi gram', S)[0]?.id).toBe('4'));
  it('finds by initials', () => expect(matchSchools('tcs', S).map((s) => s.id)).toContain('3'));
  it('lists every Beaconhouse for "beaconhouse"', () => expect(matchSchools('beaconhouse', S).map((s) => s.id).sort()).toEqual(['1', '2']));
  it('matches the area too', () => expect(matchSchools('clifton', S).map((s) => s.id)).toEqual(expect.arrayContaining(['2', '4'])));
  it('nothing for nonsense', () => expect(matchSchools('zzzz', S)).toEqual([]));
});

describe('normalisePlate', () => {
  it.each([['bkr 123', 'BKR-123'], ['cs-1234', 'CS-1234'], ['KAB 12 1234', 'KAB-12-1234'], ['lez1234', 'LEZ-1234']])('%s -> %s', (a, b) =>
    expect(normalisePlate(a)).toBe(b));
  it.each(['', '123', 'ABCD-1', 'B-12'])('refuses %s', (a) => expect(normalisePlate(a)).toBeNull());
});

describe('normaliseInviteCode', () => {
  it('reads a code with a dash, spaces and lower case', () => expect(normaliseInviteCode(' abcd-efgh ')).toBe('ABCDEFGH'));
  it('refuses letters the codes never use', () => expect(normaliseInviteCode('ABCD0OIL')).toBeNull());
});
