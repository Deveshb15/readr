/**
 * The share extension evaluates core.js in a bare JavaScriptCore context:
 * no DOM, no URL, no TextEncoder. Build it and prove it runs without them.
 */
import { buildSync } from 'esbuild';
import { join } from 'node:path';
import vm from 'node:vm';

describe('core.js bundle', () => {
  it('evaluates without Web APIs and exposes ReadrCore.identifyJSON', () => {
    const result = buildSync({
      entryPoints: [join(__dirname, '../index.ts')],
      bundle: true,
      format: 'iife',
      globalName: 'ReadrCore',
      write: false,
      target: 'safari16',
    });
    const code = result.outputFiles[0].text;
    // Only ECMAScript built-ins, like a fresh JSContext.
    const sandbox: Record<string, unknown> = {};
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    const out = vm.runInContext(
      "ReadrCore.identifyJSON('https://www.example.com/a/?utm_source=x')",
      sandbox,
    ) as string;
    expect(JSON.parse(out)).toMatchObject({ ok: true, canonicalUrl: 'https://example.com/a' });
    expect(sandbox.URL).toBeUndefined();
  });
});
