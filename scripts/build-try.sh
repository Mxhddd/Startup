#!/usr/bin/env bash
# Builds the web copies of the two apps served at pohnch.pk/try/parent and pohnch.pk/try/driver, so anyone
# on the team can try them in a browser with no phone. Needs EXPO_PUBLIC_SUPABASE_URL and
# EXPO_PUBLIC_SUPABASE_ANON_KEY (the public key; never the service-role key). The web copies have no real
# map, push notifications or background location: those need the phone apps.
set -euo pipefail
cd "$(dirname "$0")/.."
for app in parent driver; do
  out="apps/web/public/try/$app"
  rm -rf "$out"
  (cd "apps/$app" && EXPO_WEB_BASE="/try/$app" npx expo export --platform web --output-dir "../web/public/try/$app")
  rm -f "$out/metadata.json"
done
# Skia's drawing engine; the apps ask for it at the site root.
cp -L node_modules/canvaskit-wasm/bin/full/canvaskit.wasm apps/web/public/canvaskit.wasm
echo "Built apps/web/public/try/{parent,driver}"
