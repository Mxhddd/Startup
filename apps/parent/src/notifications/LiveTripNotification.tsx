// Android's live trip notification (v7, canvas "Z7-Android"), drawn by us instead of the plain text
// notification: the star, who the van is coming for, the minutes in big type, the route bar that
// fills as the van comes closer, and the last step. It is updated in place: by the app while open,
// and by the server's quiet data messages when the app is closed (background task in liveTask.ts).
// Runs as a 'widget' layout (Jetpack Compose via @expo/ui): no imports from the app or the theme, so
// the brand colours are written here (they match packages/ui/src/theme.ts).
import { Box, Column, LinearProgressIndicator, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxWidth, height, paddingAll, size, weight } from '@expo/ui/jetpack-compose/modifiers';
import { createCustomNotification } from 'expo-widgets';

export type LiveTripProps = {
  state: 'coming' | 'arriving' | 'inVan' | 'atSchool' | 'home' | 'stale';
  lead: string;
  headline: string;
  minutes: string;
  unit: string;
  progress: number;
  ahead: string;
  footer: string;
};

const LiveTrip = (p: LiveTripProps) => {
  'widget';
  const neel = '#1F2A5C';
  const kesar = '#E8A33D';
  const zamurrad = '#17705A';
  const ink = '#141A33';
  const ink2 = '#4A4F66';
  const accent = p.state === 'stale' ? '#8A8FA3' : p.state === 'inVan' || p.state === 'home' || p.state === 'arriving' ? zamurrad : neel;
  const big = p.minutes && p.state !== 'stale' ? `${p.minutes} ${p.unit}` : '';

  // A small brand mark: a kesar disc with a neel centre (the star's colours, at notification size).
  const mark = (
    <Box modifiers={[size(18, 18), cornerRadius(9), background(kesar)]} contentAlignment="center">
      <Box modifiers={[size(7, 7), cornerRadius(4), background(neel)]} />
    </Box>
  );

  return {
    collapsed: (
      <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 10 }} modifiers={[fillMaxWidth()]}>
        {mark}
        <Text color={ink} maxLines={1} style={{ fontSize: 15, fontWeight: '700' }} modifiers={[weight(1)]}>
          {p.lead}
        </Text>
        {big ? <Text color={accent} style={{ fontSize: 17, fontWeight: '800' }}>{big}</Text> : null}
      </Row>
    ),
    expanded: (
      <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), paddingAll(4)]}>
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 10 }} modifiers={[fillMaxWidth()]}>
          {mark}
          <Text color={ink2} maxLines={1} style={{ fontSize: 14, fontWeight: '700' }} modifiers={[weight(1)]}>
            {p.lead}
          </Text>
        </Row>
        <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
          <Text color={ink} maxLines={1} style={{ fontSize: 20, fontWeight: '800' }} modifiers={[weight(1)]}>
            {big ? p.headline : p.headline}
          </Text>
          {big ? <Text color={accent} style={{ fontSize: 26, fontWeight: '800' }}>{big}</Text> : null}
        </Row>
        <LinearProgressIndicator progress={Math.max(0.02, Math.min(1, p.progress))} color={accent} trackColor="#E6E9F5" modifiers={[fillMaxWidth(), height(8)]} />
        <Spacer modifiers={[height(2)]} />
        <Text color={ink2} maxLines={1} style={{ fontSize: 14, fontWeight: '600' }}>
          {[p.ahead, p.footer].filter(Boolean).join(' · ')}
        </Text>
      </Column>
    ),
  };
};

export default createCustomNotification('LiveTrip', LiveTrip);
