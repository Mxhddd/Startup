// The web preview has no crash reports.
import type { ComponentType } from 'react';
export const crashReportsOn = false;
export function withCrashReports<P extends object>(Root: ComponentType<P>): ComponentType<P> {
  return Root;
}
