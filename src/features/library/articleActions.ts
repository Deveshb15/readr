import { ActionSheetIOS, Linking } from 'react-native';

import type { Article } from '../../data/article';
import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { haptic } from '../../design/haptics';
import { removeArticle } from '../../sync';

/** Long-press actions for a book or row. Native sheet; delete is destructive-red. */
export function showArticleActions(article: Article): void {
  haptic('threshold');
  const read = article.readAt !== null;
  const options = [read ? 'mark as unread' : 'mark as read', 'open original', 'delete', 'cancel'];
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: article.title,
      options,
      destructiveButtonIndex: 2,
      cancelButtonIndex: 3,
    },
    (index) => {
      const r = repo();
      if (index === 0) {
        r.patch(article.id, read ? { readAt: null, progress: 0, scrollY: 0 } : { readAt: Date.now(), progress: 1 });
        useLibraryStore.getState().refresh(r);
        haptic('selection');
      } else if (index === 1) {
        Linking.openURL(article.url).catch(() => {});
      } else if (index === 2) {
        haptic('warning');
        removeArticle(article.id);
      }
    },
  );
}
