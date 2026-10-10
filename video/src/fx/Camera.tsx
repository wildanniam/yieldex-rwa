import type React from 'react';
import { random, useCurrentFrame } from 'remotion';
import { CUES } from '../cues';

/** Smooth deterministic 1D value noise in [-1, 1]. */
export const noise1 = (seed: string, t: number) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
};

const IMPULSES = CUES.filter((c) => c.shake).map((c) => ({
  at: c.at,
  amount: c.shake!,
}));

/** Global camera: slow handheld drift plus shake impulses shared with the SFX cues. */
export const useCamera = (frame: number) => {
  let shake = 0;
  for (const i of IMPULSES) {
    if (frame >= i.at && frame < i.at + 40)
      shake += i.amount * Math.exp(-(frame - i.at) / 7);
  }
  const drift = 1;
  return {
    x:
      noise1('cx', frame / 70) * 9 * drift +
      noise1('sx', frame / 1.6) * 26 * shake,
    y:
      noise1('cy', frame / 80) * 6 * drift +
      noise1('sy', frame / 1.6) * 20 * shake,
    rot:
      noise1('cr', frame / 90) * 0.25 + noise1('sr', frame / 1.8) * 0.6 * shake,
    zoom: 1 + shake * 0.025,
  };
};

export const CameraRig: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const cam = useCamera(frame);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.rot}deg) scale(${1.02 * cam.zoom})`,
      }}
    >
      {children}
    </div>
  );
};
