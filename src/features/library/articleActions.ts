import { ActionSheetIOS, Linking } from 'react-native';

import type { Article } from '../../data/article';
import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { haptic } from '../../design/haptics';
import { useToast } from '../../design/components/Toast';
import { removeArticle } from '../../sync';
import { refreshArticle } from '../../sync/retry';

/** Long-press actions for a book or row. Native sheet; delete is destructive-red. */
export function showArticleActions(article: Article): void {
  haptic('threshold');
  const read = article.readAt !== null;
  const options = [read ? 'mark as unread' : 'mark as read', 'refresh from the web', 'open original', 'delete', 'cancel'];
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: article.title,
      options,
      destructiveButtonIndex: 3,
      cancelButtonIndex: 4,
    },
    (index) => {
      const r = repo();
      if (index === 0) {
        r.patch(article.id, read ? { readAt: null, progress: 0, scrollY: 0 } : { readAt: Date.now(), progress: 1 });
        useLibraryStore.getState().refresh(r);
        haptic('selection');
      } else if (index === 1) {
        useToast.getState().show('refreshing…');
        refreshArticle(article.id)
          .then((ok) => useToast.getState().show(ok ? 'refreshed' : 'needs internet to refresh'))
          .catch(() => useToast.getState().show("couldn't refresh"));
      } else if (index === 2) {
        Linking.openURL(article.url).catch(() => {});
      } else if (index === 3) {
        haptic('warning');
        removeArticle(article.id);
      }
    },
  );
}
