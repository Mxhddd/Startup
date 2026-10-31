// Expo replaces process.env.EXPO_PUBLIC_* with their values when it builds the app.
declare const process: { env: { EXPO_PUBLIC_SUPABASE_URL?: string; EXPO_PUBLIC_SUPABASE_ANON_KEY?: string } };
