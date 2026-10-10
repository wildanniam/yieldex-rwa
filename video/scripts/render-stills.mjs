// Bundle once, then render named frames: node scripts/render-stills.mjs <Composition> <frame,frame,...> [outDir]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const [id = 'YieldexFilm', framesArg = '0', outDir = 'out/stills'] =
  process.argv.slice(2);
const frames = framesArg.split(',').map(Number);
mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id });
for (const frame of frames) {
  const output = path.join(
    outDir,
    `${id}-${String(frame).padStart(4, '0')}.png`,
  );
  await renderStill({ serveUrl, composition, frame, output });
  console.log(output);
}
