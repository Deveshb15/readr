import type { Article } from '../../data/article';

export type PracticeResult = 'success' | 'already_saved' | 'not_saved';

export type PracticeDeps = {
  /** Opens the real iOS share sheet on the practice URL; resolves when it closes. */
  openShareSheet: () => Promise<void>;
  /** Pulls extension saves into the DB (ingest). */
  sync: () => void;
  findPractice: () => Article | null;
};

/**
 * Practice save (origin R14): the user taps readr in the real share sheet on a bundled sample.
 * An existing practice record (onboarding re-run) still counts as success.
 */
export async function practiceSave(deps: PracticeDeps): Promise<PracticeResult> {
  const before = deps.findPractice();
  await deps.openShareSheet();
  deps.sync();
  const after = deps.findPractice();
  if (!after) return 'not_saved';
  if (before && before.savedAt === after.savedAt) return 'already_saved';
  return 'success';
}

export const ONBOARDED_KEY = 'onboarded';
