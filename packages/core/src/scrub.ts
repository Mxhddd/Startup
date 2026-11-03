// Crash reports (Sentry) must never carry a phone number, a token, a place or a child's name
// (CLAUDE.md, data rules). Every report passes through scrubEvent before it leaves the phone:
// - who: no user, no IP, no request, no "extra" values;
// - breadcrumbs: only screen changes, as bare paths (no query strings, no route params' values);
// - every remaining string: phone numbers, login tokens (JWTs), invite tokens and coordinates are
//   replaced with [phone], [token], [token] and [place].
// Children's names can't be spotted by a pattern, so nothing that could hold one (button labels,
// console lines, network bodies, screen titles) is kept at all.

const PHONE = /(?<![0-9])(?:\+?92|0)3\d{2}[ -]?\d{7}(?![0-9])/g;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const INVITE = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/g;
const COORD = /-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}/g;

export function scrubText(s: string): string {
  return s.replace(JWT, '[token]').replace(INVITE, '[token]').replace(PHONE, '[phone]').replace(COORD, '[place]');
}

function deep(v: unknown, depth = 0): unknown {
  if (depth > 12) return '[deep]';
  if (typeof v === 'string') return scrubText(v);
  if (Array.isArray(v)) return v.map((x) => deep(x, depth + 1));
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = deep(x, depth + 1);
    return out;
  }
  return v;
}

type Crumb = { category?: string; type?: string; data?: Record<string, unknown>; message?: string; [k: string]: unknown };
type ReportEvent = { user?: unknown; request?: unknown; extra?: unknown; breadcrumbs?: Crumb[]; server_name?: unknown; [k: string]: unknown };

const bare = (p: unknown) => (typeof p === 'string' ? p.split('?')[0] : undefined);

/** Returns a copy of the report that is safe to send. Use as Sentry's beforeSend. */
export function scrubEvent<T extends ReportEvent>(event: T): T {
  const { user: _user, request: _request, extra: _extra, server_name: _server, breadcrumbs, ...rest } = event;
  const crumbs = (breadcrumbs ?? [])
    .filter((b) => b.category === 'navigation')
    .map((b) => ({ category: 'navigation', type: b.type, timestamp: b.timestamp, data: { from: bare(b.data?.from), to: bare(b.data?.to) } }));
  return deep({ ...rest, breadcrumbs: crumbs }) as T;
}
