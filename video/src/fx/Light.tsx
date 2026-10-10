import type React from 'react';
import { random, useCurrentFrame } from 'remotion';
import { noise1 } from './Camera';

/** Anamorphic lens flare: horizontal streak + core glow. Screen-blended. */
export const Flare: React.FC<{
  readonly x: number;
  readonly y: number;
  /** 0..1 intensity. */
  readonly amount: number;
  readonly color?: string;
  readonly width?: number;
}> = ({ x, y, amount, color = '153, 227, 158', width = 1400 }) => {
  if (amount <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: x - (width * (0.6 + amount * 0.4)) / 2,
          top: y - 3,
          width: width * (0.6 + amount * 0.4),
          height: 6,
          borderRadius: 6,
          background: `linear-gradient(90deg, transparent, rgba(${color}, ${0.55 * amount}) 35%, rgba(255,255,255,${0.95 * amount}) 50%, rgba(${color}, ${0.55 * amount}) 65%, transparent)`,
          filter: 'blur(2px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 160,
          top: y - 160,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,${0.9 * amount}) 0%, rgba(${color}, ${0.45 * amount}) 18%, transparent 60%)`,
        }}
      />
    </div>
  );
};

/** Full-frame colored bloom for transitions and big hits. */
export const Bloom: React.FC<{
  readonly amount: number;
  readonly x?: number;
  readonly y?: number;
  readonly color?: string;
  readonly radius?: number;
}> = ({ amount, x = 960, y = 540, color = '153, 227, 158', radius = 1300 }) => {
  if (amount <= 0.005) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        background: `radial-gradient(circle ${radius}px at ${x}px ${y}px, rgba(255,255,255,${0.75 * amount}) 0%, rgba(${color}, ${0.6 * amount}) 22%, rgba(${color}, ${0.18 * amount}) 55%, transparent 100%)`,
      }}
    />
  );
};

/** Volumetric beams from above (dividend arrival). */
export const GodRays: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly amount: number;
  readonly height?: number;
}> = ({ x, y, amount, height = 900 }) => {
  const frame = useCurrentFrame();
  if (amount <= 0.01) return null;
  const rays = [-18, -9, -3, 4, 11, 20];
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    >
      {rays.map((deg, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - 40 - i * 4,
            top: y - height,
            width: 80 + i * 8,
            height,
            transformOrigin: '50% 100%',
            transform: `rotate(${deg + Math.sin(frame / 40 + i) * 2}deg)`,
            background: `linear-gradient(0deg, rgba(190, 245, 195, ${0.32 * amount}) 0%, rgba(153, 227, 158, ${0.1 * amount}) 45%, transparent 100%)`,
            filter: 'blur(14px)',
          }}
        />
      ))}
    </div>
  );
};

/** A diagonal band of light that travels across the frame (time-lapse, reveals). */
export const LightSweep: React.FC<{
  readonly progress: number;
  readonly amount?: number;
  readonly color?: string;
}> = ({ progress, amount = 1, color = '200, 245, 205' }) => {
  if (progress <= 0 || progress >= 1 || amount <= 0) return null;
  const x = -40 + progress * 180;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        background: `linear-gradient(105deg, transparent ${x - 22}%, rgba(${color}, ${0.16 * amount}) ${x - 6}%, rgba(255,255,255,${0.22 * amount}) ${x}%, rgba(${color}, ${0.16 * amount}) ${x + 6}%, transparent ${x + 22}%)`,
      }}
    />
  );
};

/** Radial speed streaks for fly-through transitions. */
export const Warp: React.FC<{
  readonly amount: number;
  readonly x?: number;
  readonly y?: number;
  readonly color?: string;
}> = ({ amount, x = 960, y = 540, color = '200, 245, 205' }) => {
  const frame = useCurrentFrame();
  if (amount <= 0.01) return null;
  return (
    <svg
      width={1920}
      height={1080}
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: 70 }, (_, i) => {
        const a = random(`warp-a-${i}`) * Math.PI * 2;
        const speed = 0.5 + random(`warp-s-${i}`);
        const phase = (random(`warp-p-${i}`) + frame * 0.06 * speed) % 1;
        const r0 = 120 + phase * 1100;
        const len = (60 + 380 * phase) * amount;
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r0}
            y1={y + Math.sin(a) * r0}
            x2={x + Math.cos(a) * (r0 + len)}
            y2={y + Math.sin(a) * (r0 + len)}
            stroke={`rgba(${color}, ${0.7 * amount * phase})`}
            strokeWidth={1 + 2.5 * phase}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** Drifting colored light leaks; strength rises around transitions. */
export const LightLeaks: React.FC<{
  readonly amount: number;
  readonly purple?: number;
}> = ({ amount, purple = 0 }) => {
  const frame = useCurrentFrame();
  if (amount <= 0.01) return null;
  const blobs = [
    { c: purple > 0.5 ? '124, 114, 254' : '153, 227, 158', s: 'a', r: 900 },
    { c: '255, 222, 160', s: 'b', r: 700 },
    { c: purple > 0.5 ? '170, 150, 255' : '120, 210, 190', s: 'c', r: 800 },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    >
      {blobs.map((b, i) => {
        const x = 960 + noise1(`leak-x-${b.s}`, frame / 120) * 1100;
        const y = 540 + noise1(`leak-y-${b.s}`, frame / 140) * 700;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - b.r,
              top: y - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${b.c}, ${(i === 1 ? 0.07 : 0.14) * amount}) 0%, transparent 65%)`,
            }}
          />
        );
      })}
    </div>
  );
};

/** Out-of-focus foreground orbs that parallax faster than the world. */
export const Bokeh: React.FC<{
  readonly camX?: number;
  readonly camY?: number;
  readonly amount?: number;
  readonly purple?: number;
}> = ({ camX = 0, camY = 0, amount = 1, purple = 0 }) => {
  const frame = useCurrentFrame();
  if (amount <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 6 }, (_, i) => {
        const r = (k: string) => random(`bokeh-${i}-${k}`);
        const size = 90 + r('s') * 170;
        const span = 1920 + 600;
        const x =
          ((((r('x') * span - camX * 1.6 + frame * (0.3 + r('v') * 0.4)) %
            span) +
            span) %
            span) -
          300;
        // Keep foreground glass near the edges, clear of the story and captions.
        const y =
          (i % 2 === 0 ? 60 + r('y') * 130 : 910 + r('y') * 100) -
          camY * 0.15 +
          Math.sin(frame / 60 + i) * 20;
        const tint =
          purple > 0.5 || r('t') > 0.75 ? '185, 175, 255' : '190, 240, 200';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${tint}, 0.10) 0%, rgba(${tint}, 0.07) 55%, rgba(${tint}, 0.12) 68%, transparent 72%)`,
              filter: 'blur(6px)',
              opacity: amount * (0.5 + 0.5 * r('o')),
            }}
          />
        );
      })}
    </div>
  );
};
