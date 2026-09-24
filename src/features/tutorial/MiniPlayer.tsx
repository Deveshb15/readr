import { BlurView } from 'expo-blur';
import { useEventListener } from 'expo';
import { isPictureInPictureSupported, useVideoPlayer, VideoView } from 'expo-video';
import { useRef } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '../../design/components/Toast';
import { haptic } from '../../design/haptics';
import { springs, useMotionMode } from '../../design/motion';
import { colors, radius, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { cornerPoint, snapCorner, type Bounds } from './snap';
import { useTutorial } from './tutorialStore';

/** A stable, real article to practise the Safari share on (the practice URL is intercepted, so it can't count). */
export const TUTORIAL_SAFARI_URL = 'https://en.wikipedia.org/wiki/Reading';

const WIDTH = 208;
const HEIGHT = Math.round((WIDTH * 9) / 16);

/**
 * YouTube-style in-app mini player that keeps playing as system picture-in-picture
 * when the user leaves for Safari (origin R15). Lives in the root layout overlay.
 */
export function MiniPlayer() {
  const visible = useTutorial((s) => s.visible);
  if (!visible) return null;
  return <Player />;
}

function Player() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mode = useMotionMode();
  const expanded = useTutorial((s) => s.expanded);
  const { close, toggleExpanded, markStarted } = useTutorial.getState();

  const player = useVideoPlayer(require('../../../assets/video/tutorial.mp4'), (p) => {
    p.loop = true;
    p.staysActiveInBackground = true;
    p.play();
  });
  useEventListener(player, 'playToEnd', () => haptic('soft'));

  const bounds: Bounds = {
    width,
    height,
    itemWidth: WIDTH,
    itemHeight: HEIGHT,
    insets: { top: insets.top, bottom: insets.bottom, left: 0, right: 0 },
    margin: space.x4,
  };
  const start = cornerPoint('bottomRight', bounds);
  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const ox = useSharedValue(0);
  const oy = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!expanded)
    .onStart(() => {
      ox.value = x.value;
      oy.value = y.value;
    })
    .onUpdate((e) => {
      x.value = ox.value + e.translationX;
      y.value = oy.value + e.translationY;
    })
    .onEnd((e) => {
      const corner = snapCorner({ x: x.value, y: y.value }, { x: e.velocityX, y: e.velocityY }, bounds);
      const p = cornerPoint(corner, bounds);
      x.value = withSpring(p.x, { ...springs.snap, velocity: e.velocityX });
      y.value = withSpring(p.y, { ...springs.snap, velocity: e.velocityY });
      runOnJS(haptic)('snap');
    });

  const tap = Gesture.Tap().onEnd(() => runOnJS(toggleExpanded)());

  const floating = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));

  // Only one VideoView is mounted at a time (mini or expanded); both share this ref.
  const videoRef = useRef<VideoView>(null);
  const pendingSafari = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSafari = () => {
    if (pendingSafari.current) clearTimeout(pendingSafari.current);
    pendingSafari.current = null;
    Linking.openURL(TUTORIAL_SAFARI_URL).catch(() => {});
  };

  const trySafari = () => {
    markStarted(Date.now());
    player.play();
    if (!isPictureInPictureSupported()) {
      useToast.getState().show("picture-in-picture isn't available on this device");
      setTimeout(openSafari, 1200);
      return;
    }
    // Start picture-in-picture explicitly, then leave once it's up (onPictureInPictureStart).
    // Relying on automatic PiP is unreliable when our own app opens another app.
    pendingSafari.current = setTimeout(() => {
      console.warn('[tutorial] picture-in-picture did not start within 1.5s; opening Safari anyway');
      openSafari();
    }, 1500);
    videoRef.current?.startPictureInPicture().catch((e: unknown) => {
      console.warn('[tutorial] startPictureInPicture failed', e);
      useToast.getState().show("couldn't start picture-in-picture");
      openSafari();
    });
  };

  if (expanded) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, styles.backdrop]}>
        <View style={[styles.expanded, { marginTop: insets.top + space.x10 }]}>
          <VideoView
            ref={videoRef}
            player={player}
            style={styles.videoExpanded}
            allowsPictureInPicture
            startsPictureInPictureAutomatically
            // AVPlayerViewController can't enter picture-in-picture with its controls hidden.
            nativeControls
            contentFit="cover"
            onPictureInPictureStart={() => {
              if (pendingSafari.current) openSafari();
            }}
          />
          <T variant="monoMd" style={styles.center}>
            share any page, tap{' '}
            <T variant="monoMd" color={colors.ink}>
              Readr
            </T>
            . that's it.
          </T>
          <Pressable style={styles.ink} onPress={trySafari} accessibilityRole="button">
            <T variant="monoLg" color={colors.white}>
              try it in safari
            </T>
          </Pressable>
          <Pressable onPress={toggleExpanded} style={styles.faded} accessibilityRole="button">
            <T variant="monoSm" color={colors.textMuted}>
              shrink
            </T>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        entering={mode === 'full' ? ZoomIn.springify() : FadeIn}
        exiting={mode === 'full' ? ZoomOut : FadeOut}
        style={[styles.mini, floating]}
        accessibilityRole="button"
        accessibilityLabel="tutorial video. tap to expand, drag to move."
      >
        <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
        <VideoView
          ref={videoRef}
          player={player}
          style={StyleSheet.absoluteFill}
          allowsPictureInPicture
          startsPictureInPictureAutomatically
          nativeControls={false}
          contentFit="cover"
        />
        <Pressable onPress={close} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="close tutorial">
          <T variant="monoXs" color={colors.white}>
            ×
          </T>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  mini: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDTH,
    height: HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: colors.canvasDeep,
  },
  close: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17,17,20,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { backgroundColor: colors.canvas },
  expanded: { paddingHorizontal: space.x5, gap: space.x5 },
  videoExpanded: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.card, overflow: 'hidden' },
  center: { textAlign: 'center' },
  ink: {
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faded: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
