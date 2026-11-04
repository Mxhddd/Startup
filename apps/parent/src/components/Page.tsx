// A parent page (v10 "Jharoka"): the arch header (neel, our star pattern, a big Gulzar title, the page
// rising into it at the centre), then the content on ghee. The header scrolls away with the content.
import { colors, space } from '@pohnch/ui';
import { ArchHeader } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Page({ title, sub, accent, children }: { title: string; sub?: string | null; accent?: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">
        <ArchHeader title={title} sub={sub} accent={accent} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={{ paddingHorizontal: 18, paddingTop: space.sm, gap: space.lg }}>{children}</View>
      </ScrollView>
    </View>
  );
}
