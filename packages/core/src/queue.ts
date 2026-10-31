// The driver's offline queue. Every tap is saved on the phone first, then sent in order.
// - No signal or a server hiccup: stop, keep everything, try again later (oldest first, so order holds).
// - A clear refusal (e.g. "child_not_on_van"): drop that one item and remember why, then carry on.
// - Each item carries the tap's clientId, so sending one twice is harmless: the server stores it once.
import { ApiError } from './api';

export type QueueItem = { id: string; action: string; body: Record<string, unknown>; queuedAt: number };
export type Dropped = { item: QueueItem; code: string };

export type QueueStore = {
  load: () => Promise<QueueItem[]>;
  save: (items: QueueItem[]) => Promise<void>;
};

export type Send = (action: string, body: Record<string, unknown>) => Promise<unknown>;

export function createQueue(store: QueueStore, send: Send, onChange?: (pending: number, dropped: Dropped[]) => void) {
  let items: QueueItem[] | null = null;
  let flushing: Promise<{ sent: number; stoppedOffline: boolean }> | null = null;
  const dropped: Dropped[] = [];

  const ready = async () => {
    if (!items) items = await store.load();
    return items;
  };
  const changed = async () => {
    await store.save(items ?? []);
    onChange?.(items?.length ?? 0, dropped);
  };

  return {
    /** Save first (so nothing is lost if the app closes), then try to send. */
    async add(item: QueueItem) {
      const list = await ready();
      if (!list.some((x) => x.id === item.id)) list.push(item);
      await changed();
      return this.flush();
    },
    /** Remove an item not yet sent (e.g. undone while offline). Returns true if it was still waiting. */
    async remove(id: string) {
      const list = await ready();
      const before = list.length;
      items = list.filter((x) => x.id !== id);
      await changed();
      return items.length < before;
    },
    async pending() {
      return (await ready()).length;
    },
    dropped: () => [...dropped],
    flush() {
      if (flushing) return flushing;
      flushing = (async () => {
        let sent = 0;
        try {
          const list = await ready();
          while (list.length > 0) {
            const head = list[0] as QueueItem;
            try {
              await send(head.action, head.body);
              sent++;
            } catch (e) {
              const err = e instanceof ApiError ? e : new ApiError('offline', 0);
              if (err.retryable) return { sent, stoppedOffline: true };
              dropped.push({ item: head, code: err.code });
            }
            list.shift();
            await changed();
          }
          return { sent, stoppedOffline: false };
        } finally {
          flushing = null;
        }
      })();
      return flushing;
    },
  };
}

export type Queue = ReturnType<typeof createQueue>;

/** Wait before the next retry: 2 s, 4 s, 8 s ... up to 60 s. */
export function retryDelayMs(attempt: number): number {
  return Math.min(60_000, 2000 * 2 ** Math.max(0, attempt));
}
