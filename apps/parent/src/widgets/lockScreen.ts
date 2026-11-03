// Android and web: no Live Activity or iPhone widget (Android uses its live notification instead).
import type { NextTripProps } from './NextTripWidget';
import type { VanActivityProps } from './VanActivity';

export async function showLive(_props: VanActivityProps, _onActivityToken?: (token: string) => void) {}
export async function endLive(_final?: VanActivityProps) {}
export function watchStartToken(_onToken: (token: string) => void): () => void {
  return () => undefined;
}
export function updateWidget(_props: NextTripProps) {}
