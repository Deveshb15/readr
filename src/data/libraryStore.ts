import { create } from 'zustand';

import type { Article } from './article';
import type { ArticleRepo } from './repo';

type LibraryState = {
  articles: Article[];
  /** IDs added since the last render, so only new rows animate in. */
  arrivals: Set<string>;
  loaded: boolean;
  /** Last article opened in the reader (drives "continue reading"). */
  lastOpenedId: string | null;
  setLastOpened: (repo: ArticleRepo, id: string) => void;
  load: (repo: ArticleRepo) => void;
  refresh: (repo: ArticleRepo, arrivals?: string[]) => void;
  consumeArrival: (id: string) => void;
};

const sortNewest = (a: Article[]) => [...a].sort((x, y) => y.savedAt - x.savedAt);

export const useLibraryStore = create<LibraryState>((set) => ({
  articles: [],
  arrivals: new Set(),
  loaded: false,
  lastOpenedId: null,
  setLastOpened: (repo, id) => {
    repo.setSetting('last_opened', id);
    set({ lastOpenedId: id });
  },
  load: (repo) => set({ articles: sortNewest(repo.all()), loaded: true, lastOpenedId: repo.getSetting('last_opened') }),
  refresh: (repo, arrivals = []) =>
    set((s) => ({
      articles: sortNewest(repo.all()),
      arrivals: arrivals.length ? new Set([...s.arrivals, ...arrivals]) : s.arrivals,
    })),
  consumeArrival: (id) =>
    set((s) => {
      if (!s.arrivals.has(id)) return s;
      const next = new Set(s.arrivals);
      next.delete(id);
      return { arrivals: next };
    }),
}));
