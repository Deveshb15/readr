import { router } from 'expo-router';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import type { Article } from '../../data/article';
import { useMotionMode } from '../../design/motion';
import { colors, inset, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { mark } from '../../perf';
import { showArticleActions } from './articleActions';
import { BookCover } from './BookCover';
import { tiltFor } from './coverStyle';
import { rowMeta } from './selectors';

type Props = {
  article: Article;
  isNew: boolean;
  now: number;
  onArrived: (id: string) => void;
};

const COVER_WIDTH = 48;

/** List view row: a small tilted book, serif title, mono meta. Memoised so unrelated rows never re-render (P4). */
export const ArticleRow = memo(
  function ArticleRow({ article, isNew, now, onArrived }: Props) {
    const mode = useMotionMode();
    useEffect(() => {
      if (isNew) onArrived(article.id);
    }, [isNew, article.id, onArrived]);

    const tilt = mode === 'full' ? tiltFor(article.id, 0) * 0.8 : 0;
    const open = () => {
      mark('open-article-tap');
      router.push({ pathname: '/article/[id]', params: { id: article.id } });
    };

    return (
      <Animated.View
        entering={isNew ? (mode === 'full' ? FadeIn.springify() : FadeIn) : undefined}
        layout={mode === 'full' ? LinearTransition.springify() : undefined}
      >
        <Pressable
          onPress={open}
          onLongPress={() => showArticleActions(article)}
          delayLongPress={320}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${article.title}. ${rowMeta(article, now)}${article.readAt === null ? '. unread' : ''}`}
          accessibilityHint="opens the article. long press for more."
        >
          <View style={styles.inner}>
            <View style={[styles.cover, { transform: [{ rotate: `${tilt}deg` }] }]}>
              <BookCover article={article} width={COVER_WIDTH} drawOn={isNew} />
            </View>
            <View style={styles.text}>
              <T variant="rowTitle" numberOfLines={2}>
                {article.title}
              </T>
              <T variant="monoXs" color={colors.textMuted} numberOfLines={1}>
                {rowMeta(article, now)}
              </T>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  },
  (a, b) =>
    a.article.id === b.article.id &&
    a.article.updatedAt === b.article.updatedAt &&
    a.article.readAt === b.article.readAt &&
    a.isNew === b.isNew &&
    Math.floor(a.now / 60_000) === Math.floor(b.now / 60_000),
);

const styles = StyleSheet.create({
  row: { paddingHorizontal: inset.list, backgroundColor: colors.canvas },
  pressed: { backgroundColor: colors.canvasDeep },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x4,
    paddingVertical: space.x4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  cover: {
    boxShadow: '0 6px 10px -4px rgba(20,10,80,0.3), 0 1px 3px rgba(20,10,80,0.12)',
    borderRadius: 4,
  },
  text: { flex: 1, gap: 6 },
});
