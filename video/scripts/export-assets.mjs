// Render the asset kit (contact sheets + transparent PNG per asset) into out/assets.
import { bundle } from '@remotion/bundler';
import { getCompositions, renderStill } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] ?? 'out/assets';
mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const compositions = await getCompositions(serveUrl);
const kit = compositions.filter(
  (c) => c.id.startsWith('asset-') || c.id.startsWith('AssetSheet'),
);
for (const composition of kit) {
  const output = path.join(outDir, `${composition.id}.png`);
  await renderStill({ serveUrl, composition, output, imageFormat: 'png' });
  console.log(output);
}
