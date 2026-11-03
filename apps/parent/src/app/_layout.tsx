// The root of the parent app: loads the three fonts, keeps the splash up until they're ready,
// and wraps every screen in the language switch (Urdu by default).
import { Gulzar_400Regular } from '@expo-google-fonts/gulzar';
import { Manrope_500Medium, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { NotoSansArabic_500Medium, NotoSansArabic_700Bold } from '@expo-google-fonts/noto-sans-arabic';
import { useSession } from '@pohnch/client';
import { LangProvider } from '@pohnch/ui';
import { LaunchReveal, useScreenOptions } from '@pohnch/ui/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ParentProvider } from '../state/ParentStore';
import { TripNotifications } from '../notifications/TripNotifications';
import { rememberInvite, takeInvite } from '../state/pendingInvite';
import '../notifications/liveTask'; // defines the Android live-notification task at start-up

SplashScreen.preventAutoHideAsync();

// Sends a logged-out person to /login and a logged-in one away from it. The gallery stays open for
// development. Without Supabase settings (before the account exists) there is no login at all.
function AuthGate({ ready, signedIn, configured }: { ready: boolean; signedIn: boolean; configured: boolean }) {
  const segments = useSegments();
  useEffect(() => {
    if (!ready || !configured) return;
    const here = segments[0] as string | undefined;
    const linkToken = (segments as string[])[1];
    if (!signedIn && here === 'i' && typeof linkToken === 'string') rememberInvite(linkToken);
    if (!signedIn && here !== 'login' && here !== 'welcome' && here !== 'gallery') router.replace('/login');
    if (signedIn && here === 'login') {
      const token = takeInvite();
      router.replace(token ? { pathname: '/i/[token]', params: { token } } : '/');
    }
  }, [ready, signedIn, configured, segments]);
  return null;
}

// The screens, with the push animation that follows the reading direction.
function Screens() {
  const options = useScreenOptions();
  return <Stack screenOptions={options} />;
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
          <ParentProvider key={session?.user.id ?? 'out'} enabled={configured && !!session}>
            <Screens />
            <TripNotifications signedIn={configured && !!session} />
          </ParentProvider>
          <AuthGate ready={ready} signedIn={!!session} configured={configured} />
          <LaunchReveal />
        </LangProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
