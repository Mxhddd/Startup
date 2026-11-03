// The menu (v8, canvas "Z8P-Settings"): everything that isn't the map, in quiet rows.
// - Children: tap one to change their name, school or home pin, or remove them (child.tsx).
// - Family: who else follows the children, by name only (never phone numbers). The owner can add
//   up to 3 people and remove them; someone who was added can leave.
// - More: notification settings, opening a driver's link, help (WhatsApp and the privacy policy).
// - Deleting the account: a sheet that says what goes, then a hold to confirm.
// Data: family members come from my_family_members (a database function that shows only my families);
// adding, removing and deleting go through the "app" Edge Function, which checks who is asking.
import { deleteMyAccount, parent } from '@pohnch/client';
import { ApiError, normalisePkMobile, PILOT_WHATSAPP } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, EditSheet, Icon, PressableScale, Shimmer, TapButton, TextField, type IconName } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

const layout = LinearTransition.springify().damping(24).stiffness(200);
const PRIVACY_URL = 'https://pohnch.pk/privacy';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(22)} layout={layout} style={{ gap: 2 }}>
      <AppText bold color={colors.ink2} style={{ fontSize: 14, marginBottom: 4 }}>{title}</AppText>
      {children}
    </Animated.View>
  );
}

/** One quiet row: a round mark, a title and a line, and what happens on the far side. */
function MenuRow({ mark, icon, title, line, end, onPress, last = false, testID }: {
  mark?: string; icon?: IconName; title: string; line?: string; end?: ReactNode; onPress?: () => void; last?: boolean; testID?: string;
}) {
  const { dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const body = (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderColor: colors.hairline }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, borderCurve: 'continuous', backgroundColor: mark ? colors.kesar : colors.neelTint, alignItems: 'center', justifyContent: 'center' }}>
        {mark ? <AppText bold color={colors.siyahi} style={{ fontSize: 17 }}>{mark}</AppText> : icon ? <Icon name={icon} size={20} color={colors.neel} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText bold style={{ fontSize: 17 }} numberOfLines={1}>{title}</AppText>
        {line ? <AppText variant="small" color={colors.ink2} numberOfLines={1}>{line}</AppText> : null}
      </View>
      {end ?? (onPress ? <View style={{ transform: [{ scaleX: dir === 'rtl' ? -1 : 1 }] }}><Icon name="arrow" size={18} color={colors.ink2} /></View> : null)}
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={line ? `${title}, ${line}` : title} onPress={onPress} scaleTo="big" testID={testID}>
      {body}
    </PressableScale>
  );
}

