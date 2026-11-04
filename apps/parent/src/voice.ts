// v12 "hear the ETA": tap the minutes and the phone says them aloud ("Ali's van is 6 minutes away"),
// in the app's language. If the phone has no voice for it, nothing happens.
import * as Speech from 'expo-speech';

export function sayAloud(text: string, lang: 'ur' | 'en') {
  Speech.stop();
  Speech.speak(text, { language: lang === 'ur' ? 'ur-PK' : 'en-GB', rate: 0.95 });
}
