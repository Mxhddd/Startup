// v12: this phone's own alert choices (stored on the phone only; nothing is sent):
// - prep: the "get ready" alert, N minutes before the van reaches the stop (0 = off; default 5);
// - friday: the weekly story on Friday afternoon; brief: a morning line before the van comes.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalPrefs = { prep: number; friday: boolean; brief: boolean };
const KEY = 'pohnch.parent.localAlerts.v1';
export const PREP_CHOICES = [0, 3, 5, 10, 15] as const;
export const DEFAULT_LOCAL: LocalPrefs = { prep: 5, friday: true, brief: false };

let cache: LocalPrefs | null = null;
const subs = new Set<(p: LocalPrefs) => void>();

export async function localPrefs(): Promise<LocalPrefs> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = { ...DEFAULT_LOCAL, ...(raw ? (JSON.parse(raw) as Partial<LocalPrefs>) : {}) };
  } catch {
    cache = DEFAULT_LOCAL;
  }
  return cache;
}

export async function saveLocalPrefs(p: LocalPrefs): Promise<void> {
  cache = p;
  subs.forEach((cb) => cb(p));
  await AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => undefined);
}

export function onLocalPrefs(cb: (p: LocalPrefs) => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
