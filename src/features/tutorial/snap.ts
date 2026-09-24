// Mini player corner snapping with momentum projection (Apple's projection formula).
// Pure + worklet-safe so it runs on the UI thread during the gesture.

export type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type Point = { x: number; y: number };
export type Bounds = {
  width: number;
  height: number;
  itemWidth: number;
  itemHeight: number;
  insets: { top: number; bottom: number; left: number; right: number };
  margin: number;
};

/** UIScrollView.DecelerationRate.normal */
export const DECELERATION = 0.998;

export function project(velocity: number, deceleration = DECELERATION): number {
  'worklet';
  return ((velocity / 1000) * deceleration) / (1 - deceleration);
}

export function cornerPoint(corner: Corner, b: Bounds): Point {
  'worklet';
  const left = b.insets.left + b.margin;
  const right = b.width - b.insets.right - b.margin - b.itemWidth;
  const top = b.insets.top + b.margin;
  const bottom = b.height - b.insets.bottom - b.margin - b.itemHeight;
  switch (corner) {
    case 'topLeft':
      return { x: left, y: top };
    case 'topRight':
      return { x: right, y: top };
    case 'bottomLeft':
      return { x: left, y: bottom };
    case 'bottomRight':
      return { x: right, y: bottom };
  }
}

/** Nearest corner to where the flick would carry the player. */
export function snapCorner(position: Point, velocity: Point, b: Bounds): Corner {
  'worklet';
  const target = { x: position.x + project(velocity.x), y: position.y + project(velocity.y) };
  const corners: Corner[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  let best: Corner = 'bottomRight';
  let bestDist = Infinity;
  for (const c of corners) {
    const p = cornerPoint(c, b);
    const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}
