// Expo config for the parent app "Pohnch". The Google Maps key comes from the environment (.env or EAS secrets), never from git.
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pohnch',
  slug: 'pohonch', // the Expo project's address (expo.dev/@pohonch/pohonch); the name people see stays "Pohnch"
  owner: 'pohonch',
  scheme: 'pohnch',
  version: '0.1.0',
  orientation: 'portrait',
  // Over-the-air updates (v8): JavaScript and design fixes reach installed phones without a new build.
  // Builds only take updates made for the same app version; each EAS build profile has its own channel.
  runtimeVersion: { policy: 'appVersion' },
  updates: { url: 'https://u.expo.dev/db3b3849-7d63-4270-bd90-56aafac77e94', checkAutomatically: 'ON_LOAD', fallbackToCacheTimeout: 0 },
  icon: './assets/icon.png',
  // v8: follows the phone's light or dark setting (the driver app stays light).
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'pk.pohnch.parent',
    supportsTablet: false,
    // Driver invite links (pohnch.pk/i/...) open the app. The website serves the matching file in B7.
    associatedDomains: ['applinks:pohnch.pk'],
    infoPlist: { NSSupportsLiveActivities: true },
  },
  android: {
    package: 'pk.pohnch.parent',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'pohnch.pk', pathPrefix: '/i/' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    adaptiveIcon: {
      backgroundColor: '#1F2A5C',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    // The parent app never asks for location (CLAUDE.md): block the permission even if a library adds it.
    blockedPermissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_BACKGROUND_LOCATION'],
  },
  web: { favicon: './assets/favicon.png', output: 'single' },
  plugins: [
    'expo-router',
    'expo-font',
    // The map: MapLibre with free OpenFreeMap tiles (no Google key needed).
    '@maplibre/maplibre-react-native',
    ['expo-notifications', { color: '#1F2A5C', defaultChannel: 'step-left', icon: './assets/android-icon-monochrome.png', sounds: ['left', 'arriving', 'picked', 'reached_school', 'left_school', 'dropped', 'late'].map((s) => `./assets/sounds/a_${s}.wav`) }],
    // iPhone: the trip's Live Activity (src/widgets/VanActivity.tsx) and the home-screen widget.
    [
      'expo-widgets',
      {
        bundleIdentifier: 'pk.pohnch.parent.widgets',
        groupIdentifier: 'group.pk.pohnch.parent',
        // The server updates the Live Activity on a locked phone (ActivityKit push), about once a minute.
        enablePushNotifications: true,
        frequentUpdates: true,
        // Android: the home-screen widget (src/widgets/NextTripWidget.android.tsx).
        enableAndroid: true,
        widgets: [
          {
            name: 'NextTripWidget',
            displayName: 'Pohnch',
            description: 'Your van at a glance · وین ایک نظر میں',
            ios: {
              supportedFamilies: ['systemSmall', 'systemMedium', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'],
              initialLayout: 'src/widgets/NextTripWidget.tsx',
            },
            android: { minWidth: 150, minHeight: 150, targetCellWidth: 2, targetCellHeight: 2, resizeMode: 'both', initialLayout: 'src/widgets/NextTripWidget.android.tsx' },
          },
        ],
      },
    ],
    ['expo-splash-screen', { backgroundColor: '#1F2A5C', image: './assets/splash-icon.png', imageWidth: 180 }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: 'db3b3849-7d63-4270-bd90-56aafac77e94' },
  },
};

export default config;
