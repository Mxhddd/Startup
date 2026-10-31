// The iPhone Live Activity and Dynamic Island for a live trip: siyahi ground, the star at the leading
// edge, the minutes in bold digits, the route dots from the van to your stop, and the last step.
// Widget code runs inside iOS, not in the app: it can't import anything (not even our theme), so the
// brand colours are written out here; they match packages/ui/src/theme.ts.
import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { activityBackgroundTint, font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type VanActivityProps = {
  /** "6 منٹ میں گھر" or "The van is at your door" */
  title: string;
  /** "6", for the small Dynamic Island */
  minutes: string;
  /** "●●★○◉" */
  dots: string;
  /** "وین نکل گئی · رفیق بھائی نے مارک کیا" */
  step: string;
  /** "Last seen 40 s ago" when the van's signal is stale, else "" */
  stale: string;
};

const VanActivity = (props: VanActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  const kesar = '#E8A33D';
  const ghee = '#FAF6EE';
  const muted = '#C9CCDA';
  const accent = props.stale || environment.isStale ? '#8A8FA3' : kesar;
  return {
    banner: (
      <VStack modifiers={[padding({ all: 14 }), activityBackgroundTint('#141A33')]}>
        <HStack>
          <Image systemName="star.fill" color={accent} />
          <Text modifiers={[font({ weight: 'bold', size: 22 }), foregroundStyle(ghee)]}>{props.title}</Text>
          <Spacer />
        </HStack>
        <Text modifiers={[font({ size: 20 }), foregroundStyle(accent)]}>{props.dots}</Text>
        <Text modifiers={[font({ size: 14 }), foregroundStyle(muted)]}>{props.stale || props.step}</Text>
      </VStack>
    ),
    compactLeading: <Image systemName="star.fill" color={accent} />,
    compactTrailing: <Text modifiers={[font({ weight: 'bold' }), foregroundStyle(ghee)]}>{props.minutes}</Text>,
    minimal: <Image systemName="star.fill" color={accent} />,
    expandedLeading: <Image systemName="star.fill" color={accent} />,
    expandedTrailing: <Text modifiers={[font({ weight: 'bold', size: 22 }), foregroundStyle(ghee)]}>{props.minutes}</Text>,
    expandedBottom: (
      <VStack modifiers={[padding({ all: 8 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle(ghee)]}>{props.title}</Text>
        <Text modifiers={[font({ size: 18 }), foregroundStyle(accent)]}>{props.dots}</Text>
        <Text modifiers={[font({ size: 14 }), foregroundStyle(muted)]}>{props.stale || props.step}</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity('VanActivity', VanActivity);
