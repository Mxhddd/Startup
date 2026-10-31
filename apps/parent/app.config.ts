// Expo config for the parent app "Pohnch". The Google Maps key comes from the environment (.env or EAS secrets), never from git.
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pohnch',
  slug: 'pohnch',
  scheme: 'pohnch',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'pk.pohnch.parent',
    supportsTablet: false,
  },
  android: {
    package: 'pk.pohnch.parent',
    adaptiveIcon: {
      backgroundColor: '#1F2A5C',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    config: {
      googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ?? '' },
    },
    // The parent app never asks for location (CLAUDE.md): block the permission even if a library adds it.
    blockedPermissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_BACKGROUND_LOCATION'],
  },
  web: { favicon: './assets/favicon.png', output: 'single' },
  plugins: [
    'expo-router',
    'expo-font',
    ['expo-splash-screen', { backgroundColor: '#1F2A5C', image: './assets/splash-icon.png', imageWidth: 180 }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID_PARENT },
  },
};

export default config;
