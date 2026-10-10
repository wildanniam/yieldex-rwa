import { Easing, interpolate, spring, type SpringConfig } from 'remotion';

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

/** Clamped single-segment interpolation. */
export const tween = (
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = easeOut,
) => interpolate(frame, [start, end], [from, to], { ...CLAMP, easing });

/** Clamped multi-keyframe interpolation; easing applies per segment. */
export const keys = (
  frame: number,
  input: number[],
  output: number[],
  easing: (t: number) => number = easeInOut,
) => interpolate(frame, input, output, { ...CLAMP, easing });

/** Springy arrival with a little overshoot. */
export const pop = (
  frame: number,
  start: number,
  config: Partial<SpringConfig> = {},
  fps = 30,
) =>
  spring({
    frame: frame - start,
    fps,
    config: { damping: 13, stiffness: 140, mass: 0.9, ...config },
  });

/** Critically damped settle, no overshoot. */
export const settle = (frame: number, start: number, fps = 30) =>
  spring({ frame: frame - start, fps, config: { damping: 200 } });

/** Visible between an eased fade-in and fade-out. */
export const life = (
  frame: number,
  inStart: number,
  outStart = Infinity,
  inLen = 14,
  outLen = 12,
) =>
  Math.min(
    tween(frame, inStart, inStart + inLen),
    Number.isFinite(outStart)
      ? 1 - tween(frame, outStart, outStart + outLen, 0, 1, easeIn)
      : 1,
  );

export type Point = { x: number; y: number };

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Point on a quadratic arc that bulges `lift` px above the chord. */
export const arcPoint = (
  t: number,
  a: Point,
  b: Point,
  lift: number,
): Point => {
  const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - lift };
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
};

export const arcPath = (a: Point, b: Point, lift: number) => {
  const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - lift };
  return `M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`;
};

export const fixed = (value: number, digits = 2) => value.toFixed(digits);

/** SVG-safe unique id from React useId output. */
export const svgId = (raw: string, name: string) =>
  `${name}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
