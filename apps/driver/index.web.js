// The app's entry in a browser (the design preview): Skia draws with CanvasKit, which has to load
// before any Skia component is imported. canvaskit.wasm is copied next to the exported page.
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: (file) => `/${file}` })
  .catch(() => undefined)
  // A plain require (not import()), so the app is in the same bundle but only runs once Skia is ready.
  .then(() => require('expo-router/entry'));
