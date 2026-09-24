// Generates the share extension's Swift theme + doodles from the TS design sources,
// and copies the fonts the extension renders with.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import doodleData from '../src/design/doodles/doodles.json';
import { colors, fonts } from '../src/design/tokens';
import { renderDoodlesSwift, renderThemeSwift } from './lib/swiftgen';

const root = join(__dirname, '..');
const out = join(root, 'targets/share/generated');
mkdirSync(out, { recursive: true });

writeFileSync(join(out, 'Theme.swift'), renderThemeSwift(colors, fonts));
writeFileSync(join(out, 'Doodles.swift'), renderDoodlesSwift(doodleData));

for (const font of ['GeistMono-Regular.ttf', 'GeistMono-Medium.ttf', 'InstrumentSerif-Italic.ttf']) {
  copyFileSync(join(root, 'assets/fonts', font), join(out, font));
}

console.log(`gen-swift: wrote Theme.swift, Doodles.swift (${doodleData.doodles.length} doodles) → ${out}`);
