// The Android Live Update module (modules/pohnch-live, Kotlin), when this build has it. Older builds
// and the browser preview don't: callers then fall back to a plain ongoing notification.
import type { LiveCard } from '@pohnch/core';
import { requireOptionalNativeModule } from 'expo-modules-core';

type LiveModule = {
  show(card: LiveCard & { title: string; body: string }): void;
  clear(): void;
};

export const liveModule = requireOptionalNativeModule<LiveModule>('PohnchLive');
