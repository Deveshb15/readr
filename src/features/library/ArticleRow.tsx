import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { memo, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import type { Article } from '../../data/article';
import { groupPaths } from '../../data/sharedContainer';
import { DateChip } from '../../design/components/DateChip';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleAt } from '../../design/doodles/registry';
import { useMotionMode } from '../../design/motion';
import { colors, inset, radius, size, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { rowMeta } from './selectors';

type Props = {
  article: Article;
  isNew: boolean;
  now: number;
  onArrived: (id: string) => void;
};

/** Memoised on id + updatedAt (+ arrival/now bucket) so unrelated row changes never re-render it (P4). */
export const ArticleRow = memo(
  function ArticleRow({ article, isNew, now, onArrived }: Props) {
    const mode = useMotionMode();
    const doodle = doodleAt(article.doodle);
    const thumb = useMemo(
      () => (article.hasThumb ? groupPaths.articleFile(article.id, 'thumb.jpg').uri : null),
      [article.hasThumb, article.id],
    );
    useEffect(() => {
      if (isNew) onArrived(article.id);
    }, [isNew, article.id, onArrived]);

    const unread = article.readAt === null;
    return (
      <Animated.View
        entering={isNew ? (mode === 'full' ? FadeIn.springify() : FadeIn) : undefined}
        layout={mode === 'full' ? LinearTransition.springify() : undefined}
      >
        <Link href={{ pathname: '/article/[id]', params: { id: article.id } }} asChild>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${article.title}. ${rowMeta(article, now)}${unread ? '. unread' : ''}`}
          >
            <Link.AppleZoom>
              <View style={styles.inner}>
                <View style={styles.stampCol}>
                  {unread && <View style={styles.unreadDot} />}
                  <Doodle doodle={doodle} size={size.doodleStamp} drawOn={isNew} delayMs={120} />
                </View>
                <View style={styles.text}>
                  <T variant="rowTitle" numberOfLines={2}>
                    {article.title}
                  </T>
                  <T variant="monoXs" color={colors.textMuted} numberOfLines={1}>
                    {rowMeta(article, now)}
                  </T>
                  {article.status === 'link_only' && <DateChip label="needs internet" tone="faint" />}
                </View>
                {thumb ? (
                  <Image
                    source={{ uri: thumb }}
                    style={styles.thumb}
                    contentFit="cover"
                    recyclingKey={article.id}
                    transition={120}
                  />
                ) : null}
                {article.status === 'partial' && <View style={styles.partialRing} accessibilityLabel="images still downloading" />}
              </View>
            </Link.AppleZoom>
          </Pressable>
        </Link>
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
    gap: space.x3,
    paddingVertical: space.x4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  stampCol: { width: 28, alignItems: 'center', justifyContent: 'center' },
  unreadDot: {
    position: 'absolute',
    left: -14,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
  },
  text: { flex: 1, gap: 6 },
  thumb: { width: size.thumb, height: size.thumb, borderRadius: radius.chip, backgroundColor: colors.inkWash },
  partialRing: {
    position: 'absolute',
    right: 0,
    top: space.x4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
});
