// A driver's invite that can't be used yet: opened while logged out (it waits until login finishes),
// or before the parent has added a child (v9: it waits until the child is added, then the join card
// opens again). In memory only: never in storage or a log.
let pending: string | null = null;

export function rememberInvite(token: string) {
  pending = token;
}

export function takeInvite(): string | null {
  const t = pending;
  pending = null;
  return t;
}
