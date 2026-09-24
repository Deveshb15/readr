import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Article } from '../../data/article';
import { groupPaths } from '../../data/sharedContainer';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleAt } from '../../design/doodles/registry';
import { colors } from '../../design/tokens';
import { T } from '../../design/typography';
import { paletteFor } from './coverStyle';

type Props = { article: Article; width: number; drawOn?: boolean };

export const COVER_RATIO = 1.5; // 2:3, like a paperback

/**
 * A saved article as a book: lead image (or a typographic cover), spine shading,
 * page edges peeking out on the right, an ink ribbon while unread.
 */
export const BookCover = memo(function BookCover({ article, width, drawOn = false }: Props) {
  const height = Math.round(width * COVER_RATIO);
  const thumb = useMemo(
    () => (article.hasThumb ? groupPaths.articleFile(article.id, 'thumb.jpg').uri : null),
    [article.hasThumb, article.id],
  );
  const palette = paletteFor(article.doodle);
  const unread = article.readAt === null;

  return (
    <View style={{ width: width + 4, height: height + 3 }}>
      {/* Page block: two stacked sheets offset to the right/bottom = book thickness */}
      <View style={[styles.pages, { width, height, left: 4, top: 3 }]} />
      <View style={[styles.pages, { width, height, left: 2, top: 1.5 }]} />

      <View style={[styles.cover, { width, height, backgroundColor: palette.background }]}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={article.id} transition={160} />
        ) : (
          <TypeCover article={article} palette={palette} drawOn={drawOn} />
        )}

        {/* Spine: a dark fold near the left edge, then a soft highlight. */}
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.06)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
          locations={[0, 0.35, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.spine, { width: Math.max(10, width * 0.09) }]}
          pointerEvents="none"
        />
        {/* Gloss: a faint diagonal sheen across the cover. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.06)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {unread && <Ribbon />}
        {article.status === 'link_only' && (
          <View style={styles.badge}>
            <T variant="monoXs" color={colors.white}>
              needs internet
            </T>
          </View>
        )}
        {article.status === 'partial' && <View style={styles.partial} accessibilityLabel="images still downloading" />}
      </View>
    </View>
  );
});

function TypeCover({
  article,
  palette,
  drawOn,
}: {
  article: Article;
  palette: ReturnType<typeof paletteFor>;
  drawOn: boolean;
}) {
  return (
    <View style={styles.typeCover}>
      <T variant="monoXs" color={palette.muted} numberOfLines={1}>
        {(article.site ?? '').toLowerCase()}
      </T>
      <T variant="italicDek" color={palette.ink} numberOfLines={5} style={styles.typeTitle}>
        {article.title}
      </T>
      <View style={styles.typeFoot}>
        <Doodle doodle={doodleAt(article.doodle)} size={30} color={palette.ink} strokeWidth={1.6} drawOn={drawOn} />
      </View>
    </View>
  );
}

function Ribbon() {
  return (
    <View style={styles.ribbon} accessibilityLabel="unread">
      <Svg width={12} height={26} viewBox="0 0 12 26">
        <Path d="M0 0 H12 V26 L6 20 L0 26 Z" fill={colors.ink} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pages: {
    position: 'absolute',
    backgroundColor: '#F7F5EF',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  cover: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  typeCover: { flex: 1, paddingLeft: 18, paddingRight: 12, paddingTop: 14, paddingBottom: 12 },
  typeTitle: { marginTop: 10 },
  typeFoot: { flex: 1, justifyContent: 'flex-end' },
  ribbon: { position: 'absolute', top: 0, right: 12 },
  badge: {
    position: 'absolute',
    left: 14,
    bottom: 10,
    backgroundColor: 'rgba(17,17,20,0.72)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  partial: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: 'rgba(24,0,204,0.6)',
  },
});
