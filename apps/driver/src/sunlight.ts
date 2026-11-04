// v12 sunlight mode for the driver: a brighter, higher-contrast palette for midday sun (sunColors in
// packages/ui). Remembered on the phone; switching redraws the app (the root listens).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applySunlight, sunlight } from '@pohnch/ui';

const KEY = 'pohnch.driver.sunlight.v1';
const subs = new Set<() => void>();

export async function loadSunlight(): Promise<void> {
  const on = (await AsyncStorage.getItem(KEY).catch(() => null)) === 'on';
  if (on !== sunlight()) {
    applySunlight(on);
    subs.forEach((cb) => cb());
  }
}

export function setSunlightMode(on: boolean) {
  applySunlight(on);
  subs.forEach((cb) => cb());
  void AsyncStorage.setItem(KEY, on ? 'on' : 'off').catch(() => undefined);
}

export const onSunlight = (cb: () => void) => {
  subs.add(cb);
  return () => void subs.delete(cb);
};
export const sunlightOn = () => sunlight();
