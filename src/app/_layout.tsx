import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { repo } from '../data/db';
import { useLibraryStore } from '../data/libraryStore';
import { ToastHost } from '../design/components/Toast';
import { Celebration } from '../features/tutorial/Celebration';
import { MiniPlayer } from '../features/tutorial/MiniPlayer';
import { useFirstSafariSave } from '../features/tutorial/useFirstSafariSave';
import { colors } from '../design/tokens';
import { mark } from '../perf';
import { syncNow } from '../sync';
import { ExtractorHost } from '../sync/ExtractorHost';
import { retryDue, startRetryWatcher } from '../sync/retry';
import { seedGroup } from '../sync/seedGroup';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Startup critical path (P3): open DB + ingest + first library read, all synchronous,
// then hide the splash. Seeding and retries run after first paint.
function bootLibrary() {
  const r = repo();
  syncNow();
  useLibraryStore.getState().load(r);
  return r;
}

export default function RootLayout() {
  // Runs before the first render so the library's first commit already has data.
  const [r] = useState(bootLibrary);
  useFirstSafariSave();
  useEffect(() => {
    mark('library-first-commit');
    SplashScreen.hideAsync().catch(() => {});
    seedGroup(r).catch(() => {});
    retryDue().catch(() => {});
    const stopWatcher = startRetryWatcher();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      syncNow();
      retryDue().catch(() => {});
    });
    return () => {
      sub.remove();
      stopWatcher();
    };
  }, [r]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="article/[id]" />
          <Stack.Screen name="search" options={{ animation: 'fade', animationDuration: 180 }} />
          <Stack.Screen name="offline" />
          <Stack.Screen
            name="reader-settings"
            options={{ presentation: 'formSheet', sheetAllowedDetents: [0.8], sheetGrabberVisible: true, sheetCornerRadius: 32 }}
          />
          <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        </Stack>
        <ExtractorHost />
        <MiniPlayer />
        <Celebration />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
