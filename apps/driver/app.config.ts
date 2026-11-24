// Expo config for the driver app "Pohnch Driver". Background location is added in B4, and only runs during a trip.
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pohnch Driver',
  slug: 'pohnch-driver',
  owner: 'pohonch',
  scheme: 'pohnch-driver',
  version: '1.0.0',
  orientation: 'portrait',
  // Over-the-air updates (v8): JavaScript and design fixes reach installed phones without a new build.
  // Builds only take updates made for the same app version; each EAS build profile has its own channel.
  runtimeVersion: { policy: 'appVersion' },
  updates: { url: 'https://u.expo.dev/906c7599-1e80-42a2-bbbc-bf3f414409fd', checkAutomatically: 'ON_LOAD', fallbackToCacheTimeout: 0 },
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
    // The tilt effect uses device motion only; expo-sensors also declares step counting, which this app never does (Google Play would ask for a health declaration).
    blockedPermissions: ['android.permission.ACTIVITY_RECOGNITION'],
    adaptiveIcon: {
      backgroundColor: '#141A33',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: { favicon: './assets/favicon.png', output: 'single' },
  plugins: [
    // Keeps the Android build within EAS's memory (phones' CPU types only, two workers).
    '../../scripts/expo/withLeanGradle',
    'expo-router',
    'expo-font',
    // v9: alerts for the driver (a family asks to join; the van is verified).
    ['expo-notifications', { color: '#1F2A5C', defaultChannel: 'driver', icon: './assets/android-icon-monochrome.png' }],
    // The map: MapLibre with free OpenFreeMap tiles (no Google key needed).
    '@maplibre/maplibre-react-native',
    // v24: photos of the driver's papers for verification (CNIC, licence, van registration).
    ['expo-image-picker', {
      photosPermission: 'Pohnch uses the photos you choose of your CNIC, licence and van papers, for the team to verify your van. پہنچ آپ کے منتخب کردہ کاغذات کی تصویریں وین کی تصدیق کے لیے استعمال کرتا ہے۔',
      cameraPermission: 'Take a photo of your CNIC, licence or van papers for the Pohnch team to verify your van. وین کی تصدیق کے لیے کاغذات کی تصویر کھینچیں۔',
      microphonePermission: false,
    }],
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
  // EXPO_WEB_BASE: the web copy served at pohnch.pk/try/<app> (scripts/build-try.sh) lives under that path.
  experiments: { typedRoutes: true, ...(process.env.EXPO_WEB_BASE ? { baseUrl: process.env.EXPO_WEB_BASE } : {}) },
  extra: {
    eas: { projectId: '906c7599-1e80-42a2-bbbc-bf3f414409fd' },
  },
};

export default config;
