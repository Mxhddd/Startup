// "Which Van Uncle do you have?" (v24): a 5-question quiz at /van-uncle, made to be shared. Each answer
// adds a point to one of five van-uncle types; the most points wins (ties go to the earlier type). A
// shared link carries only the result's short id (?r=toofan), never anything about the person.

export const TYPES = ['toofan', 'paanch', 'dj', 'gayab', 'farishta'] as const;
export type UncleType = (typeof TYPES)[number];

/** Each question's four answers, in order, and the type each one points to. */
export const QUESTIONS: readonly (readonly UncleType[])[] = [
  ['toofan', 'paanch', 'dj', 'gayab'],      // 7:12 am, where's the van?
  ['dj', 'toofan', 'farishta', 'gayab'],    // what's playing in the van?
  ['paanch', 'gayab', 'farishta', 'toofan'], // you call him. he says...
  ['farishta', 'dj', 'toofan', 'paanch'],   // it's raining. the van...
  ['gayab', 'farishta', 'paanch', 'dj'],    // the end of the month, fees day...
];

/** The winning type for a list of chosen answer indexes (one per question). */
export function resultOf(answers: readonly number[]): UncleType {
  const score: Record<UncleType, number> = { toofan: 0, paanch: 0, dj: 0, gayab: 0, farishta: 0 };
  answers.forEach((a, q) => {
    const t = QUESTIONS[q]?.[a];
    if (t) score[t] += 1;
  });
  return TYPES.reduce((best, t) => (score[t] > score[best] ? t : best), TYPES[0]);
}

/** A result id from a shared link, or null if it isn't one of ours. */
export function asType(raw: unknown): UncleType | null {
  return typeof raw === 'string' && (TYPES as readonly string[]).includes(raw) ? (raw as UncleType) : null;
}
