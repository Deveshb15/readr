import doodleData from '../design/doodles/doodles.json';
import { doodleIndexFor, fnv1a64 } from './articleId';
import { canonicalize, findUrlInText, identityKey, InvalidUrlError } from './canonicalize';

export { canonicalize, findUrlInText, identityKey, InvalidUrlError } from './canonicalize';
export { fnv1a64, doodleIndexFor } from './articleId';

/** URL of the bundled practice article used during onboarding. */
export const PRACTICE_URL = 'https://readr.app/welcome';

export type Identity = { canonicalUrl: string; id: string; doodle: number; isPractice: boolean };

/**
 * One call used by every runtime: shared URL (+ optional rel=canonical) → identity.
 * The share extension calls this through JavaScriptCore as ReadrCore.identify.
 */
export function identify(url: string, canonicalHint?: string | null): Identity {
  const canonicalUrl = canonicalize(url, canonicalHint);
  const id = fnv1a64(identityKey(canonicalUrl));
  return {
    canonicalUrl,
    id,
    doodle: doodleIndexFor(id, doodleData.doodles.length),
    isPractice: canonicalUrl === canonicalize(PRACTICE_URL),
  };
}

/** JSContext-friendly wrapper: never throws, returns JSON. */
export function identifyJSON(input: string, canonicalHint?: string | null): string {
  try {
    const url = /^https?:\/\//i.test(input.trim()) ? input : findUrlInText(input);
    if (!url) return JSON.stringify({ ok: false, reason: 'no-url' });
    return JSON.stringify({ ok: true, ...identify(url, canonicalHint) });
  } catch (e) {
    return JSON.stringify({ ok: false, reason: e instanceof InvalidUrlError ? 'invalid-url' : 'error' });
  }
}
