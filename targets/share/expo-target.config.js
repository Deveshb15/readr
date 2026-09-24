/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'share',
  name: 'ReadrShare',
  displayName: 'Readr',
  icon: '../../assets/images/icon.png',
  deploymentTarget: '18.0',
  frameworks: ['SwiftUI', 'WebKit', 'JavaScriptCore', 'ImageIO', 'UniformTypeIdentifiers'],
  entitlements: {
    // Same App Group as the app: the extension writes articles, the app ingests them.
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
