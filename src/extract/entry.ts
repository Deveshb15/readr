// Bundle entry for web views (the share extension's off-screen web view and the
// app's ExtractorHost). Exposed as the global `ReadrExtract`.
import { extract } from './extract';

export { extract };

/** Extract the current document and return JSON (WKWebView callAsyncJavaScript). */
export function run(url?: string): string {
  return JSON.stringify(extract(document, url ?? location.href));
}

/** Extract and post to React Native (react-native-webview injectedJavaScript). */
export function runAndPost(url?: string): void {
  const w = window as unknown as { ReactNativeWebView?: { postMessage: (s: string) => void } };
  w.ReactNativeWebView?.postMessage(run(url));
}
