// The menu (v8; v10 canvas "Z10P-Menu"): everything that isn't the map. Children stand in a row of
// arch portraits; family and "more" are soft groups (rows separated by space, never lines).
// - Children: tap one to change their name, school or home pin, or remove them (child.tsx).
// - Family: who else follows the children, by name only (never phone numbers). The owner can add
//   up to 3 people and remove them; someone who was added can leave.
// - More: notification settings, opening a driver's link, help (WhatsApp and the privacy policy).
// - Deleting the account: a sheet that says what goes, then a hold to confirm.
// Data: family members come from my_family_members (a database function that shows only my families);
// adding, removing and deleting go through the "app" Edge Function, which checks who is asking.
import { deleteMyAccount, parent } from '@pohnch/client';
import { ApiError, normalisePkMobile, PILOT_WHATSAPP } from '@pohnch/core';
import { childColors, colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, ArchAvatar, ArchShape, EditSheet, Group, GroupRow, Icon, Niche, PressableScale, RowIcon, SectionCaption, Shimmer, TapButton, TextField, useArchWipe, type IconName } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';
import { useStage2 } from '../state/stage2';

const layout = LinearTransition.springify().damping(24).stiffness(200);
const PRIVACY_URL = 'https://pohnch.pk/privacy';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} layout={layout} style={{ gap: space.sm }}>
      <SectionCaption>{title}</SectionCaption>
      {children}
    </Animated.View>
  );
}

/** Portrait size: three fit across a 360-wide phone; more scroll. */
const TILE = 100;
const TILE_H = 122;



/** A child as a carved niche (v11): the initial in the child's colour, set back in a lit arch; tapping
 * opens the child's page through an arch of light (useArchWipe). */
function ChildPortrait({ name, line, index, onPress, testID }: { id: string; name: string; line?: string; index: number; onPress: () => void; testID?: string }) {
  const wipe = useArchWipe();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const c = childColors(index);
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={line ? `${name}, ${line}` : name} scaleTo="big" tilt testID={testID} onPress={() => wipe.open(ref.current, onPress)}>
      <View ref={ref} collapsable={false} style={{ width: TILE, alignItems: 'center', gap: 4 }}>
        <Niche letter={name.slice(0, 1)} fill={c.fill} ink={c.ink} width={TILE} height={TILE_H} delay={index * 900} />
        <AppText bold style={{ fontSize: 17, marginTop: 4 }} numberOfLines={1}>{name}</AppText>
        {line ? <AppText variant="small" color={colors.ink2} numberOfLines={1} style={{ marginTop: -4, maxWidth: TILE }}>{line}</AppText> : null}
      </View>
    </PressableScale>
  );
}

function AddPortrait({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} scaleTo="big" onPress={onPress} testID={testID}>
      <View style={{ width: TILE, alignItems: 'center', gap: 4 }}>
        <ArchShape width={TILE} height={TILE_H} color={colors.inset}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: TILE_H * 0.42, alignItems: 'center' }}>
            <Icon name="plus" size={30} color={colors.link} strokeWidth={2.6} />
          </View>
        </ArchShape>
        <AppText bold color={colors.link} align="center" style={{ fontSize: 15 }} numberOfLines={2}>{label}</AppText>
      </View>
    </PressableScale>
  );
}

/** One row of a group (thin wrapper so every row reads the same). */
function MenuRow({ mark, icon, iconTint, title, line, end, onPress, testID }: {
  mark?: string; icon?: IconName; iconTint?: { tint: string; ink: string }; title: string; line?: string; end?: ReactNode; onPress?: () => void; testID?: string;
}) {
  const lead = mark ? <ArchAvatar letter={mark} size={40} color={colors.neelTint} ink={colors.link} /> : icon ? <RowIcon name={icon} tint={iconTint?.tint} ink={iconTint?.ink} /> : null;
  return <GroupRow title={title} sub={line} lead={lead} trail={end ?? (onPress ? 'chevron' : undefined)} onPress={onPress} testID={testID} accessibilityLabel={line ? `${title}, ${line}` : title} />;
}

