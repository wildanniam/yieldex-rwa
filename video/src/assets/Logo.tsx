import type React from 'react';
import { useId } from 'react';
import { useCurrentFrame } from 'remotion';
import { pop, svgId } from '../lib/anim';
import { FONT } from '../theme';

/** Facets from the footer mark (apps/web footer-brand.tsx), viewBox 170×180. */
const FACETS = [
  {
    d: 'M6 20h80L43 95 2 29Q0 20 6 20Z',
    from: ['#2c6b3a', '#1c4426'],
    dx: -70,
    dy: -50,
    rot: -24,
  },
  {
    d: 'M86 20h75q10 0 5 9L122 96Z',
    from: ['#b4e0ae', '#78ad78'],
    dx: 80,
    dy: -46,
    rot: 22,
  },
  {
    d: 'm86 20 36 76-44 72H3L43 95Z',
    from: ['#7fca82', '#3d8547'],
    dx: 30,
    dy: 70,
    rot: 14,
  },
  {
    d: 'm43 95 35 73H6q-6 0-2-8Z',
    from: ['#c3ebb7', '#83bf82'],
    dx: -66,
    dy: 64,
    rot: -18,
  },
] as const;

type LogoMarkProps = {
  readonly size?: number;
  /** Frame at which facets start assembling; omit for a static mark. */
  readonly assembleAt?: number;
  readonly glow?: number;
};

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 120,
  assembleAt,
  glow = 0,
}) => {
  const frame = useCurrentFrame();
  const id = svgId(useId(), 'logo');
  return (
    <svg
      viewBox="0 0 170 180"
      width={size}
      height={(size * 180) / 170}
      style={{
        overflow: 'visible',
        filter:
          glow > 0
            ? `drop-shadow(0 0 ${24 * glow}px rgba(153,227,158,${0.5 * glow}))`
            : undefined,
      }}
    >
      <defs>
        {FACETS.map((f, i) => (
          <linearGradient
            key={i}
            id={`${id}-${i}`}
            x1="0"
            y1="0"
            x2="0.4"
            y2="1"
          >
            <stop offset="0" stopColor={f.from[0]} />
            <stop offset="1" stopColor={f.from[1]} />
          </linearGradient>
        ))}
      </defs>
      {FACETS.map((f, i) => {
        const p =
          assembleAt === undefined
            ? 1
            : pop(frame, assembleAt + i * 4, { damping: 15, stiffness: 120 });
        const o = Math.max(0, Math.min(1, p * 1.6));
        return (
          <path
            key={i}
            d={f.d}
            fill={`url(#${id}-${i})`}
            opacity={o}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              translate: `${(1 - p) * f.dx}px ${(1 - p) * f.dy}px`,
              rotate: `${(1 - p) * f.rot}deg`,
            }}
          />
        );
      })}
    </svg>
  );
};

type WordmarkProps = {
  readonly size?: number;
  /** -0.3..1.3 position of the light sweep; omit for none. */
  readonly sweep?: number;
  readonly style?: React.CSSProperties;
};

export const Wordmark: React.FC<WordmarkProps> = ({
  size = 120,
  sweep,
  style,
}) => (
  <span
    style={{
      position: 'relative',
      display: 'inline-block',
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: '-0.045em',
      lineHeight: 1,
      ...style,
    }}
  >
    <span
      style={{
        backgroundImage:
          'linear-gradient(180deg, #ffffff 18%, #dff6e1 52%, #95da9b 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        filter: 'drop-shadow(0 0 28px rgba(153, 227, 158, 0.28))',
      }}
    >
      Yieldex
    </span>
    {sweep !== undefined ? (
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(105deg, transparent ${sweep * 100 - 14}%, rgba(255,255,255,0.95) ${sweep * 100}%, transparent ${sweep * 100 + 14}%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Yieldex
      </span>
    ) : null}
  </span>
);

/** Horizontal lockup: mark + wordmark. */
export const Lockup: React.FC<{
  readonly size?: number;
  readonly assembleAt?: number;
  readonly sweep?: number;
  readonly glow?: number;
}> = ({ size = 72, assembleAt, sweep, glow }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.32 }}>
    <LogoMark size={size * 0.95} assembleAt={assembleAt} glow={glow} />
    <Wordmark size={size} sweep={sweep} />
  </div>
);
