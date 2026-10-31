// The home-screen (and lock-screen) widget: the van's state now, or the next trip time.
// Like the Live Activity, this runs inside iOS and can't import the theme; colours match theme.ts.
import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type NextTripProps = { title: string; line: string };

const NextTripWidget = (props: NextTripProps, environment: WidgetEnvironment) => {
  'widget';
  if (environment.widgetFamily === 'accessoryRectangular') {
    return (
      <VStack>
        <Text modifiers={[font({ weight: 'bold', size: 15 })]}>{props.title}</Text>
        <Text modifiers={[font({ size: 14 })]}>{props.line}</Text>
      </VStack>
    );
  }
  return (
    <VStack modifiers={[padding({ all: 12 })]}>
      <HStack>
        <Image systemName="star.fill" color="#E8A33D" />
        <Spacer />
      </HStack>
      <Spacer />
      <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle('#141A33')]}>{props.title}</Text>
      <Text modifiers={[font({ size: 14 }), foregroundStyle('#4A4F66')]}>{props.line}</Text>
    </VStack>
  );
};

export default createWidget('NextTripWidget', NextTripWidget, { title: 'پہنچ', line: 'فکر کم، خبر پوری' });
