// The root of the parent app: loads the three fonts, keeps the splash up until they're ready,
// and wraps every screen in the language switch (Urdu by default).
import { Gulzar_400Regular } from '@expo-google-fonts/gulzar';
import { Manrope_500Medium, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { NotoSansArabic_500Medium, NotoSansArabic_700Bold } from '@expo-google-fonts/noto-sans-arabic';
import { useSession } from '@pohnch/client';
import { LangProvider, applyColorScheme, colorScheme } from '@pohnch/ui';
import { loadTextSize } from '../textSize';
import { ArchWipeProvider, LaunchReveal, MorphProvider, setOrnament, useScreenOptions } from '@pohnch/ui/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ParentProvider } from '../state/ParentStore';
import { SyncNote } from '../components/SyncNote';
import { TripNotifications } from '../notifications/TripNotifications';
import { LocalAlerts } from '../notifications/LocalAlerts';
import { rememberInvite, takeInvite } from '../state/pendingInvite';
import { loadWelcomeSeen, welcomeSeen } from '../state/welcome';
import '../notifications/liveTask'; // defines the Android live-notification task at start-up

import { withCrashReports } from '../crash';
import { startSounds } from '../sounds';

SplashScreen.preventAutoHideAsync();
// v21: the parent app wears the website's truck-art cards (the driver app stays plain).
setOrnament(true);
// v9: load the in-app sounds (and the phone's sound setting) once, at start.
void startSounds();
// v12: big-text mode, if chosen.
void loadTextSize();

// Sends a logged-out person to /login and a logged-in one away from it. The gallery stays open for
// development. Without Supabase settings (before the account exists) there is no login at all.
function AuthGate({ ready, signedIn, configured }: { ready: boolean; signedIn: boolean; configured: boolean }) {
  const segments = useSegments();
  useEffect(() => {
    if (!ready || !configured) return;
    const here = segments[0] as string | undefined;
    const linkToken = (segments as string[])[1];
    if (!signedIn && here === 'i' && typeof linkToken === 'string') rememberInvite(linkToken);
    // v21: a new phone sees Welcome first, decided before the first frame (no Login flash).
    if (!signedIn && here !== 'login' && here !== 'welcome' && here !== 'gallery') router.replace(welcomeSeen() ? '/login' : '/welcome');
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

function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSansArabic_500Medium,
    NotoSansArabic_700Bold,
    Manrope_500Medium,
    Manrope_800ExtraBold,
    Gulzar_400Regular,
  });

  const { ready, session, configured } = useSession();
  // v8: follow the phone's light or dark setting. The palette switches in place before drawing; the
  // screens are drawn afresh when the phone switches (so every colour updates at once).
  const phoneScheme = useColorScheme();
  const scheme = phoneScheme === 'dark' ? 'dark' : 'light';
  if (colorScheme() !== scheme) applyColorScheme(scheme);
  const fontsDone = loaded || !!error;
  const [welcomeKnown, setWelcomeKnown] = useState(false);
  useEffect(() => {
    void loadWelcomeSeen().finally(() => setWelcomeKnown(true));
  }, []);

  useEffect(() => {
    // Hide the splash once fonts are in (the system font is a safe fallback) and we know who is logged in.
    if (fontsDone && ready && welcomeKnown) SplashScreen.hideAsync();
  }, [fontsDone, ready, welcomeKnown]);

  if (!fontsDone || !ready || !welcomeKnown) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LangProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <ParentProvider key={session?.user.id ?? 'out'} enabled={configured && !!session}>
            <MorphProvider>
              <ArchWipeProvider>
                <Fragment key={scheme}>
                  <Screens />
                </Fragment>
              </ArchWipeProvider>
            </MorphProvider>
            <SyncNote />
            <TripNotifications signedIn={configured && !!session} />
            <LocalAlerts signedIn={configured && !!session} />
          </ParentProvider>
          <AuthGate ready={ready} signedIn={!!session} configured={configured} />
          <LaunchReveal />
        </LangProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default withCrashReports(RootLayout);
