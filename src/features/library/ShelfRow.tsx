import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Article } from '../../data/article';
import { inset, space } from '../../design/tokens';
import { BookCaption, BookTile } from './BookTile';

type Props = {
  books: Article[];
  bookWidth: number;
  arrivals: Set<string>;
  onArrived: (id: string) => void;
};

/** Two books side by side, captions below. */
export const ShelfRow = memo(function ShelfRow({ books, bookWidth, arrivals, onArrived }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.books}>
        {books.map((a, i) => (
          <BookTile
            key={a.id}
            article={a}
            column={i === 0 ? 0 : 1}
            width={bookWidth}
            isNew={arrivals.has(a.id)}
            onArrived={onArrived}
          />
        ))}
      </View>
      <View style={styles.captions}>
        {books.map((a) => (
          <BookCaption key={a.id} article={a} width={bookWidth} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { paddingTop: space.x6, paddingBottom: space.x5 },
  books: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: inset.list + 8, zIndex: 1 },
  captions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: inset.list + 8,
    marginTop: space.x4,
  },
});
