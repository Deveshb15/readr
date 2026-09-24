import { useEffect } from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';
import { create } from 'zustand';

import type { ExtractResult } from '../extract/extract';
import { extractSource } from './generated/extractSource';

// A single hidden web view that runs the same extract.js the extension uses.
// Mounted only while there is a job (keeps memory and startup clean).

type Job = { html: string; url: string; resolve: (r: ExtractResult) => void };
const TIMEOUT_MS = 10_000;

const useJobs = create<{ queue: Job[] }>(() => ({ queue: [] }));

export function extractInWebView(html: string, url: string): Promise<ExtractResult> {
  return new Promise((resolve) => {
    useJobs.setState((s) => ({ queue: [...s.queue, { html, url, resolve }] }));
  });
}

function finish(job: Job, result: ExtractResult) {
  useJobs.setState((s) => ({ queue: s.queue.filter((j) => j !== job) }));
  job.resolve(result);
}

export function ExtractorHost() {
  const job = useJobs((s) => s.queue[0]);

  useEffect(() => {
    if (!job) return;
    const t = setTimeout(
      () => finish(job, { ok: false, url: job.url, reason: 'exception', canonical: null, title: null }),
      TIMEOUT_MS,
    );
    return () => clearTimeout(t);
  }, [job]);

  if (!job) return null;
  return (
    <View style={{ width: 0, height: 0, position: 'absolute', opacity: 0 }} pointerEvents="none">
      <WebView
        source={{ html: job.html, baseUrl: job.url }}
        originWhitelist={['*']}
        injectedJavaScript={`${extractSource};ReadrExtract.runAndPost(${JSON.stringify(job.url)});true;`}
        onMessage={(e) => {
          try {
            finish(job, JSON.parse(e.nativeEvent.data) as ExtractResult);
          } catch {
            finish(job, { ok: false, url: job.url, reason: 'exception', canonical: null, title: null });
          }
        }}
        onShouldStartLoadWithRequest={(req) => req.url === job.url || req.url === 'about:blank' || req.url.startsWith('data:')}
        incognito
      />
    </View>
  );
}
