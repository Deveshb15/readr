import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { groupRootUri } from '../../data/sharedContainer';
import { haptic } from '../../design/haptics';
import { colors, paperTones, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { measure } from '../../perf';
import { LinkOnlyState } from './LinkOnlyState';
import { chromeDirection, createPositionTracker, type ScrollSample } from './positionTracker';
import { prepareReader } from './prepareReader';
import { ProgressHairline } from './ProgressHairline';
import { ReaderChrome } from './ReaderChrome';
import { cssVars, useReaderSettings } from './settingsStore';

type BridgeMessage = ({ type: 'scroll' } & ScrollSample) | { type: 'ready' } | { type: 'link'; href: string };

export function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = useLibraryStore((s) => s.articles.find((a) => a.id === id) ?? null);
  const insets = useSafeAreaInsets();
  const settings = useReaderSettings((s) => s.settings);
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const progress = useSharedValue(article?.progress ?? 0);
  const chromeVisible = useSharedValue(1);
  const lastY = useRef(0);

  const prepared = useMemo(() => (article ? prepareReader(article) : null), [article?.id, article?.status]); // eslint-disable-line react-hooks/exhaustive-deps

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
    useReaderSettings.getState().hydrate(repo());
  }, []);

  // Dwell timer + final flush on leave.
  useEffect(() => {
    if (!tracker) return;
    const t = setInterval(() => tracker.tick(Date.now()), 1000);
    return () => {
      clearInterval(t);
      tracker.tick(Date.now());
      tracker.flush(Date.now());
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
      if (article.scrollY > 0 && article.readAt === null) {
        web.current?.injectJavaScript(`window.readr.scrollTo(${Math.round(article.scrollY)}); true;`);
      }
      setReady(true);
      measure('open-article → text visible', 'open-article-tap');
    } else if (msg.type === 'scroll') {
      progress.value = msg.p;
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
      <Link.AppleZoomTarget>
        <View style={StyleSheet.absoluteFill}>
          {prepared.kind === 'linkOnly' ? (
            <LinkOnlyState article={article} />
          ) : (
            <WebView
              ref={web}
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
            <Animated.View exiting={FadeOut.duration(180)} style={[styles.placeholder, { paddingTop: insets.top + 96 }]}>
              <T variant="byline" color={tone.muted}>
                {[article.site, `${article.minutes} min`].filter(Boolean).join(' · ')}
              </T>
              <T variant="readTitle" color={tone.text}>
                {article.title}
              </T>
            </Animated.View>
          )}
        </View>
      </Link.AppleZoomTarget>
      <ProgressHairline progress={progress} top={insets.top} />
      <ReaderChrome
        visible={chromeVisible}
        top={chromeTop}
        onBack={() => router.back()}
        onSettings={() => router.push('/reader-settings')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: 'center', justifyContent: 'center' },
  web: { flex: 1 },
  placeholder: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 24, gap: 14 },
});
