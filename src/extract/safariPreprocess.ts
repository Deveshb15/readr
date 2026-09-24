// Safari share-extension preprocessing (NSExtensionJavaScriptPreprocessingFile).
// Bundled as an IIFE with globalName `ExtensionPreprocessingJS`, which is the
// global Safari looks for. Runs inside the page, so the extension never hosts a DOM.
import { extract } from './extract';

type Args = { completionFunction: (result: Record<string, string>) => void };

export function run(args: Args): void {
  let payload: string;
  try {
    payload = JSON.stringify(extract(document, location.href));
  } catch {
    payload = JSON.stringify({ ok: false, url: location.href, reason: 'exception', canonical: null, title: document.title });
  }
  args.completionFunction({ result: payload });
}

export function finalize(): void {}
