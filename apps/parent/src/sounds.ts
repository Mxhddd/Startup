// v9: the "In-app sounds" choice, kept on this phone (it is about this phone's speaker, not the
// account). Read once at start; the Settings switch writes it. The silent switch always wins anyway.
import { setSoundsOn, warmFeedback } from '@pohnch/ui/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pohnch.sounds.v1';

export async function startSounds(): Promise<boolean> {
  const on = (await AsyncStorage.getItem(KEY).catch(() => null)) !== 'off';
  setSoundsOn(on);
  if (on) warmFeedback();
  return on;
}

export async function saveSounds(on: boolean): Promise<void> {
  setSoundsOn(on);
  if (on) warmFeedback();
  await AsyncStorage.setItem(KEY, on ? 'on' : 'off').catch(() => undefined);
}
