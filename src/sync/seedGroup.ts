import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';

import { readerCss } from '../features/reader/readerCss';
import type { ArticleRepo } from '../data/repo';
import { ensureDirectory, groupPaths } from '../data/sharedContainer';
import { sampleHtml, sampleMeta } from './sample';

// Bump when reader assets or the sample change.
export const SEED_VERSION = '1';

const READER_FONTS = {
  'Newsreader-Variable.ttf': require('../../assets/reader/fonts/Newsreader-Variable.ttf'),
  'Newsreader-Italic-Variable.ttf': require('../../assets/reader/fonts/Newsreader-Italic-Variable.ttf'),
  'InstrumentSerif-Italic.ttf': require('../../assets/reader/fonts/InstrumentSerif-Italic.ttf'),
  'GeistMono-Variable.ttf': require('../../assets/reader/fonts/GeistMono-Variable.ttf'),
} as const;

/**
 * Copies reader CSS/fonts and the practice sample into the App Group so the reader
 * web view (file:// with group read access) and the extension can use them.
 * Runs once per SEED_VERSION, off the startup critical path.
 */
export async function seedGroup(repo: ArticleRepo): Promise<void> {
  if (repo.getSetting('seed_version') === SEED_VERSION) return;

  const assetsDir = ensureDirectory(groupPaths.readerAssets());
  new File(assetsDir, 'reader.css').write(readerCss);
  const fontsDir = ensureDirectory(new Directory(assetsDir, 'fonts'));
  for (const [name, module] of Object.entries(READER_FONTS)) {
    const asset = await Asset.fromModule(module).downloadAsync();
    if (!asset.localUri) continue;
    const dest = new File(fontsDir, name);
    if (dest.exists) dest.delete();
    new File(asset.localUri).copySync(dest);
  }

  const sample = ensureDirectory(new Directory(groupPaths.samples(), 'welcome'));
  ensureDirectory(new Directory(sample, 'images'));
  new File(sample, 'content.html').write(sampleHtml);
  new File(sample, 'meta.json').write(JSON.stringify(sampleMeta()));

  repo.setSetting('seed_version', SEED_VERSION);
}
