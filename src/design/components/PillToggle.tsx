import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '../haptics';
import { springs } from '../motion';
import { colors, radius } from '../tokens';

type Option<K extends string> = { key: K; label: string; render: (selected: boolean) => ReactNode };

/** Frosted segmented control; the ink selection slides on a spring. */
export function PillToggle<K extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<K>[];
  value: K;
  onChange: (key: K) => void;
}) {
  const [width, setWidth] = useState(0);
  const segment = options.length > 0 ? (width - PAD * 2) / options.length : 0;
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(index * segment, springs.slide);
  }, [index, segment, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      style={styles.track}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segment > 0 && <Animated.View style={[styles.thumb, { width: segment }, thumb]} />}
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                haptic('selection');
                onChange(o.key);
              }
            }}
          >
            {o.render(selected)}
          </Pressable>
        );
      })}
    </View>
  );
}

const PAD = 4;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PAD,
    borderRadius: radius.button + PAD,
    backgroundColor: colors.inkWash,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.button,
    backgroundColor: colors.ink,
  },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
