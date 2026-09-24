import { memo } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { InkNumbers } from '../../design/typography';
import { flightCopy, type FlightStatus as Status } from './selectors';

export const FlightStatus = memo(function FlightStatus({ status }: { status: Status }) {
  const copy = flightCopy(status);
  if (!copy) return null;
  return (
    <Animated.View key={copy} entering={FadeIn} exiting={FadeOut} accessibilityLiveRegion="polite">
      <InkNumbers text={copy} />
    </Animated.View>
  );
});