export default function Menu() {
  const { t } = useLang();
  const p = useParent();
  const [members, setMembers] = useState<parent.FamilyMember[] | null>(null);
  const [sheet, setSheet] = useState<'add' | 'help' | 'delete' | { remove: parent.FamilyMember } | null>(null);
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadMembers = useCallback(() => {
    parent.familyMembers().then(setMembers).catch(() => setMembers([]));
  }, []);
  useEffect(loadMembers, [loadMembers]);

  const me = members?.find((m) => m.is_me);
  const myFamily = members?.find((m) => m.is_me && m.is_owner)?.family_id ?? me?.family_id ?? null;
  const family = (members ?? []).filter((m) => m.family_id === myFamily);
  const iOwn = !!members?.some((m) => m.is_me && m.is_owner && m.family_id === myFamily);

  const add = async () => {
    if (!normalisePkMobile(phone)) return setMsg({ ok: false, text: t('error.phone') });
    try {
      await parent.parentApi.addFamilyMember(phone);
      setPhone('');
      setMsg({ ok: true, text: t('parent.family.added') });
      loadMembers();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setMsg({ ok: false, text: code === 'user_not_found' ? t('parent.family.notFound') : code === 'family_full' ? t('parent.family.full') : t('error.generic') });
    }
  };

  const remove = async (m: parent.FamilyMember) => {
    setSheet(null);
    try {
      await parent.parentApi.removeFamilyMember(m.family_id, m.user_id);
      if (m.is_me) {
        // Left someone else's family: their children are no longer mine to see.
        await p.actions.refresh();
        router.replace('/');
        return;
      }
      loadMembers();
    } catch {
      setMsg({ ok: false, text: t('error.generic') });
    }
  };

  const deleteAccount = async () => {
    setDeleteError(null);
    try {
      await deleteMyAccount();
      router.replace('/login');
    } catch {
      setDeleteError(t('error.generic'));
    }
  };

  return (
    <Page title={t('parent.menu')}>
      <Section title={t('parent.menu.children')}>
        {p.children.map((c, i) => (
          <MenuRow key={c.id} mark={c.first_name.slice(0, 1)} title={c.first_name} line={c.school_name} onPress={() => router.push({ pathname: '/child', params: { id: c.id } })} testID={`menu-child-${i}`} />
        ))}
        <MenuRow icon="plus" title={t('parent.addChild')} onPress={() => router.push('/child')} last testID="menu-add-child" />
      </Section>

      <Section title={members ? t('parent.menu.family', { n: family.length }) : t('parent.family.title')}>
        {!members ? (
          <Shimmer lines={[{ w: '100%', h: 52 }, { w: '100%', h: 52 }]} />
        ) : (
          <Animated.View entering={FadeIn.duration(250)}>
            {family.map((m) => (
              <MenuRow key={m.user_id} mark={m.display_name.slice(0, 1)} title={m.is_me ? t('parent.menu.you') : m.display_name}
                line={m.is_me ? t('parent.menu.thisPhone') : m.is_owner ? t('parent.menu.owner') : undefined}
                end={(iOwn && !m.is_me) || (m.is_me && !m.is_owner) ? (
                  <PressableScale accessibilityRole="button" accessibilityLabel={m.is_me ? t('parent.menu.leave') : `${t('parent.menu.remove')} ${m.display_name}`} onPress={() => setSheet({ remove: m })} scaleTo="chip" testID={`member-remove-${m.is_me ? 'me' : m.display_name}`}
                    faceStyle={{ height: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.sand, justifyContent: 'center' }}>
                    <AppText bold style={{ fontSize: 15 }}>{m.is_me ? t('parent.menu.leave') : t('parent.menu.remove')}</AppText>
                  </PressableScale>
                ) : undefined} />
            ))}
            {iOwn && family.length < 4 ? <MenuRow icon="family" title={t('parent.menu.addPerson')} line={t('parent.menu.addPersonLine')} onPress={() => { setMsg(null); setSheet('add'); }} last testID="menu-add-person" /> : null}
          </Animated.View>
        )}
      </Section>

      <Section title={t('parent.menu.more')}>
        <MenuRow icon="bell" title={t('parent.notifications')} line={t('parent.menu.notificationsLine')} onPress={() => router.push('/settings')} testID="open-settings" />
        <MenuRow icon="route" title={t('parent.join')} onPress={() => router.push('/join')} />
        <MenuRow icon="phone" title={t('parent.menu.help')} line={t('parent.menu.helpLine', { phone: PILOT_WHATSAPP.display })} onPress={() => setSheet('help')} last testID="menu-help" />
      </Section>

      {msg && sheet === null ? <AppText color={msg.ok ? colors.zamurradOnTint : colors.dangerText}>{msg.text}</AppText> : null}

      <PressableScale accessibilityRole="button" onPress={() => { setDeleteError(null); setSheet('delete'); }} testID="menu-delete" faceStyle={{ minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
        <AppText bold color={colors.dangerText}>{t('parent.menu.delete')}</AppText>
      </PressableScale>

      {/* Add someone to the family */}
      <EditSheet visible={sheet === 'add'} title={t('parent.menu.addPerson')} onClose={() => setSheet(null)} testID="add-person-sheet">
        <AppText variant="secondary">{t('parent.family.body')}</AppText>
        <TextField label={t('parent.family.phone')} value={phone} onChange={setPhone} ltr maxLength={16} placeholder="03xx xxxxxxx" testID="family-phone" />
        {msg ? <AppText color={msg.ok ? colors.zamurradOnTint : colors.dangerText}>{msg.text}</AppText> : null}
        <TapButton size="next" tone="left" icon="family" label={t('parent.family.add')} onConfirm={add} testID="family-add" />
      </EditSheet>

      {/* Remove someone, or leave */}
      <EditSheet visible={typeof sheet === 'object' && sheet !== null} title={typeof sheet === 'object' && sheet?.remove.is_me ? t('parent.menu.leave') : t('parent.menu.removeTitle', { name: typeof sheet === 'object' && sheet ? sheet.remove.display_name : '' })} onClose={() => setSheet(null)} testID="remove-person-sheet">
        <AppText variant="secondary">{typeof sheet === 'object' && sheet?.remove.is_me ? t('parent.menu.leaveBody') : t('parent.menu.removeBody')}</AppText>
        <TapButton hold tone="quiet" label={typeof sheet === 'object' && sheet?.remove.is_me ? t('parent.menu.leave') : t('parent.menu.remove')} onConfirm={() => typeof sheet === 'object' && sheet && remove(sheet.remove)} testID="member-remove-confirm" />
      </EditSheet>

      {/* Help */}
      <EditSheet visible={sheet === 'help'} title={t('parent.menu.help')} onClose={() => setSheet(null)} testID="help-sheet">
        <AppText variant="secondary">{t('parent.menu.helpBody')}</AppText>
        <TapButton size="next" tone="picked" icon="phone" label={t('parent.menu.whatsapp', { phone: PILOT_WHATSAPP.display })} onConfirm={() => Linking.openURL(`https://wa.me/${PILOT_WHATSAPP.waNumber}`)} testID="help-whatsapp" />
        <TapButton tone="quiet" label={t('parent.menu.privacy')} onConfirm={() => Linking.openURL(PRIVACY_URL)} testID="help-privacy" />
      </EditSheet>

      {/* Delete the account */}
      <EditSheet visible={sheet === 'delete'} title={t('parent.menu.deleteTitle')} onClose={() => setSheet(null)} testID="delete-sheet">
        <AppText variant="secondary">{family.length > 1 && iOwn ? t('parent.menu.deleteBodyShared') : t('parent.menu.deleteBody')}</AppText>
        {deleteError ? <AppText color={colors.dangerText}>{deleteError}</AppText> : null}
        <TapButton hold tone="quiet" label={t('parent.menu.deleteConfirm')} onConfirm={deleteAccount} testID="delete-confirm" />
      </EditSheet>
    </Page>
  );
}
