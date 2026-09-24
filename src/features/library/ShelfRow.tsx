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

/** Two books standing on a shelf plank, captions below the plank. */
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
      <View style={styles.plank}>
        <View style={styles.plankTop} />
        <View style={styles.plankEdge} />
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
  plank: { marginHorizontal: inset.list - 6, marginTop: -2 },
  // Shelf surface catching light, then the front edge with a soft shadow beneath.
  plankTop: { height: 6, backgroundColor: '#E9E9EC', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  plankEdge: {
    height: 5,
    backgroundColor: '#C9C9CF',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    boxShadow: '0 8px 14px -6px rgba(20,10,80,0.22)',
  },
  captions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: inset.list + 8,
    marginTop: space.x3,
  },
});
