// The Android home-screen widget (v7, canvas "Z7-Android"): neel, the child's name with the brand mark,
// the minutes in big kesar type during a trip (or the state in words), a progress bar, and one line.
// Same props as the iPhone widget (NextTripWidget.tsx), drawn with Jetpack Compose (Glance) via
// @expo/ui. Runs outside the app: colours are written here (they match packages/ui/src/theme.ts).
import { Column, LinearProgressIndicator, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, paddingAll, width } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { NextTripProps } from './NextTripWidget';

export type { NextTripProps } from './NextTripWidget';

const NextTripWidget = (p: NextTripProps) => {
  'widget';
  // v21: only the simplest, fully supported pieces (Column, Row, Text, Spacer, a progress bar; size,
  // padding, background, corner radius), fixed gaps instead of "space between", and no weights, so every
  // launcher draws it the same. Colours match the website and packages/ui/src/theme.ts.
  const neel = '#1F2A5C';
  const night = '#10162F';
  const kesar = '#E8A33D';
  const kesarSoft = '#F6C46E';
  const paper = '#FBF7EF';
  const muted = '#D6CFC1';
  const ink = '#141A33';
  const done = p.mode === 'done';
  const ground = done ? kesar : neel;
  const text = done ? ink : paper;
  const quiet = done ? '#5E4A1F' : muted;
  const live = p.mode === 'live' && p.minutes !== '';
  const steps = p.marks ? p.marks.split('|') : [];
  return (
    <Column modifiers={[fillMaxSize(), background(ground), cornerRadius(24), paddingAll(14)]}>
      <Row verticalAlignment="center">
        <Text color={done ? ink : kesar} maxLines={1} style={{ fontSize: 13, fontWeight: '800' }}>
          {'✦ '}
        </Text>
        <Text color={text} maxLines={1} style={{ fontSize: 14, fontWeight: '800' }}>
          {p.name}
        </Text>
      </Row>
      <Spacer modifiers={[height(6)]} />
      {live ? (
        <Row verticalAlignment="bottom">
          <Text color={kesarSoft} style={{ fontSize: 40, fontWeight: '800' }}>{p.minutes}</Text>
          <Spacer modifiers={[width(6)]} />
          <Text color={text} style={{ fontSize: 15, fontWeight: '700' }}>{p.unit}</Text>
        </Row>
      ) : (
        <Text color={text} maxLines={2} style={{ fontSize: 19, fontWeight: '800' }}>{p.title}</Text>
      )}
      <Spacer modifiers={[height(8)]} />
      {live ? <LinearProgressIndicator progress={Math.max(0.02, Math.min(1, p.progress))} color={kesar} trackColor={night} modifiers={[fillMaxWidth(), height(6)]} /> : null}
      {live ? <Spacer modifiers={[height(8)]} /> : null}
      {steps.length ? (
        <Text color={quiet} maxLines={1} style={{ fontSize: 13, fontWeight: '700' }}>
          {steps.map((m, i) => `${i < (p.steps ?? 0) ? '●' : '○'} ${m}`).join('   ')}
        </Text>
      ) : null}
      <Text color={live ? text : quiet} maxLines={1} style={{ fontSize: 13, fontWeight: '700' }}>
        {live ? p.title : p.line}
      </Text>
    </Column>
  );
};

export default createWidget('NextTripWidget', NextTripWidget, {
  mode: 'idle',
  initial: 'پ',
  name: 'پہنچ',
  title: 'وین آپ کے فون پر',
  line: '',
  arriveAt: 0,
  startAt: 0,
  progress: 0,
  minutes: '',
  unit: 'منٹ',
  steps: 0,
  marks: '',
});
