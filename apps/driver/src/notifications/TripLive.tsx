// Android: the driver's live trip notification (v7): the run and progress ("Morning trip · 3 of 6"),
// the next stop in big type, and a bar that fills as children are marked. Kept up to date by the trip
// screen; removed when the trip ends. Plain and high-contrast, like the driver app.
// Runs as a 'widget' layout (Jetpack Compose via @expo/ui): colours written here match theme.ts.
import { Column, LinearProgressIndicator, Row, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, height, weight } from '@expo/ui/jetpack-compose/modifiers';
import { createCustomNotification } from 'expo-widgets';

export type TripLiveProps = { run: string; count: string; next: string; progress: number };

const TripLive = (p: TripLiveProps) => {
  'widget';
  const neel = '#1F2A5C';
  const ink = '#141A33';
  return {
    collapsed: (
      <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
        <Text color={ink} maxLines={1} style={{ fontSize: 15, fontWeight: '800' }} modifiers={[weight(1)]}>
          {p.next}
        </Text>
        <Text color={neel} style={{ fontSize: 15, fontWeight: '800' }}>{p.count}</Text>
      </Row>
    ),
    expanded: (
      <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
        <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
          <Text color="#4A4F66" maxLines={1} style={{ fontSize: 14, fontWeight: '700' }} modifiers={[weight(1)]}>
            {p.run}
          </Text>
          <Text color={neel} style={{ fontSize: 16, fontWeight: '800' }}>{p.count}</Text>
        </Row>
        <Text color={ink} maxLines={1} style={{ fontSize: 22, fontWeight: '800' }}>
          {p.next}
        </Text>
        <LinearProgressIndicator progress={Math.max(0.02, Math.min(1, p.progress))} color={neel} trackColor="#E6E9F5" modifiers={[fillMaxWidth(), height(8)]} />
      </Column>
    ),
  };
};

export default createCustomNotification('TripLive', TripLive);
