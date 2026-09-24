// Dev-only timing marks for the budgets in docs/qa/performance-budgets.md.
// Stripped to no-ops in production builds.

const t0 = globalThis.performance?.now() ?? 0;
const marks = new Map<string, number>();

export function mark(name: string): void {
  if (!__DEV__) return;
  const now = globalThis.performance?.now() ?? 0;
  marks.set(name, now);
  console.log(`[perf] ${name}: ${Math.round(now - t0)}ms since JS start`);
}

export function measure(name: string, from: string): void {
  if (!__DEV__) return;
  const start = marks.get(from);
  if (start === undefined) return;
  console.log(`[perf] ${name}: ${Math.round((globalThis.performance?.now() ?? 0) - start)}ms`);
}
