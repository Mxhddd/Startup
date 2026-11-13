import AsyncStorage from '@react-native-async-storage/async-storage';

// The welcome screens are shown once per install, before the first login (app/welcome.tsx).
export const WELCOME_SEEN = 'pohnch.parent.welcome.v1';

// v21: read once at start-up (before the splash goes), so the first screen is decided before anything is
// drawn: Welcome on a new phone, Login after that. No more Login flashing up first.
let seen: boolean | null = null;
export async function loadWelcomeSeen(): Promise<boolean> {
  if (seen === null) seen = (await AsyncStorage.getItem(WELCOME_SEEN).catch(() => null)) === '1';
  return seen;
}
export const welcomeSeen = () => seen === true;
export function markWelcomeSeen() {
  seen = true;
  return AsyncStorage.setItem(WELCOME_SEEN, '1').catch(() => undefined);
}
