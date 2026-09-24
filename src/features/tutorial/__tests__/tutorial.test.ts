import type { Article } from '../../../data/article';
import { cornerPoint, project, snapCorner, type Bounds } from '../snap';
import { isFirstSafariSave } from '../tutorialStore';

const bounds: Bounds = {
  width: 390,
  height: 844,
  itemWidth: 208,
  itemHeight: 117,
  insets: { top: 47, bottom: 34, left: 0, right: 0 },
  margin: 16,
};

describe('snapCorner', () => {
  it('a release at the centre flicked toward the top-left snaps top-left', () => {
    expect(snapCorner({ x: 91, y: 363 }, { x: -800, y: -1200 }, bounds)).toBe('topLeft');
  });

  it('a slow release near bottom-right stays bottom-right', () => {
    const p = cornerPoint('bottomRight', bounds);
    expect(snapCorner({ x: p.x - 10, y: p.y - 20 }, { x: 0, y: 0 }, bounds)).toBe('bottomRight');
  });

  it('a strong fling past the edge still picks the correct corner', () => {
    expect(snapCorner({ x: 150, y: 600 }, { x: 5000, y: 3000 }, bounds)).toBe('bottomRight');
    expect(snapCorner({ x: 150, y: 200 }, { x: -5000, y: -3000 }, bounds)).toBe('topLeft');
  });

  it('projects with UIScrollView normal deceleration', () => {
    expect(project(1000)).toBeCloseTo(499, 0);
  });

  it('corner points respect safe area and margin', () => {
    expect(cornerPoint('topLeft', bounds)).toEqual({ x: 16, y: 63 });
    expect(cornerPoint('bottomRight', bounds)).toEqual({ x: 390 - 16 - 208, y: 844 - 34 - 16 - 117 });
  });
});

const saved = (source: Article['source'], savedAt: number) => ({ id: 'x', source, savedAt }) as Article;

describe('isFirstSafariSave', () => {
  it('covers AE7: a Safari save after the tutorial started fires', () => {
    expect(isFirstSafariSave([saved('safari', 200)], 100, false)).toBe(true);
  });

  it('ignores practice saves and Safari saves from before the tutorial', () => {
    expect(isFirstSafariSave([saved('practice', 200)], 100, false)).toBe(false);
    expect(isFirstSafariSave([saved('safari', 50)], 100, false)).toBe(false);
  });

  it('never fires twice or without the tutorial', () => {
    expect(isFirstSafariSave([saved('safari', 200)], 100, true)).toBe(false);
    expect(isFirstSafariSave([saved('safari', 200)], null, false)).toBe(false);
  });
});
