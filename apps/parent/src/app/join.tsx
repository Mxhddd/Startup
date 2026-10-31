import { useLang } from '@pohnch/ui';
import { JoinForm } from '../components/JoinForm';
import { Page } from '../components/Page';

export default function Join() {
  const { t } = useLang();
  return (
    <Page title={t('parent.join.title')}>
      <JoinForm />
    </Page>
  );
}
