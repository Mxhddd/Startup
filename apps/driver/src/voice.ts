// Spoken prompts for the driver (v8), so they needn't look at the phone: the next stop as the van
// comes near it, and what was marked after each tap. Urdu or English, the app's language; if the
// phone has no voice for that language it simply stays quiet. A switch on the trip screen turns it off.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const KEY = 'pohnch.driver.voice.v1';

export async function voiceOn(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY).catch(() => null)) !== 'off';
}

export async function setVoiceOn(on: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, on ? 'on' : 'off').catch(() => undefined);
  if (!on) Speech.stop();
}

export function say(text: string, lang: 'ur' | 'en') {
  Speech.stop();
  Speech.speak(text, { language: lang === 'ur' ? 'ur-PK' : 'en-GB', rate: 0.95 });
}
