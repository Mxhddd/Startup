// Expo config for the parent app "Pohnch". The Google Maps key comes from the environment (.env or EAS secrets), never from git.
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pohnch',
  slug: 'pohonch', // the Expo project's address (expo.dev/@pohonch/pohonch); the name people see stays "Pohnch"
  owner: 'pohonch',
  scheme: 'pohnch',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
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
    ['expo-notifications', { color: '#1F2A5C', defaultChannel: 'trip', icon: './assets/android-icon-monochrome.png' }],
    // iPhone: the trip's Live Activity (src/widgets/VanActivity.tsx) and the home-screen widget.
    [
      'expo-widgets',
      {
        bundleIdentifier: 'pk.pohnch.parent.widgets',
        groupIdentifier: 'group.pk.pohnch.parent',
        widgets: [
          {
            name: 'NextTripWidget',
            displayName: 'Pohnch',
            description: 'Your van at a glance · وین ایک نظر میں',
            ios: { supportedFamilies: ['systemSmall', 'accessoryRectangular'], initialLayout: 'src/widgets/NextTripWidget.tsx' },
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
