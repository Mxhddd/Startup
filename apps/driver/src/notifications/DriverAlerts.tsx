// Mounts the driver's alert setup once signed in (registers this phone, opens Families from a request).
import { useLang } from '@pohnch/ui';
import { useDriverPush } from './push';

export function DriverAlerts({ signedIn }: { signedIn: boolean }) {
  const { t } = useLang();
  useDriverPush(signedIn, t('notify.channel.driver'));
  return null;
}
