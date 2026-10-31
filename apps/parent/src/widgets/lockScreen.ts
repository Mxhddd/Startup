// Android and web: no Live Activity or iPhone widget (Android uses the ongoing notification instead).
import type { NextTripProps } from './NextTripWidget';
import type { VanActivityProps } from './VanActivity';

export async function showLive(_props: VanActivityProps) {}
export async function endLive(_final?: VanActivityProps) {}
export function updateWidget(_props: NextTripProps) {}
