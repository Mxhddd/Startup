// Join a van (v9, step 3 of the first run): open the driver's link, or, if the driver isn't on Pohnch
// yet, send them an invite. The link from WhatsApp usually opens the join card directly (i/[token]).
import { parent } from '@pohnch/client';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, FlowSteps, Group, SectionCaption, ShareLink, TapButton } from '@pohnch/ui/native';
import { useState } from 'react';
import { View } from 'react-native';
import { JoinForm } from '../components/JoinForm';
import { Page } from '../components/Page';
import { useParent } from '../state/ParentStore';

export default function Join() {
  const { t } = useLang();
  const p = useParent();
  const [failed, setFailed] = useState(false);
  // v24: make the link and code once, then show them with Copy, WhatsApp and Share (works on the web too).
  const [link, setLink] = useState<{ url: string; code: string } | null>(null);
  const invite = async () => {
    if (!p.child) return;
    setFailed(false);
    try {
      setLink(await parent.parentApi.inviteDriver(p.child.id));
    } catch {
      setFailed(true);
    }
  };
  return (
    <Page title={t('parent.join.title')}>
      {!p.membership ? <FlowSteps step={3} total={3} label={t('parent.flow.label', { n: 3, of: 3 })} /> : null}
      <JoinForm />
      {p.child && !p.membership ? (
        <View style={{ gap: space.sm, marginTop: space.md }}>
          <SectionCaption>{t('parent.join.noLink')}</SectionCaption>
          <Group style={{ padding: space.lg, gap: space.md }}>
            <AppText variant="secondary">{t('parent.join.noLinkBody')}</AppText>
            {failed ? <AppText bold color={colors.dangerText}>{t('error.generic')}</AppText> : null}
            {link ? (
              <ShareLink url={link.url} code={link.code} message={t('parent.inviteDriver.message')} tone="light" testID="driver-invite" />
            ) : (
              <TapButton icon="share" label={t('parent.inviteDriver')} onConfirm={invite} testID="join-invite-driver" />
            )}
          </Group>
        </View>
      ) : null}
    </Page>
  );
}
