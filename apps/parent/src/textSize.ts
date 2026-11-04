// v12 big-text mode: all text 18% larger (setTextScale in packages/ui), remembered on the phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTextScale, textScale } from '@pohnch/ui';

const KEY = 'pohnch.parent.bigText.v1';
export const BIG = 1.18;

export async function loadTextSize(): Promise<void> {
  const on = (await AsyncStorage.getItem(KEY).catch(() => null)) === 'on';
  setTextScale(on ? BIG : 1);
}

export function setBigText(on: boolean) {
  setTextScale(on ? BIG : 1);
  void AsyncStorage.setItem(KEY, on ? 'on' : 'off').catch(() => undefined);
}

export const bigTextOn = () => textScale() > 1;
