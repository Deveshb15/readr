/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      // Pure logic shared with the share extension and Safari; runs without React Native.
      displayName: 'core',
      testEnvironment: 'node',
      transform: { '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
      testMatch: [
        '<rootDir>/src/core/**/__tests__/**/*.test.ts',
        '<rootDir>/src/extract/**/__tests__/**/*.test.ts',
        '<rootDir>/scripts/**/__tests__/**/*.test.ts',
      ],
    },
    {
      displayName: 'app',
      preset: 'jest-expo/ios',
      testMatch: [
        '<rootDir>/src/{design,data,sync,features}/**/__tests__/**/*.test.ts?(x)',
      ],
    },
  ],
};
