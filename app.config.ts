import type { ExpoConfig } from 'expo/config';

export const BUNDLE_ID = 'com.devesh.readr';
export const APP_GROUP = 'group.com.devesh.readr';

const config: ExpoConfig = {
  name: 'readr',
  slug: 'readr',
  scheme: 'readr',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Light-only by product decision (origin: Key Decisions).
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    appleTeamId: process.env.APPLE_TEAM_ID,
    deploymentTarget: '18.0',
    entitlements: {
      // Mirrored into the share target by @bacons/apple-targets.
      'com.apple.security.application-groups': [APP_GROUP],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      { backgroundColor: '#DEDEDE', image: './assets/splash-icon.png', imageWidth: 120 },
    ],
    'expo-sqlite',
    'expo-image',
    [
      'expo-video',
      { supportsPictureInPicture: true, supportsBackgroundPlayback: true },
    ],
    [
      'expo-font',
      {
        // Embedded at build time so no font loading happens at startup (plan P3).
        fonts: [
          // Static instances for native UI. Variable fonts for the reader live in assets/reader/fonts.
          './assets/fonts/GeistMono-Regular.ttf',
          './assets/fonts/GeistMono-Medium.ttf',
          './assets/fonts/Newsreader-Medium.ttf',
          './assets/fonts/Newsreader-Display.ttf',
          './assets/fonts/InstrumentSerif-Italic.ttf',
        ],
      },
    ],
    '@bacons/apple-targets',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appGroup: APP_GROUP,
  },
};

export default config;
