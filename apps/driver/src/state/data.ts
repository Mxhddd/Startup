// Re-exports the driver data functions, and the one function the offline queue uses to send.
import { driver } from '@pohnch/client';
export { driver };
export type { JoinRequest, Stop, Trip, Van } from '@pohnch/client';
export const driverApiQueueSend = (action: string, body: Record<string, unknown>) => driver.driverApi.send(action, body);
