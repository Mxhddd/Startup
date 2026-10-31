// A plain driver screen: back, title, language switch, then the content. High contrast, no frames.
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, Icon, LangSwitch } from '@pohnch/ui/native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Screen({ title, children, back = true, scroll = true, footer }: { title: string; children: ReactNode; back?: boolean; scroll?: boolean; footer?: ReactNode }) {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const body = <View style={{ gap: space.lg, paddingBottom: space.xxl }}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee, paddingTop: insets.top + space.sm }}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingBottom: space.md }}>
        {back ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={8}
            style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }}>
            <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}>
              <Icon name="arrow" size={22} color={colors.siyahi} />
            </View>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="title">{title}</AppText>
        </View>
        <LangSwitch />
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + 140 }} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space.xl }}>{body}</View>
      )}
      {footer ? <View style={{ position: 'absolute', left: space.xl, right: space.xl, bottom: insets.bottom + space.lg, gap: space.md }}>{footer}</View> : null}
    </View>
  );
}
