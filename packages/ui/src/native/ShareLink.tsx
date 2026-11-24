// v24: an invite that always works. It shows the short code (to type in the app after installing) and
// gives three ways to send the link: copy it, WhatsApp, or the phone's share sheet where there is one.
// It never fails silently: if one way doesn't work the others are right there. The token appears only
// inside the pohnch.pk/i/ link itself (CLAUDE.md).
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, Platform, Share, View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';

export function ShareLink({ url, code, message, tone = 'dark', testID = 'share-link' }: { url: string; code: string; message: string; tone?: 'dark' | 'light'; testID?: string }) {
  const { t, dir } = useLang();
  const [copied, setCopied] = useState(false);
  const text = `${message}\n${url}`;
  const fg = tone === 'dark' ? colors.onBrand : colors.siyahi;
  const sub = tone === 'dark' ? colors.mutedOnDark : colors.siyahi;
  const canShare = Platform.OS !== 'web' || (typeof navigator !== 'undefined' && 'share' in navigator);
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the link is shown below; it can be selected by hand */
    }
  };
  const btn = (icon: 'share' | 'check' | 'phone', label: string, onPress: () => void, id: string) => (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} testID={`${testID}-${id}`} style={{ flex: 1 }}>
      <View style={{ minHeight: 56, borderRadius: radius.button, borderCurve: 'continuous', backgroundColor: id === 'whatsapp' ? '#1F8F57' : tone === 'dark' ? 'rgba(255,253,248,0.14)' : colors.inset, alignItems: 'center', justifyContent: 'center', flexDirection: row, gap: 8, paddingHorizontal: space.md }}>
        <Icon name={icon} size={20} color={id === 'whatsapp' ? '#FFFFFF' : fg} />
        <AppText bold color={id === 'whatsapp' ? '#FFFFFF' : fg} numberOfLines={1}>{label}</AppText>
      </View>
    </PressableScale>
  );

  return (
    <View testID={testID} style={{ gap: space.md }}>
      <View style={{ gap: 4 }}>
        <AppText variant="caption" color={sub}>{t('share.code')}</AppText>
        <AppText variant="title" color={fg} style={{ letterSpacing: 3, writingDirection: 'ltr', textAlign: dir === 'rtl' ? 'right' : 'left' }} testID={`${testID}-code`}>
          {code}
        </AppText>
      </View>
      <View style={{ flexDirection: row, gap: space.sm }}>
        {btn('phone', t('share.whatsapp'), () => { void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`); }, 'whatsapp')}
        {btn(copied ? 'check' : 'share', copied ? t('share.copied') : t('share.copy'), () => void copy(), 'copy')}
      </View>
      {canShare ? (
        <PressableScale onPress={() => { void Share.share({ message: text }).catch(() => undefined); }} accessibilityRole="button" accessibilityLabel={t('share.more')} testID={`${testID}-more`}>
          <View style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
            <AppText bold color={fg}>{t('share.more')}</AppText>
          </View>
        </PressableScale>
      ) : null}
      <AppText variant="caption" color={sub} numberOfLines={1} style={{ writingDirection: 'ltr' }}>{url}</AppText>
    </View>
  );
}
