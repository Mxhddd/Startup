// The iPhone Live Activity (lock screen) and Dynamic Island for a live trip (v7, canvas "Z7-LiveActivity"
// and "Z7-Island").
// - The minutes count down by themselves (a system timer to the arrival time), and the bar fills by
//   itself, so both keep moving with the phone locked; the app (and later the server) only send a new
//   arrival time.
// - Each state has its colour: coming neel/kesar, in the van zamurrad, at school kesar.
// - Our 8-point star is drawn from two squares and a hole, so it matches the logo exactly.
// Widget code runs inside iOS, not in the app: it can't import our theme, so colours are written here
// (they match packages/ui/src/theme.ts). Props come from buildLiveCard in @pohnch/core.
import { Circle, Gauge, HStack, ProgressView, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  contentTransition,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  monospacedDigit,
  padding,
  rotationEffect,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type VanActivityProps = {
  state: 'coming' | 'arriving' | 'inVan' | 'atSchool' | 'home' | 'stale';
  initial: string;
  lead: string;
  headline: string;
  arriveAt: number;
  startAt: number;
  progress: number;
  minutes: string;
  ahead: string;
  footer: string;
  /** v9: the step row: how many of three steps are done, and their names joined by "|". */
  steps?: number;
  marks?: string;
};

const VanActivity = (p: VanActivityProps, env: LiveActivityEnvironment) => {
  'widget';
  const ghee = '#FAF6EE';
  const muted = '#BFC4D6';
  const ground = '#141A33';
  const stale = p.state === 'stale' || env.isStale;
  const accent = stale ? '#8A8FA3' : p.state === 'inVan' || p.state === 'home' || p.state === 'arriving' ? '#A7D47E' : '#E8A33D';
  const bar = stale ? '#8A8FA3' : p.state === 'inVan' || p.state === 'home' ? '#17705A' : '#E8A33D';
  const counting = p.arriveAt > Date.now() && !stale;
  const range = { lower: new Date(Math.min(p.startAt, Date.now())), upper: new Date(p.arriveAt) };

  // The brand star: two squares, one turned 45°, with a hole in the ground colour.
  const star = (size: number, hole: string) => (
    <ZStack modifiers={[frame({ width: size, height: size })]}>
      <Rectangle modifiers={[frame({ width: size * 0.7, height: size * 0.7 }), foregroundStyle(accent)]} />
      <Rectangle modifiers={[frame({ width: size * 0.7, height: size * 0.7 }), rotationEffect(45), foregroundStyle(accent)]} />
      <Circle modifiers={[frame({ width: size * 0.3, height: size * 0.3 }), foregroundStyle(hole)]} />
    </ZStack>
  );

  const minutesBig = (size: number) =>
    counting ? (
      <Text timerInterval={range} countsDown modifiers={[font({ weight: 'heavy', size, design: 'rounded' }), monospacedDigit(), foregroundStyle(accent), lineLimit(1)]} />
    ) : (
      <Text modifiers={[font({ weight: 'heavy', size: size * 0.6 }), foregroundStyle(ghee), contentTransition('opacity'), lineLimit(2)]}>{p.headline}</Text>
    );

  // v9: three steps (left · in the van · there): a filled kesar dot for each one done, its name under it.
  const names = (p.marks ?? '').split('|');
  const stepRow = names.length === 3 ? (
    <HStack spacing={6}>
      {names.map((n, i) => (
        <HStack key={n} spacing={4}>
          <Circle modifiers={[frame({ width: 9, height: 9 }), foregroundStyle(i < (p.steps ?? 0) ? accent : 'rgba(250,246,238,0.25)')]} />
          <Text modifiers={[font({ weight: i < (p.steps ?? 0) ? 'bold' : 'regular', size: 14 }), foregroundStyle(i < (p.steps ?? 0) ? ghee : muted), lineLimit(1)]}>{n}</Text>
        </HStack>
      ))}
    </HStack>
  ) : null;

  const progressBar = counting ? (
    <ProgressView timerInterval={range} countsDown={false} modifiers={[tint(bar)]} />
  ) : (
    <ProgressView value={p.progress} modifiers={[tint(bar)]} />
  );

  return {
    banner: (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ horizontal: 16, vertical: 14 }), activityBackgroundTint(ground)]}>
        <HStack spacing={10}>
          {star(26, ground)}
          <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle(ghee), lineLimit(1)]}>{p.lead}</Text>
          <Spacer />
          <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle(muted)]}>Pohnch</Text>
        </HStack>
        <HStack alignment="lastTextBaseline" spacing={10}>
          {minutesBig(42)}
          {counting ? <Text modifiers={[font({ weight: 'bold', size: 17 }), foregroundStyle(ghee)]}>{p.headline}</Text> : null}
          <Spacer />
        </HStack>
        {progressBar}
        {stepRow}
        <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle(muted), lineLimit(1)]}>{[p.ahead, p.footer].filter(Boolean).join(' · ')}</Text>
      </VStack>
    ),
    compactLeading: (
      <HStack spacing={4}>
        {star(18, '#000000')}
        <Text modifiers={[font({ weight: 'bold', size: 14 }), foregroundStyle(ghee)]}>{p.initial}</Text>
      </HStack>
    ),
    compactTrailing: counting ? (
      <Text timerInterval={range} countsDown modifiers={[font({ weight: 'bold', size: 15 }), monospacedDigit(), foregroundStyle(accent), frame({ maxWidth: 52 })]} />
    ) : (
      star(18, '#000000')
    ),
    minimal: (
      <Gauge value={p.progress} modifiers={[gaugeStyle('circularCapacity'), tint(accent)]}>
        <Text modifiers={[font({ weight: 'bold', size: 14 }), foregroundStyle(ghee)]}>{p.initial}</Text>
      </Gauge>
    ),
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 6 })]}>
        {star(32, '#000000')}
      </VStack>
    ),
    expandedTrailing: <VStack modifiers={[padding({ trailing: 6 })]}>{minutesBig(34)}</VStack>,
    expandedCenter: <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle(ghee), lineLimit(1)]}>{p.lead}</Text>,
    expandedBottom: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ horizontal: 6, bottom: 6 })]}>
        {progressBar}
        {stepRow}
        <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle(muted), lineLimit(1)]}>{[p.ahead, p.footer].filter(Boolean).join(' · ')}</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity('VanActivity', VanActivity);
