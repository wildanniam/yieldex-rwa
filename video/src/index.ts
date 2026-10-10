import { loadFont } from '@remotion/fonts';
import { registerRoot, staticFile } from 'remotion';
import { RemotionRoot } from './Root';

loadFont({
  family: 'Inter',
  url: staticFile('fonts/InterVariable.woff2'),
  weight: '100 900',
});

registerRoot(RemotionRoot);
