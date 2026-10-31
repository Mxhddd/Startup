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
    infoPlist: {
      UIBackgroundModes: ['location'],
    },
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
  web: { favicon: './assets/favicon.png', output: 'single' },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-location',
      {
        // Shown by the phone when it asks. Location is used only during a trip.
        locationWhenInUsePermission: 'Pohnch shares the van’s location with its families only while a trip is running. پہنچ صرف سفر کے دوران وین کی جگہ اس کے خاندانوں کو دکھاتا ہے۔',
        locationAlwaysAndWhenInUsePermission: 'So families see the van with your screen off, Pohnch needs location during trips. It stops when the trip ends. سفر ختم ہوتے ہی لوکیشن بند ہو جاتی ہے۔',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    ['expo-splash-screen', { backgroundColor: '#141A33', image: './assets/splash-icon.png', imageWidth: 180 }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID_DRIVER },
  },
};

export default config;
