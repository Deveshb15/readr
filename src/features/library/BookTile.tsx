import { router } from 'expo-router';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { siteLabel, type Article } from '../../data/article';
import { haptic } from '../../design/haptics';
import { springs, useMotionMode } from '../../design/motion';
import { colors } from '../../design/tokens';
import { T } from '../../design/typography';
import { mark } from '../../perf';
import { showArticleActions } from './articleActions';
import { BookCover, COVER_RATIO } from './BookCover';
import { tiltFor } from './coverStyle';

type Props = {
  article: Article;
  column: 0 | 1;
  width: number;
  isNew: boolean;
  onArrived: (id: string) => void;
};

/**
 * A book on the shelf. Leans left/right; pressing straightens and lifts it.
 * New arrivals drop onto the shelf and settle.
 */
export const BookTile = memo(
  function BookTile({ article, column, width, isNew, onArrived }: Props) {
    const mode = useMotionMode();
    const tilt = mode === 'full' ? tiltFor(article.id, column) : 0;
    const coverHeight = Math.round(width * COVER_RATIO);

    const pressed = useSharedValue(0);
    const drop = useSharedValue(isNew && mode === 'full' ? 1 : 0);

    useEffect(() => {
      if (!isNew) return;
      drop.value = withDelay(80, withSpring(0, springs.settle));
      onArrived(article.id);
    }, [isNew, article.id, onArrived, drop]);

    const bookStyle = useAnimatedStyle(() => {
      const t = tilt * (1 - pressed.value) + drop.value * tilt * 3;
      return {
        transform: [
          { translateY: -6 * pressed.value - 40 * drop.value },
          { rotate: `${t}deg` },
          { scale: 1 + 0.03 * pressed.value },
        ],
        opacity: 1 - drop.value * 0.8,
      };
    });

    const shadowStyle = useAnimatedStyle(() => ({
      opacity: 0.55 + 0.45 * (1 - pressed.value),
      transform: [{ scaleX: 1 - 0.12 * pressed.value }],
    }));

    const open = () => {
      mark('open-article-tap');
      router.push({ pathname: '/article/[id]', params: { id: article.id } });
    };

    return (
      <Pressable
        style={[styles.tile, { width: width + 4 }]}
        onPress={open}
        onLongPress={() => showArticleActions(article)}
        delayLongPress={320}
        onPressIn={() => {
          pressed.value = withSpring(1, springs.press);
          haptic('press');
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, springs.settle);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${article.title}. ${siteLabel(article)}${article.readAt === null ? '. unread' : ''}`}
        accessibilityHint="opens the article. long press for more."
      >
        <View style={{ height: coverHeight + 3, justifyContent: 'flex-end' }}>
          {/* Contact shadow on the shelf, under the book. */}
          <Animated.View style={[styles.contact, { width: width * 0.86 }, shadowStyle]} />
          <Animated.View style={[styles.book, bookStyle]}>
            <BookCover article={article} width={width} drawOn={isNew} />
          </Animated.View>
        </View>
      </Pressable>
    );
  },
  (a, b) =>
    a.article.id === b.article.id &&
    a.article.updatedAt === b.article.updatedAt &&
    a.article.readAt === b.article.readAt &&
    a.isNew === b.isNew &&
    a.width === b.width &&
    a.column === b.column,
);

/** Title + meta sit below the shelf plank, not on it. */
export function BookCaption({ article, width }: { article: Article; width: number }) {
  const meta = [siteLabel(article), article.status === 'link_only' ? null : `${article.minutes} min`].filter(Boolean).join(' · ');
  return (
    <View style={{ width: width + 4, gap: 4 }}>
      <T variant="rowTitle" numberOfLines={2} style={styles.title}>
        {article.title}
      </T>
      <T variant="monoXs" color={colors.textMuted} numberOfLines={1}>
        {meta.toLowerCase()}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'flex-start' },
  book: {
    // Drop shadow: long soft falloff + tight contact, tinted toward the ink.
    boxShadow: '0 14px 22px -10px rgba(20,10,80,0.35), 0 3px 6px rgba(20,10,80,0.12)',
    borderRadius: 7,
  },
  contact: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(20,10,80,0.18)',
  },
  title: { fontSize: 15, lineHeight: 19 },
});
