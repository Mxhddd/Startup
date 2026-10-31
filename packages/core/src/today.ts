// Builds the driver's list for one run from what the database returns: stops in order, the children at
// each stop (siblings together), who is on chutti, and who has been tapped. The first stop with someone
// still waiting is "next" and gets the big button.
export type StopRow = { id: string; position: number; label: string };
export type RiderRow = { childId: string; firstName: string; stopId: string | null };
export type EventRow = { childId: string | null; step: string; undone: boolean };

export type StopGroup = {
  stopId: string | null;
  label: string;
  children: { childId: string; firstName: string; state: 'waiting' | 'done' | 'absent' }[];
  state: 'waiting' | 'done' | 'absent';
  isNext: boolean;
};

export function buildRun(opts: {
  stops: StopRow[];
  riders: RiderRow[];
  absentChildIds: string[];
  events: EventRow[];
  kind: 'morning' | 'afternoon';
  /** Afternoon runs go home in the reverse of the morning order. */
  reverseInAfternoon?: boolean;
  noStopLabel: string;
}): StopGroup[] {
  const step = opts.kind === 'morning' ? 'picked' : 'dropped';
  const tapped = new Set(opts.events.filter((e) => e.step === step && !e.undone && e.childId).map((e) => e.childId as string));
  const absent = new Set(opts.absentChildIds);

  let ordered = [...opts.stops].sort((a, b) => a.position - b.position);
  if (opts.kind === 'afternoon' && opts.reverseInAfternoon !== false) ordered = ordered.reverse();

  const groups: StopGroup[] = ordered.map((s) => ({ stopId: s.id, label: s.label, children: [], state: 'waiting', isNext: false }));
  const unplaced: StopGroup = { stopId: null, label: opts.noStopLabel, children: [], state: 'waiting', isNext: false };

  for (const r of [...opts.riders].sort((a, b) => a.firstName.localeCompare(b.firstName))) {
    const g = groups.find((x) => x.stopId === r.stopId) ?? unplaced;
    g.children.push({ childId: r.childId, firstName: r.firstName, state: absent.has(r.childId) ? 'absent' : tapped.has(r.childId) ? 'done' : 'waiting' });
  }

  const all = [...groups, ...(unplaced.children.length ? [unplaced] : [])].filter((g) => g.children.length > 0);
  for (const g of all) {
    const states = g.children.map((c) => c.state);
    g.state = states.every((s) => s === 'absent') ? 'absent' : states.some((s) => s === 'waiting') ? 'waiting' : 'done';
  }
  const next = all.find((g) => g.state === 'waiting');
  if (next) next.isNext = true;
  return all;
}

/** Counts for the TripHeader: children done out of children riding today (chutti not counted). */
export function runProgress(groups: StopGroup[]): { done: number; total: number } {
  const kids = groups.flatMap((g) => g.children).filter((c) => c.state !== 'absent');
  return { done: kids.filter((c) => c.state === 'done').length, total: kids.length };
}
