// Join a van with a driver's link: the link (pasted, or opened from WhatsApp) and which child.
import { parent } from '@pohnch/client';
import { ApiError, tokenFromInviteLink } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, TapButton, TextField } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useParent } from '../state/ParentStore';

export function JoinForm({ initialToken }: { initialToken?: string }) {
  const { t, dir } = useLang();
  const p = useParent();
  const [link, setLink] = useState(initialToken ? `https://pohnch.pk/i/${initialToken}` : '');
  const [childId, setChildId] = useState<string | null>(p.child?.id ?? null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const token = tokenFromInviteLink(link);
    if (!token) return setMsg({ ok: false, text: t('parent.join.bad') });
    if (!childId) return router.push('/child');
    setBusy(true);
    try {
      await parent.parentApi.joinVan(token, childId);
      await p.actions.refresh();
      setMsg({ ok: true, text: t('parent.join.done') });
      setTimeout(() => router.replace('/'), 800);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError && e.code === 'invite_invalid' ? t('parent.join.bad') : t('error.generic') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: space.lg }}>
      <TextField label={t('parent.join.paste')} value={link} onChange={setLink} ltr maxLength={300} testID="join-link" />
      {p.children.length > 0 ? (
        <View style={{ gap: 6 }}>
          <AppText variant="small" bold color={colors.ink2}>{t('parent.join.which')}</AppText>
          <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
            {p.children.map((c) => (
              <Pressable key={c.id} accessibilityRole="radio" accessibilityState={{ selected: c.id === childId }} onPress={() => setChildId(c.id)}
                style={{ minHeight: 48, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', borderWidth: 2, borderColor: colors.siyahi, backgroundColor: c.id === childId ? colors.siyahi : colors.white }}>
                <AppText bold color={c.id === childId ? colors.ghee : colors.siyahi}>{c.first_name}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <TapButton label={t('parent.addChild')} onConfirm={() => router.push('/child')} />
      )}
      {msg ? <AppText color={msg.ok ? colors.zamurradOnTint : colors.dangerText}>{msg.text}</AppText> : null}
      <TapButton size="next" tone="left" label={t('parent.join.send')} disabled={busy} onConfirm={send} testID="join-send" />
    </View>
  );
}
