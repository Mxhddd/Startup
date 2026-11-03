// Crash reports (Sentry), v8. Off unless EXPO_PUBLIC_SENTRY_DSN is set for the build (it is a public
// address, not a secret), and never in development. Every report goes through scrubEvent first
// (packages/core/src/scrub.ts): no user, no phone numbers, tokens, places or names; no screenshots.
// scripts/check-leaks.mjs refuses a Sentry.init without these settings.
import { scrubEvent } from '@pohnch/core';
import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const crashReportsOn = !!dsn && !__DEV__;

if (crashReportsOn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    beforeBreadcrumb: (b) => (b.category === 'navigation' ? b : null),
    beforeSend: (event) => scrubEvent(event as unknown as Record<string, unknown>) as unknown as typeof event,
  });
}

/** Wraps the app's root so a crash is reported (when reports are on). */
export function withCrashReports<P extends object>(Root: ComponentType<P>): ComponentType<P> {
  return crashReportsOn ? (Sentry.wrap(Root as ComponentType<Record<string, unknown>>) as unknown as ComponentType<P>) : Root;
}
