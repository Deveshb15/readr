import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { offlineState, siteLabel } from '../../data/article';
import { queryTerms } from '../../data/search';
import { groupRootUri } from '../../data/sharedContainer';
import { haptic } from '../../design/haptics';
import { colors, paperTones, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { measure } from '../../perf';
import { isOnlineNow } from '../../sync/connectivity';
import { retryNow } from '../../sync/retry';
import { LinkOnlyState } from './LinkOnlyState';
import { chromeDirection, createPositionTracker, type ScrollSample } from './positionTracker';
import { prepareReader } from './prepareReader';
import { ProgressHairline } from './ProgressHairline';
import { ReaderChrome } from './ReaderChrome';
import { cssVars, useReaderSettings } from './settingsStore';

type BridgeMessage = ({ type: 'scroll' } & ScrollSample) | { type: 'ready' } | { type: 'link'; href: string };

export function ReaderScreen() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>();
  const article = useLibraryStore((s) => s.articles.find((a) => a.id === id) ?? null);
  const insets = useSafeAreaInsets();
  const settings = useReaderSettings((s) => s.settings);
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const progress = useSharedValue(article?.progress ?? 0);
  const chromeVisible = useSharedValue(1);
  const lastY = useRef(0);
  // Reload the page in place when images finish downloading or the article is downloaded
  // again (new text), keeping the scroll position.
  const [reloadKey, setReloadKey] = useState(0);
  const restoreY = useRef<number | null>(null);
  const contentStamp = article ? `${article.title}|${article.minutes}|${article.imagesDone}` : '';
  const shownStamp = useRef(contentStamp);
  const highlighted = useRef(false);
  const [minutesLeft, setMinutesLeft] = useState(() =>
    article ? Math.max(1, Math.round(article.minutes * (1 - article.progress))) : 0,
  );

  const prepared = useMemo(() => (article ? prepareReader(article) : null), [article?.id, article?.status, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const tracker = useMemo(() => {
    if (!article) return null;
    const r = repo();
    return createPositionTracker(
      article.readAt !== null,
      {
        markRead: () => {
          r.patch(article.id, { readAt: Date.now(), progress: 1 });
          useLibraryStore.getState().refresh(r);
          web.current?.injectJavaScript('window.readr && window.readr.fin(); true;');
          haptic('soft');
        },
        save: (scrollY, p) => r.patch(article.id, { scrollY, progress: p }),
      },
      Date.now(),
    );
  }, [article?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const r = repo();
    useReaderSettings.getState().hydrate(r);
    if (id) useLibraryStore.getState().setLastOpened(r, id);
  }, [id]);

  // Opening an article with missing images fetches them now (when online).
  useEffect(() => {
    if (!article || article.status !== 'partial' || !article.keepOffline) return;
    let cancelled = false;
    isOnlineNow().then((online) => {
      if (online && !cancelled) retryNow(article.id).catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [article?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!article || !ready || contentStamp === shownStamp.current) return;
    shownStamp.current = contentStamp;
    restoreY.current = lastY.current;
    setMinutesLeft(Math.max(1, Math.round(article.minutes * (1 - progress.value))));
    setReady(false);
    setReloadKey((k) => k + 1);
  }, [contentStamp, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dwell timer + final flush on leave.
  useEffect(() => {
    if (!tracker) return;
    const t = setInterval(() => tracker.tick(Date.now()), 1000);
    return () => {
      clearInterval(t);
      tracker.tick(Date.now());
      tracker.flush(Date.now());
      // Progress was written straight to the DB; let the library ("continue reading") see it.
      useLibraryStore.getState().refresh(repo());
    };
  }, [tracker]);

  // Live settings: CSS variables only.
  useEffect(() => {
    if (!ready) return;
    web.current?.injectJavaScript(`window.readr && window.readr.apply(${JSON.stringify(cssVars(settings))}); true;`);
  }, [settings, ready]);

  if (!article || !prepared) {
    return (
      <View style={[styles.screen, styles.center]}>
        <T variant="monoSm" color={colors.textMuted}>
          this article was removed.
        </T>
      </View>
    );
  }

  const tone = paperTones[settings.tone];
  const chromeTop = insets.top + space.x2;

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: BridgeMessage;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      // Apply settings before revealing so the page never flashes default styles.
      web.current?.injectJavaScript(`window.readr.apply(${JSON.stringify(cssVars(settings))}); true;`);
      const y = restoreY.current ?? (article.readAt === null ? article.scrollY : 0);
      if (y > 0) web.current?.injectJavaScript(`window.readr.scrollTo(${Math.round(y)}); true;`);
      restoreY.current = null;
      // Arrived from search: highlight the words and jump to the first match (once).
      const terms = q ? queryTerms(q) : [];
      if (terms.length && !highlighted.current) {
        highlighted.current = true;
        web.current?.injectJavaScript(`window.readr.highlight(${JSON.stringify(terms)}); true;`);
      }
      setReady(true);
      measure('open-article → text visible', 'open-article-tap');
    } else if (msg.type === 'scroll') {
      progress.value = msg.p;
      const left = Math.max(1, Math.round(article.minutes * (1 - msg.p)));
      if (left !== minutesLeft) setMinutesLeft(left);
      const dir = chromeDirection(lastY.current, msg.y);
      if (dir !== 'keep') chromeVisible.value = dir === 'show' ? 1 : 0;
      lastY.current = msg.y;
      tracker?.onScroll(msg, Date.now());
    } else if (msg.type === 'link') {
      Linking.openURL(msg.href).catch(() => {});
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: tone.background }]}>
      <View style={StyleSheet.absoluteFill}>
          {prepared.kind === 'linkOnly' ? (
            <LinkOnlyState article={article} />
          ) : (
            <WebView
              ref={web}
              key={reloadKey}
              source={{ uri: prepared.uri }}
              allowingReadAccessToURL={groupRootUri()}
              originWhitelist={['file://*']}
              onShouldStartLoadWithRequest={(req) => {
                if (req.url.startsWith('file://')) return true;
                if (/^https?:/.test(req.url)) Linking.openURL(req.url).catch(() => {});
                return false;
              }}
              onMessage={onMessage}
              style={[styles.web, { backgroundColor: tone.background, opacity: ready ? 1 : 0 }]}
              contentInset={{ top: 0 }}
              contentInsetAdjustmentBehavior="never"
              decelerationRate="normal"
              allowsLinkPreview={false}
              dataDetectorTypes="none"
              webviewDebuggingEnabled={__DEV__}
            />
          )}
          {prepared.kind === 'page' && !ready && (
            // Native title while the web view warms up (P5); crossfades away on load.
            <Animated.View exiting={FadeOut.duration(180)} style={[styles.placeholder, { paddingTop: insets.top + 76 }]}>
              <T variant="monoXs" color={tone.muted} style={styles.kicker}>
                {[siteLabel(article), article.minutes > 0 ? `${article.minutes} min read` : null].filter(Boolean).join(' · ').toLowerCase()}
              </T>
              <T variant="readTitle" color={tone.text} style={styles.title}>
                {article.title}
              </T>
            </Animated.View>
          )}
      </View>
      {/* Paper behind the status bar so text never scrolls under the clock. */}
      <View
        pointerEvents="none"
        style={[
          styles.statusScrim,
          {
            height: insets.top + 14,
            experimental_backgroundImage: `linear-gradient(to bottom, ${tone.background} 0%, ${tone.background} ${Math.round((insets.top / (insets.top + 14)) * 100)}%, transparent 100%)`,
          },
        ]}
      />
      <ProgressHairline progress={progress} top={insets.top} />
      <ReaderChrome
        visible={chromeVisible}
        top={chromeTop}
        onBack={() => router.back()}
        onSettings={() => router.push({ pathname: '/reader-settings', params: { id: article.id } })}
        minutesLeft={article.minutes > 0 ? minutesLeft : null}
        offline={offlineState(article)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: 'center', justifyContent: 'center' },
  web: { flex: 1 },
  placeholder: { ...StyleSheet.absoluteFill, paddingHorizontal: 24, gap: 16 },
  // Matches .kicker in readerCss so the handoff to the web view doesn't jump.
  kicker: { fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
  title: { fontSize: 36, lineHeight: 40, letterSpacing: -0.6 },
  statusScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
