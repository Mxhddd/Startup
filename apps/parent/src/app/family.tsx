// Family: add up to 3 more people who see the same children and alerts; invite the driver; add a child.
import { parent } from '@pohnch/client';
import { ApiError, normalisePkMobile } from '@pohnch/core';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, TapButton, TextField } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useParent } from '../state/ParentStore';
import { useState } from 'react';
import { Page } from '../components/Page';

export default function Family() {
  const { t } = useLang();
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const p = useParent();

  const add = async () => {
    if (!normalisePkMobile(phone)) return setMsg({ ok: false, text: t('error.phone') });
    try {
      await parent.parentApi.addFamilyMember(phone);
      setPhone('');
      setMsg({ ok: true, text: t('parent.family.added') });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setMsg({ ok: false, text: code === 'user_not_found' ? t('parent.family.notFound') : code === 'family_full' ? t('parent.family.full') : t('error.generic') });
    }
  };

  return (
    <Page title={t('parent.family.title')}>
      <AppText variant="secondary">{t('parent.family.body')}</AppText>
      <TextField label={t('parent.family.phone')} value={phone} onChange={setPhone} ltr maxLength={16} placeholder="03xx xxxxxxx" testID="family-phone" />
      {msg ? <AppText color={msg.ok ? colors.zamurradOnTint : colors.dangerText}>{msg.text}</AppText> : null}
      <TapButton tone="left" label={t('parent.family.add')} onConfirm={add} testID="family-add" />
      <AppText variant="title" style={{ marginTop: space.lg }}>{t('parent.menu')}</AppText>
      <TapButton label={t('parent.addChild')} onConfirm={() => router.push('/child')} />
      <TapButton label={t('parent.join')} onConfirm={() => router.push('/join')} />
      {p.child && p.membership ? (
        <>
          <TapButton hold label={t('parent.family.leave', { name: p.child.first_name })} testID="leave-van"
            onConfirm={() => parent.parentApi.leaveVan(p.child!.id).then(p.actions.refresh).then(() => router.replace('/')).catch(() => setMsg({ ok: false, text: t('error.generic') }))} />
          <AppText variant="small" color={colors.ink2}>{t('parent.family.leaveHint')}</AppText>
        </>
      ) : null}
    </Page>
  );
}
