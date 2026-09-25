import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { offlineState, siteLabel, type Article } from '../../data/article';
import { groupPaths } from '../../data/sharedContainer';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleAt } from '../../design/doodles/registry';
import { colors } from '../../design/tokens';
import { T } from '../../design/typography';
import { OfflineBadge } from '../offline/OfflineBadge';
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
          <TypeCover article={article} palette={palette} drawOn={drawOn} width={width} />
        )}

        {/* Spine: a dark fold near the left edge, then a soft highlight. Native CSS gradients (RN 0.86). */}
        <View pointerEvents="none" style={[styles.spine, { width: Math.max(10, width * 0.09) }]} />
        {/* Gloss: a faint diagonal sheen across the cover. */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.gloss]} />

        {unread && width >= 60 && <Ribbon />}
        {width >= 60 ? (
          <View style={styles.badgeCorner}>
            <OfflineBadge state={offlineState(article)} size={Math.min(20, Math.max(16, width * 0.12))} />
          </View>
        ) : null}
      </View>
    </View>
  );
});

function TypeCover({
  article,
  palette,
  drawOn,
  width,
}: {
  article: Article;
  palette: ReturnType<typeof paletteFor>;
  drawOn: boolean;
  width: number;
}) {
  // Thumbnail size (list rows, search, offline): no room for type, just the doodle.
  if (width < 60) {
    return (
      <View style={styles.typeCoverSmall}>
        <Doodle doodle={doodleAt(article.doodle)} size={Math.round(width * 0.55)} color={palette.ink} strokeWidth={1.6} />
      </View>
    );
  }
  return (
    <View style={styles.typeCover}>
      <T variant="monoXs" color={palette.muted} numberOfLines={1}>
        {siteLabel(article).toLowerCase()}
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
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    experimental_backgroundImage:
      'linear-gradient(to right, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.06) 35%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0) 100%)',
  },
  gloss: {
    experimental_backgroundImage:
      'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.06) 100%)',
  },
  typeCoverSmall: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  typeCover: { flex: 1, paddingLeft: 18, paddingRight: 12, paddingTop: 14, paddingBottom: 12 },
  typeTitle: { marginTop: 10 },
  typeFoot: { flex: 1, justifyContent: 'flex-end' },
  ribbon: { position: 'absolute', top: 0, right: 12 },
  badgeCorner: { position: 'absolute', right: 8, bottom: 8 },
});
