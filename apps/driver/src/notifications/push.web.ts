// The web preview has no push alerts.
export async function alertsAllowed(): Promise<'granted' | 'undecided' | 'denied'> {
  return 'denied';
}
export async function registerDriverPush(_channelName: string): Promise<boolean> {
  return false;
}
export async function askDriverAlerts(_channelName: string): Promise<boolean> {
  return false;
}
export function useDriverPush(_signedIn: boolean, _channelName: string) {}
