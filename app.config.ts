import type { ExpoConfig } from 'expo/config';

export const BUNDLE_ID = 'com.devesh.readr';
export const APP_GROUP = 'group.com.devesh.readr';

const config: ExpoConfig = {
  name: 'Readr',
  slug: 'readr',
  scheme: 'readr',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  // Light-only by product decision (origin: Key Decisions).
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    icon: './assets/images/icon.png',
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
  // iOS-only product, but prebuild needs a package name if Android is ever generated.
  android: {
    package: 'com.devesh.readr',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      { backgroundColor: '#EFEDFD', image: './assets/images/splash-icon.png', imageWidth: 140 },
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
