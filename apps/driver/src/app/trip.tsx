// The running trip. Taps go through the offline queue; positions are sent by the trip-only location task.
import { useLang } from '@pohnch/ui';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { onTripFix, type Fix } from '../location/tripLocation';
import { RunScreen } from '../components/RunScreen';
import { useDriver } from '../state/DriverStore';

export default function Trip() {
  const { t } = useLang();
  const d = useDriver();
  const [fix, setFix] = useState<Fix | null>(null);
  useEffect(() => onTripFix(setFix), []);
  if (!d.running) return <Redirect href="/" />;
  const kind = d.running.kind;
  return (
    <RunScreen
      kind={kind}
      groups={d.run.groups}
      progress={d.progress}
      pending={d.pending}
      undo={d.undo}
      stops={d.stops}
      fix={fix}
      onTapStop={(g, text, only) => d.actions.tapStop(g, text, only)}
      onUndo={() => d.actions.undoLast()}
      onUndoExpire={() => d.actions.clearUndo()}
      onLate={(r) => d.actions.late(r)}
      onFinish={async (text) => {
        if (kind === 'morning') await d.actions.reachedSchool(text);
        await d.actions.endTrip();
      }}
      banner={d.running.is_practice ? t('driver.practice.note') : d.location === 'denied' || d.location === 'failed' ? t('location.off') : undefined}
    />
  );
}
