// Opened from a driver's link (pohnch.pk/i/<token> or pohnch://i/<token>): the join form, filled in.
// The token is only held in memory for this screen; it is never logged or stored.
import { useLang } from '@pohnch/ui';
import { useLocalSearchParams } from 'expo-router';
import { JoinForm } from '../../components/JoinForm';
import { Page } from '../../components/Page';

export default function JoinFromLink() {
  const { t } = useLang();
  const { token } = useLocalSearchParams<{ token: string }>();
  return (
    <Page title={t('parent.join.title')}>
      <JoinForm initialToken={typeof token === 'string' ? token : undefined} />
    </Page>
  );
}
