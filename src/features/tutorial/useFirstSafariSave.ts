import { useEffect } from 'react';

import { repo } from '../../data/db';
import { haptic } from '../../design/haptics';
import { onIngest } from '../../sync';
import { FIRST_SAFARI_SAVE_KEY, isFirstSafariSave, useTutorial } from './tutorialStore';

/** Watches ingest; the first qualifying Safari save stops the tutorial and celebrates once. */
export function useFirstSafariSave(): void {
  useEffect(
    () =>
      onIngest((result) => {
        const { startedAt, celebrate } = useTutorial.getState();
        const r = repo();
        const done = r.getSetting(FIRST_SAFARI_SAVE_KEY) === '1';
        if (!isFirstSafariSave(result.added, startedAt, done)) return;
        r.setSetting(FIRST_SAFARI_SAVE_KEY, '1');
        celebrate();
        haptic('success');
      }),
    [],
  );
}