export default function Menu() {
  const { t, dir } = useLang();
  const p = useParent();
  // In Urdu the row reads from the right: start scrolled to its end.
  // v10 stage 2: shown only once the Pohnch team switches it on (off until gate 1).
  const s2 = useStage2();
  const strip = useRef<ComponentRef<typeof ScrollView>>(null);
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
    // v21: a mobile number, or the Gmail of someone who signs in with Google
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phone.trim());
    if (!isEmail && !normalisePkMobile(phone)) return setMsg({ ok: false, text: t('parent.family.badWho') });
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
        <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={() => dir === 'rtl' && strip.current?.scrollToEnd({ animated: false })} contentContainerStyle={{ gap: 12, paddingHorizontal: 4, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexGrow: 1 }}>
          {p.children.map((c, i) => (
            <ChildPortrait key={c.id} id={c.id} name={c.first_name} line={c.school_name} index={i} onPress={() => router.push({ pathname: '/child', params: { id: c.id } })} testID={`menu-child-${i}`} />
          ))}
          <AddPortrait label={t('parent.addChild')} onPress={() => router.push('/child')} testID="menu-add-child" />
        </ScrollView>
        {p.children.length > 1 ? (
          <Group>
            <MenuRow icon="family" iconTint={{ tint: colors.zamurradTint, ink: colors.zamurradOnTint }} title={t('kids.title')} line={t('kids.line')} onPress={() => router.push('/kids')} testID="open-kids" />
          </Group>
        ) : null}
      </Section>

      <Section title={members ? t('parent.menu.family', { n: family.length }) : t('parent.family.title')}>
        {!members ? (
          <Shimmer lines={[{ w: '100%', h: 52 }, { w: '100%', h: 52 }]} />
        ) : (
          <Animated.View entering={FadeIn.duration(250)}>
            <Group>
              {family.map((m) => (
                <MenuRow key={m.user_id} mark={m.display_name.slice(0, 1)} title={m.is_me ? t('parent.menu.you') : m.display_name}
                  line={m.is_me ? t('parent.menu.thisPhone') : m.is_owner ? t('parent.menu.owner') : undefined}
                  end={(iOwn && !m.is_me) || (m.is_me && !m.is_owner) ? (
                    <PressableScale accessibilityRole="button" accessibilityLabel={m.is_me ? t('parent.menu.leave') : `${t('parent.menu.remove')} ${m.display_name}`} onPress={() => setSheet({ remove: m })} scaleTo="chip" testID={`member-remove-${m.is_me ? 'me' : m.display_name}`}
                      faceStyle={{ height: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.inset, justifyContent: 'center' }}>
                      <AppText bold style={{ fontSize: 15 }}>{m.is_me ? t('parent.menu.leave') : t('parent.menu.remove')}</AppText>
                    </PressableScale>
                  ) : undefined} />
              ))}
              {iOwn && family.length < 4 ? <MenuRow icon="family" iconTint={{ tint: colors.inset, ink: colors.link }} title={t('parent.menu.addPerson')} line={t('parent.menu.addPersonLine')} onPress={() => { setMsg(null); setSheet('add'); }} testID="menu-add-person" /> : null}
            </Group>
          </Animated.View>
        )}
      </Section>

      {/* v21: everything about vans in one place (join another van; with stage 2, find, request, Live, fees). */}
      <Section title={t('parent.menu.van')}>
        <Group foil>
          <MenuRow icon="route" title={t('parent.join')} onPress={() => router.push('/join')} testID="menu-join" />
          {s2 ? (
            <>
              <MenuRow icon="star" iconTint={{ tint: colors.kesarTint, ink: colors.onKesar }} title={t('s2.live.title')} line={t('s2.live.free')} onPress={() => router.push('/plans')} testID="menu-live" />
              <MenuRow icon="search" title={t('s2.find.title')} onPress={() => router.push('/find')} testID="menu-find" />
              <MenuRow icon="plus" title={t('s2.req.title')} onPress={() => router.push('/request')} testID="menu-request" />
              {p.membership?.status === 'approved' ? <MenuRow icon="wallet" iconTint={{ tint: colors.zamurradTint, ink: colors.zamurradOnTint }} title={t('s2.fees.title')} onPress={() => router.push('/fees')} testID="menu-fees" /> : null}
            </>
          ) : null}
        </Group>
      </Section>

      <Section title={t('parent.menu.more')}>
        <Group>
          <MenuRow icon="bell" title={t('parent.notifications')} line={t('parent.menu.notificationsLine')} onPress={() => router.push('/settings')} testID="open-settings" />
          <MenuRow icon="phone" iconTint={{ tint: colors.kesarTint, ink: colors.onKesar }} title={t('parent.menu.help')} line={t('parent.menu.helpLine', { phone: PILOT_WHATSAPP.display })} onPress={() => setSheet('help')} testID="menu-help" />
        </Group>
      </Section>

      {msg && sheet === null ? <AppText color={msg.ok ? colors.zamurradOnTint : colors.dangerText}>{msg.text}</AppText> : null}

      <PressableScale accessibilityRole="button" onPress={() => { setDeleteError(null); setSheet('delete'); }} testID="menu-delete" faceStyle={{ minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
        <AppText bold color={colors.dangerText}>{t('parent.menu.delete')}</AppText>
      </PressableScale>

      {/* Add someone to the family */}
      <EditSheet visible={sheet === 'add'} title={t('parent.menu.addPerson')} onClose={() => setSheet(null)} testID="add-person-sheet">
        <AppText variant="secondary">{t('parent.family.body')}</AppText>
        <TextField label={t('parent.family.phone')} value={phone} onChange={setPhone} ltr maxLength={254} placeholder={t('parent.family.phoneHint')} testID="family-phone" />
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
