// A plain page for the parent app's forms: back, title, language switch, then the content.
import { colors, shadow, space, useLang } from '@pohnch/ui';
import { AppText, Icon, LangSwitch, PressableScale } from '@pohnch/ui/native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Page({ title, children }: { title: string; children: ReactNode }) {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee, paddingTop: insets.top + space.sm }}>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingBottom: space.md }}>
        <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} scaleTo="chip" hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          faceStyle={{ width: 48, height: 48, borderRadius: 24, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, boxShadow: shadow.float }}>
          <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}>
            <Icon name="arrow" size={22} color={colors.siyahi} />
          </View>
        </PressableScale>
        <View style={{ flex: 1 }}>
          <AppText variant="title" style={{ fontSize: 24 }}>{title}</AppText>
        </View>
        <LangSwitch />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + 48, gap: space.lg }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}
