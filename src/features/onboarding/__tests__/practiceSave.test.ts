import type { Article } from '../../../data/article';
import { practiceSave } from '../practiceSave';

const practice = (savedAt: number) => ({ id: 'p', source: 'practice', savedAt }) as Article;

describe('practiceSave', () => {
  it('covers F3: resolves success when the practice record appears after the sheet closes', async () => {
    let record: Article | null = null;
    const sync = jest.fn(() => {
      record = practice(1);
    });
    const result = await practiceSave({ openShareSheet: async () => {}, sync, findPractice: () => record });
    expect(sync).toHaveBeenCalledTimes(1);
    expect(result).toBe('success');
  });

  it('resolves not_saved when the sheet closes without a practice record', async () => {
    const result = await practiceSave({ openShareSheet: async () => {}, sync: () => {}, findPractice: () => null });
    expect(result).toBe('not_saved');
  });

  it('resolves already_saved (still a success) when onboarding is re-run', async () => {
    const existing = practice(5);
    const result = await practiceSave({ openShareSheet: async () => {}, sync: () => {}, findPractice: () => existing });
    expect(result).toBe('already_saved');
  });

  it('syncs only after the share sheet has closed', async () => {
    const order: string[] = [];
    await practiceSave({
      openShareSheet: async () => void order.push('sheet-closed'),
      sync: () => void order.push('sync'),
      findPractice: () => null,
    });
    expect(order).toEqual(['sheet-closed', 'sync']);
  });
});
