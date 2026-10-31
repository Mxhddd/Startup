// The phone's secure storage (Keychain / Keystore) holds about 2 KB per item; a login session is bigger.
// This splits a value into chunks so the session can still live in secure storage, not plain storage.
export type KeyStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const CHUNK = 1800;

export function chunkedStorage(store: KeyStore): KeyStore {
  const countKey = (key: string) => `${key}.n`;
  const partKey = (key: string, i: number) => `${key}.${i}`;
  const remove = async (key: string) => {
    const n = Number((await store.getItem(countKey(key))) ?? 0);
    for (let i = 0; i < n; i++) await store.removeItem(partKey(key, i));
    await store.removeItem(countKey(key));
  };
  return {
    async getItem(key) {
      const n = Number((await store.getItem(countKey(key))) ?? NaN);
      if (!Number.isInteger(n) || n < 1) return null;
      const parts: string[] = [];
      for (let i = 0; i < n; i++) {
        const p = await store.getItem(partKey(key, i));
        if (p === null) return null; // half-written: treat as logged out
        parts.push(p);
      }
      return parts.join('');
    },
    async setItem(key, value) {
      await remove(key);
      const n = Math.max(1, Math.ceil(value.length / CHUNK));
      for (let i = 0; i < n; i++) await store.setItem(partKey(key, i), value.slice(i * CHUNK, (i + 1) * CHUNK));
      await store.setItem(countKey(key), String(n));
    },
    removeItem: remove,
  };
}
