// The apps' one connection to Supabase. The URL and the public (anon) key come from EXPO_PUBLIC_ settings;
// the anon key only works through row-level security. The login session lives in secure storage.
// If the settings are missing (before B0's Supabase account exists) backend is null and the apps
// open without login, so screens can still be built and tried.
import { chunkedStorage, createAppApi, type AppApi } from '@pohnch/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type Backend = { supabase: SupabaseClient; api: AppApi };

function make(): Backend | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  // Phones: the encrypted keychain. The browser preview (web) has no keychain, so it uses the browser's storage.
  const storage = Platform.OS === 'web' ? undefined : chunkedStorage({
    getItem: (k) => SecureStore.getItemAsync(k),
    setItem: (k, v) => SecureStore.setItemAsync(k, v),
    removeItem: (k) => SecureStore.deleteItemAsync(k),
  });
  const supabase = createClient(url, anonKey, {
    auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  const api = createAppApi({
    functionsUrl: `${url.replace(/\/$/, '')}/functions/v1`,
    getToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
  });
  return { supabase, api };
}

export const backend: Backend | null = make();
