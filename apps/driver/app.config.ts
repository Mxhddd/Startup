// Expo config for the driver app "Pohnch Driver". Background location is added in B4, and only runs during a trip.
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pohnch Driver',
  slug: 'pohnch-driver',
  scheme: 'pohnch-driver',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'pk.pohnch.driver',
    supportsTablet: false,
  },
  android: {
    package: 'pk.pohnch.driver',
    adaptiveIcon: {
      backgroundColor: '#141A33',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    config: {
      googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ?? '' },
    },
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    'expo-font',
    ['expo-splash-screen', { backgroundColor: '#141A33', image: './assets/splash-icon.png', imageWidth: 180 }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID_DRIVER },
  },
};

export default config;
