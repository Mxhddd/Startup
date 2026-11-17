// Pohnch Plus (pricing v2, Nov 2026). Families pay from day one: there is no free tier and no free
// month. The first month is discounted (Rs 99), never Rs 0, and only once per phone, per seat (child +
// van + stop) and per store account. Drivers never pay. The server holds the truth (subscriptions and
// intro_claims tables); this file is the shared wording of the rules so screens and tests agree.

/** Prices in rupees. The monthly price can be tested per van (PRICE_TESTS); the rest follow it. */
export const PRICES = {
  monthly: 349,
  sibling: 199,
  term: 1499, // 5 school months
  year: 2999,
  intro: 99,
  founding: 199, // the pilot vans' families, locked for 12 months
} as const;

/** The monthly prices the pilot tests, one per van (never different prices inside one van). */
export const PRICE_TESTS = [249, 349, 449] as const;

/** What the driver earns per child on Plus in a month when the van tracked enough of its trips. */
export const DRIVER_BONUS = { perChild: 40, minTrackedPct: 80 } as const;

/** Days of Plus kept after a renewal fails, before alerts stop. */
export const GRACE_DAYS = 3;

export type PlanKind = 'intro' | 'monthly' | 'term' | 'year' | 'founding' | 'school';
export type PlanStatus = 'active' | 'grace' | 'ended';

/** Everything Plus switches on. A family without Plus gets none of these (no free tier). */
export const PLUS_FEATURES = ['alerts', 'liveMap', 'liveActivity', 'chutti', 'familyPhones', 'history'] as const;
export type Feature = (typeof PLUS_FEATURES)[number];

/** What a child's plan allows. While billing is switched off (before the company can take payments),
 *  everyone keeps today's pilot behaviour. */
export function featuresFor(paid: boolean, billingOn: boolean): readonly Feature[] {
  return paid || !billingOn ? PLUS_FEATURES : [];
}

/** Is this plan paying for today? Active until paid_until; grace for GRACE_DAYS after it. */
export function planState(paidUntil: string | null, today: string): PlanStatus | 'none' {
  if (!paidUntil) return 'none';
  if (today <= paidUntil) return 'active';
  const end = new Date(`${paidUntil}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + GRACE_DAYS);
  return today <= end.toISOString().slice(0, 10) ? 'grace' : 'ended';
}

/** The intro month is allowed only if neither the phone nor the seat has had one. */
export function introAllowed(claims: { phone: boolean; seat: boolean }): boolean {
  return !claims.phone && !claims.seat;
}

/** The price of each child in a family, in order: the first at the van's monthly price, then siblings. */
export function familyMonthly(children: number, monthly: number = PRICES.monthly): number {
  if (children <= 0) return 0;
  return monthly + (children - 1) * PRICES.sibling;
}

/** The driver's bonus for a month. Nothing if the van tracked too few trips (or has no number yet). */
export function driverBonus(payingChildren: number, trackedPct: number | null): number {
  if (trackedPct === null || trackedPct < DRIVER_BONUS.minTrackedPct) return 0;
  return Math.max(0, payingChildren) * DRIVER_BONUS.perChild;
}
