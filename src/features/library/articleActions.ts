import { ActionSheetIOS, Alert, Linking } from 'react-native';

import { offlineState, type Article } from '../../data/article';
import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { useToast } from '../../design/components/Toast';
import { haptic } from '../../design/haptics';
import { downloadForOffline, downloadResultCopy, removeArticle, removeFromOffline } from '../../sync';
import { formatBytes } from '../../sync/offline';

type Action = { label: string; run: () => void; destructive?: boolean };

/** Long-press actions for a book or row. Native sheet; delete is destructive-red. */
export function showArticleActions(article: Article): void {
  haptic('threshold');
  const read = article.readAt !== null;
  const state = offlineState(article);
  const toast = useToast.getState().show;

  const actions: Action[] = [
    {
      label: read ? 'mark as unread' : 'mark as read',
      run: () => {
        const r = repo();
        r.patch(article.id, read ? { readAt: null, progress: 0, scrollY: 0 } : { readAt: Date.now(), progress: 1 });
        useLibraryStore.getState().refresh(r);
        haptic('selection');
      },
    },
    state === 'offline'
      ? {
          label: `remove from offline${article.sizeBytes ? ` (${formatBytes(article.sizeBytes)})` : ''}`,
          run: () => {
            removeFromOffline(article.id);
            toast('removed from offline · still in your library');
          },
        }
      : {
          label: state === 'removed' ? 'download for offline' : 'try downloading again',
          run: () => {
            toast('downloading…');
            downloadForOffline(article.id)
              .then((state) => toast(downloadResultCopy(state)))
              .catch(() => toast("couldn't download"));
          },
        },
    ...(state === 'offline'
      ? [
          {
            label: 'download again',
            run: () => {
              toast('downloading…');
              downloadForOffline(article.id)
                .then((state) => toast(downloadResultCopy(state)))
                .catch(() => toast("couldn't download"));
            },
          },
        ]
      : []),
    { label: 'open original', run: () => Linking.openURL(article.url).catch(() => {}) },
    {
      label: 'delete',
      destructive: true,
      run: () =>
        Alert.alert('Delete this article?', `“${article.title}” will be removed from Readr.`, [
          { text: 'cancel', style: 'cancel' },
          {
            text: 'delete',
            style: 'destructive',
            onPress: () => {
              haptic('warning');
              removeArticle(article.id);
            },
          },
        ]),
    },
  ];

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: article.title,
      options: [...actions.map((a) => a.label), 'cancel'],
      destructiveButtonIndex: actions.findIndex((a) => a.destructive),
      cancelButtonIndex: actions.length,
    },
    (index) => actions[index]?.run(),
  );
}
