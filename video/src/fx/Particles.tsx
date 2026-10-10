import type React from 'react';
import { random } from 'remotion';

type BurstProps = {
  readonly frame: number;
  readonly at: number;
  readonly x: number;
  readonly y: number;
  readonly count?: number;
  readonly color?: string;
  readonly speed?: number;
  /** Frames each particle lives. */
  readonly life?: number;
  readonly gravity?: number;
  readonly size?: number;
  /** Emission cone: center angle and spread in radians. */
  readonly angle?: number;
  readonly spread?: number;
  readonly seed?: string;
};

/** Radial spark burst with drag, gravity and fade. */
export const Burst: React.FC<BurstProps> = ({
  frame,
  at,
  x,
  y,
  count = 26,
  color = '#c9f7cc',
  speed = 14,
  life = 34,
  gravity = 0.25,
  size = 7,
  angle = -Math.PI / 2,
  spread = Math.PI * 2,
  seed = 'burst',
}) => {
  const t = frame - at;
  if (t < 0 || t > life + 10) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: string) => random(`${seed}-${at}-${i}-${k}`);
        const ang = angle + (r('a') - 0.5) * spread;
        const v = speed * (0.35 + r('v') * 0.9);
        const own = life * (0.55 + r('l') * 0.45);
        if (t > own) return null;
        // Velocity decays with drag 0.9 per frame: distance = v * (1 - 0.9^t) / 0.1.
        const dist = (v * (1 - Math.pow(0.9, t))) / 0.1;
        const px = x + Math.cos(ang) * dist;
        const py = y + Math.sin(ang) * dist + gravity * t * t * 0.5;
        const k = 1 - t / own;
        const s = size * (0.5 + r('s')) * (0.4 + 0.6 * k);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px - s / 2,
              top: py - s / 2,
              width: s,
              height: s,
              borderRadius: '50%',
              background: color,
              opacity: k,
              boxShadow: `0 0 ${s * 2.5}px ${color}`,
            }}
          />
        );
      })}
    </>
  );
};

/** Expanding ring of light. */
export const Shockwave: React.FC<{
  readonly frame: number;
  readonly at: number;
  readonly x: number;
  readonly y: number;
  readonly radius?: number;
  readonly color?: string;
  readonly life?: number;
  readonly width?: number;
}> = ({
  frame,
  at,
  x,
  y,
  radius = 420,
  color = '#a9f0ae',
  life = 26,
  width = 6,
}) => {
  const t = (frame - at) / life;
  if (t < 0 || t > 1) return null;
  const e = 1 - Math.pow(1 - t, 3);
  const r = radius * e;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        border: `${width * (1 - t) + 1}px solid ${color}`,
        opacity: 1 - t,
        boxShadow: `0 0 ${30 * (1 - t)}px ${color}, inset 0 0 ${30 * (1 - t)}px ${color}`,
      }}
    />
  );
};

/** Slow rising motes around an object. */
export const Motes: React.FC<{
  readonly frame: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly count?: number;
  readonly color?: string;
  readonly opacity?: number;
  readonly seed?: string;
}> = ({
  frame,
  x,
  y,
  w,
  h,
  count = 18,
  color = '#bff0c3',
  opacity = 1,
  seed = 'motes',
}) => (
  <>
    {Array.from({ length: count }, (_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const period = 90 + r('p') * 90;
      const t = ((frame + r('o') * period) % period) / period;
      const px = x + (r('x') - 0.5) * w + Math.sin(frame / 30 + i) * 10;
      const py = y + h / 2 - t * h;
      const s = 2 + r('s') * 4;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: px,
            top: py,
            width: s,
            height: s,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 ${s * 3}px ${color}`,
            opacity: opacity * Math.sin(t * Math.PI) * 0.8,
          }}
        />
      );
    })}
  </>
);
