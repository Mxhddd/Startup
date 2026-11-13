// iPhone and the browser preview: the driver's live notification is Android-only.
export type TripLiveProps = { run: string; count: string; next: string; progress: number };

export async function showTripLive(_props: TripLiveProps) {}
export async function clearTripLive() {}
