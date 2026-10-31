// The root of the parent app: loads the three fonts, keeps the splash up until they're ready,
// and wraps every screen in the language switch (Urdu by default).
import { Gulzar_400Regular } from '@expo-google-fonts/gulzar';
import { Manrope_500Medium, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { NotoSansArabic_500Medium, NotoSansArabic_700Bold } from '@expo-google-fonts/noto-sans-arabic';
import { useSession } from '@pohnch/client';
import { LangProvider, colors } from '@pohnch/ui';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

// Sends a logged-out person to /login and a logged-in one away from it. The gallery stays open for
// development. Without Supabase settings (before the account exists) there is no login at all.
function AuthGate({ ready, signedIn, configured }: { ready: boolean; signedIn: boolean; configured: boolean }) {
  const segments = useSegments();
  useEffect(() => {
    if (!ready || !configured) return;
    const here = segments[0] as string | undefined;
    if (!signedIn && here !== 'login' && here !== 'gallery') router.replace('/login');
    if (signedIn && here === 'login') router.replace('/');
  }, [ready, signedIn, configured, segments]);
  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSansArabic_500Medium,
    NotoSansArabic_700Bold,
    Manrope_500Medium,
    Manrope_800ExtraBold,
    Gulzar_400Regular,
  });

  const { ready, session, configured } = useSession();
  const fontsDone = loaded || !!error;

  useEffect(() => {
    // Hide the splash once fonts are in (the system font is a safe fallback) and we know who is logged in.
    if (fontsDone && ready) SplashScreen.hideAsync();
  }, [fontsDone, ready]);

  if (!fontsDone || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LangProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ghee } }} />
          <AuthGate ready={ready} signedIn={!!session} configured={configured} />
        </LangProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
