import type React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { easeIn, tween } from '../lib/anim';
import { C, FONT } from '../theme';

export type Line = { readonly text: string; readonly color?: string };

type KineticProps = {
  readonly lines: readonly Line[];
  /** Frame the first word starts entering. */
  readonly start: number;
  /** Frame the block starts leaving. */
  readonly end?: number;
  readonly size?: number;
  readonly weight?: number;
  readonly align?: 'left' | 'center' | 'right';
  readonly stagger?: number;
  readonly style?: React.CSSProperties;
};

/** Word-by-word rise with focus pull; exits as one block. */
export const Kinetic: React.FC<KineticProps> = ({
  lines,
  start,
  end,
  size = 96,
  weight = 460,
  align = 'center',
  stagger = 2.4,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = end === undefined ? 0 : tween(frame, end, end + 14, 0, 1, easeIn);
  if (frame < start - 1 || out >= 1) return null;
  let index = 0;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.035em',
        lineHeight: 1.1,
        textAlign: align,
        color: C.text1,
        opacity: 1 - out,
        translate: `0 ${-out * size * 0.35}px`,
        filter: out > 0 ? `blur(${out * 10}px)` : undefined,
        ...style,
      }}
    >
      {lines.map((line, li) => {
        const words = line.text.split(' ');
        return (
          <div
            key={li}
            style={{ color: line.color ?? C.text1, whiteSpace: 'nowrap' }}
          >
            {words.map((word, wi) => {
              const i = index++;
              const at = start + i * stagger;
              const p = spring({
                frame: frame - at,
                fps,
                config: { damping: 18, stiffness: 110, mass: 0.75 },
              });
              const vis = tween(frame, at, at + 10);
              return (
                <span
                  key={wi}
                  style={{
                    display: 'inline-block',
                    opacity: vis,
                    translate: `0 ${(1 - p) * size * 0.5}px`,
                    filter:
                      vis < 0.98 ? `blur(${(1 - vis) * 12}px)` : undefined,
                    marginRight: wi < words.length - 1 ? '0.26em' : 0,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** Screen-space caption band, kept inside the title-safe area. */
export const Caption: React.FC<
  KineticProps & { readonly position?: 'top' | 'bottom' | 'center' }
> = ({ position = 'bottom', size = 72, ...props }) => {
  const placement: React.CSSProperties =
    position === 'top'
      ? { top: 110 }
      : position === 'center'
        ? { top: '50%', translate: '0 -50%' }
        : { bottom: 104 };
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'center',
        ...placement,
      }}
    >
      <Kinetic size={size} {...props} />
    </div>
  );
};

type ChipTone = 'neutral' | 'green' | 'purple' | 'solid';

const TONES: Record<
  ChipTone,
  { bg: string; border: string; text: string; dot: string }
> = {
  neutral: {
    bg: 'rgba(10, 18, 20, 0.82)',
    border: 'rgba(171, 194, 181, 0.28)',
    text: '#cfdcd2',
    dot: C.green1,
  },
  green: {
    bg: 'rgba(17, 40, 26, 0.85)',
    border: 'rgba(153, 227, 158, 0.45)',
    text: '#d9f5db',
    dot: C.green1,
  },
  purple: {
    bg: 'rgba(28, 22, 70, 0.85)',
    border: 'rgba(124, 114, 254, 0.55)',
    text: '#e1ddff',
    dot: C.purple1,
  },
  solid: {
    bg: 'linear-gradient(180deg, #99E39E, #63C16B 55%, #55B75E)',
    border: 'rgba(214, 255, 216, 0.6)',
    text: C.primaryLabel,
    dot: C.primaryLabel,
  },
};

type ChipProps = {
  readonly children: React.ReactNode;
  /** 0..1 entrance progress (spring values above 1 are fine). */
  readonly show?: number;
  readonly tone?: ChipTone;
  readonly size?: number;
  readonly dot?: boolean;
  readonly icon?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

export const Chip: React.FC<ChipProps> = ({
  children,
  show = 1,
  tone = 'neutral',
  size = 28,
  dot = true,
  icon,
  style,
}) => {
  const t = TONES[tone];
  const vis = Math.max(0, Math.min(1, show));
  if (vis <= 0.001) return null;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.45,
        padding: `${size * 0.42}px ${size * 0.8}px`,
        borderRadius: 999,
        background: t.bg,
        border: `1.5px solid ${t.border}`,
        color: t.text,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        opacity: vis,
        scale: String(0.86 + 0.14 * show),
        filter: vis < 0.98 ? `blur(${(1 - vis) * 8}px)` : undefined,
        ...style,
      }}
    >
      {icon ??
        (dot ? (
          <i
            style={{
              width: size * 0.32,
              height: size * 0.32,
              borderRadius: '50%',
              background: t.dot,
              boxShadow: `0 0 ${size * 0.5}px ${t.dot}`,
            }}
          />
        ) : null)}
      {children}
    </div>
  );
};

/** Small uppercase label used on world objects. */
export const Kicker: React.FC<{
  readonly children: React.ReactNode;
  readonly size?: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
}> = ({ children, size = 18, color = '#9cab9f', style }) => (
  <span
    style={{
      fontFamily: FONT,
      fontSize: size,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color,
      fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </span>
);
