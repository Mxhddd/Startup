// The Android home-screen widget (v7, canvas "Z7-Android"): neel, the child's name with the brand mark,
// the minutes in big kesar type during a trip (or the state in words), a progress bar, and one line.
// Same props as the iPhone widget (NextTripWidget.tsx), drawn with Jetpack Compose (Glance) via
// @expo/ui. Runs outside the app: colours are written here (they match packages/ui/src/theme.ts).
import { Box, Column, LinearProgressIndicator, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, paddingAll, size, weight } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { NextTripProps } from './NextTripWidget';

export type { NextTripProps } from './NextTripWidget';

const NextTripWidget = (p: NextTripProps) => {
  'widget';
  const neel = '#1F2A5C';
  const kesar = '#E8A33D';
  const ghee = '#FAF6EE';
  const siyahi = '#141A33';
  const done = p.mode === 'done';
  const ground = done ? kesar : neel;
  const ink = done ? siyahi : ghee;
  const live = p.mode === 'live' && p.minutes !== '';
  return (
    <Column verticalArrangement="spaceBetween" modifiers={[fillMaxSize(), background(ground), cornerRadius(28), paddingAll(14)]}>
      <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
        <Text color={ink} maxLines={1} style={{ fontSize: 14, fontWeight: '800' }} modifiers={[weight(1)]}>
          {p.name}
        </Text>
        <Box modifiers={[size(18, 18), cornerRadius(9), background(done ? siyahi : kesar)]} contentAlignment="center">
          <Box modifiers={[size(7, 7), cornerRadius(4), background(ground)]} />
        </Box>
      </Row>
      {live ? (
        <Row verticalAlignment="bottom">
          <Text color={kesar} style={{ fontSize: 44, fontWeight: '800' }}>{p.minutes}</Text>
          <Spacer modifiers={[size(4, 4)]} />
          <Text color={ink} style={{ fontSize: 15, fontWeight: '700' }}>{p.unit}</Text>
        </Row>
      ) : (
        <Text color={ink} maxLines={2} style={{ fontSize: 20, fontWeight: '800' }}>{p.title}</Text>
      )}
      {live ? <LinearProgressIndicator progress={Math.max(0.02, p.progress)} color={kesar} trackColor="#3A4680" modifiers={[fillMaxWidth(), height(6)]} /> : null}
      <Text color={ink} maxLines={1} style={{ fontSize: 14, fontWeight: '700' }}>
        {live ? p.title : p.line}
      </Text>
    </Column>
  );
};

export default createWidget('NextTripWidget', NextTripWidget, {
  mode: 'idle',
  initial: 'پ',
  name: 'پہنچ',
  title: 'فکر کم، خبر پوری',
  line: '',
  arriveAt: 0,
  startAt: 0,
  progress: 0,
  minutes: '',
  unit: 'منٹ',
});
