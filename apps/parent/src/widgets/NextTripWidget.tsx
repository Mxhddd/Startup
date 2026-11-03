// The iPhone widgets (v7, canvas "Z7-Widgets"): small and medium on the home screen; circular,
// rectangular and inline on the lock screen. During a trip the minutes count down by themselves
// (system timer to the arrival time); otherwise the widget shows where the child is or the next trip.
// Like the Live Activity, this runs inside iOS and can't import the theme; colours match theme.ts.
import { Circle, Gauge, HStack, Link, ProgressView, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, frame, gaugeStyle, lineLimit, monospacedDigit, padding, rotationEffect, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type NextTripProps = {
  /** 'live' while counting down, 'done' for a finished step (at school, home), 'idle' otherwise. */
  mode: 'live' | 'done' | 'idle';
  initial: string;
  /** "علی" */
  name: string;
  /** "وین آ رہی ہے" / "اسکول پہنچ گئے" / "صبح کی وین 7:10" */
  title: string;
  /** A second line: stops ahead, or the time something happened. */
  line: string;
  arriveAt: number;
  startAt: number;
  progress: number;
  minutes: string;
  /** "min" in the phone's language. */
  unit: string;
  /** "Off today" before the morning van leaves (a link into the chutti calendar), else empty. */
  offLabel?: string;
};

const NextTripWidget = (p: NextTripProps, env: WidgetEnvironment) => {
  'widget';
  const neel = '#1F2A5C';
  const kesar = '#E8A33D';
  const ghee = '#FAF6EE';
  const siyahi = '#141A33';
  const ink2 = '#4A4F66';
  const live = p.mode === 'live' && p.arriveAt > Date.now();
  const range = { lower: new Date(Math.min(p.startAt, Date.now())), upper: new Date(p.arriveAt) };

  const star = (size: number, colour: string, hole: string) => (
    <ZStack modifiers={[frame({ width: size, height: size })]}>
      <Rectangle modifiers={[frame({ width: size * 0.7, height: size * 0.7 }), foregroundStyle(colour)]} />
      <Rectangle modifiers={[frame({ width: size * 0.7, height: size * 0.7 }), rotationEffect(45), foregroundStyle(colour)]} />
      <Circle modifiers={[frame({ width: size * 0.3, height: size * 0.3 }), foregroundStyle(hole)]} />
    </ZStack>
  );
  const timer = (size: number, colour: string) => (
    <Text timerInterval={range} countsDown modifiers={[font({ weight: 'heavy', size, design: 'rounded' }), monospacedDigit(), foregroundStyle(colour), lineLimit(1)]} />
  );

  // Lock screen: the system tints these; keep them simple and legible.
  if (env.widgetFamily === 'accessoryInline') {
    return <Text>{live ? `${p.name} · ${p.minutes} ${p.unit}` : `${p.name} · ${p.title}`}</Text>;
  }
  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <Gauge value={p.progress} modifiers={[gaugeStyle('circularCapacity')]}>
        <Text modifiers={[font({ weight: 'bold', size: 18 })]}>{live ? p.minutes : p.initial}</Text>
      </Gauge>
    );
  }
  if (env.widgetFamily === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ weight: 'bold', size: 15 }), lineLimit(1)]}>{live ? `${p.name} · ${p.minutes} ${p.unit}` : `${p.name} · ${p.title}`}</Text>
        <Text modifiers={[font({ size: 14 }), lineLimit(1)]}>{p.line}</Text>
        {live ? <ProgressView value={p.progress} /> : null}
      </VStack>
    );
  }

  // Home screen, medium: neel, the minutes in kesar, the bar, the line.
  if (env.widgetFamily === 'systemMedium') {
    return (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ all: 16 }), containerBackground(neel, 'widget'), widgetURL('pohnch://')]}>
        <HStack spacing={10}>
          {star(22, kesar, neel)}
          <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle(ghee), lineLimit(1)]}>{p.name}</Text>
          <Spacer />
          {live ? timer(32, kesar) : <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle(kesar)]}>{p.title}</Text>}
        </HStack>
        {live ? <ProgressView timerInterval={range} countsDown={false} modifiers={[tint(kesar)]} /> : <ProgressView value={p.progress} modifiers={[tint(kesar)]} />}
        <HStack>
          <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle('#E6E9F5'), lineLimit(1)]}>{live ? `${p.title} · ${p.line}` : p.line}</Text>
          <Spacer />
          {p.offLabel ? <Link label={p.offLabel} destination="pohnch://chutti?quick=today" modifiers={[font({ weight: 'bold', size: 14 }), foregroundStyle(kesar)]} /> : null}
        </HStack>
      </VStack>
    );
  }

  // Home screen, small: a minutes gauge while live; otherwise the state in words.
  return (
    <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 14 }), containerBackground(p.mode === 'done' ? kesar : ghee, 'widget'), widgetURL('pohnch://')]}>
      <HStack>
        <Text modifiers={[font({ weight: 'heavy', size: 14 }), foregroundStyle(p.mode === 'done' ? siyahi : neel)]}>{p.name}</Text>
        <Spacer />
        {star(18, p.mode === 'done' ? siyahi : kesar, p.mode === 'done' ? kesar : ghee)}
      </HStack>
      <Spacer />
      {live ? (
        <HStack alignment="lastTextBaseline" spacing={4}>
          {timer(34, siyahi)}
        </HStack>
      ) : (
        <Text modifiers={[font({ weight: 'heavy', size: 20 }), foregroundStyle(siyahi), lineLimit(2)]}>{p.title}</Text>
      )}
      <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle(p.mode === 'done' ? siyahi : ink2), lineLimit(1)]}>{live ? p.title : p.line}</Text>
    </VStack>
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
  offLabel: '',
});
