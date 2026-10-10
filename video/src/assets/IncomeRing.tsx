import type React from 'react';
import { useId } from 'react';
import { svgId } from '../lib/anim';
import { C, FONT } from '../theme';

type IncomeRingProps = {
  readonly size?: number;
  /** 0..1 of the term already elapsed; omit before purchase. */
  readonly elapsed?: number;
  /** Visibility of the term track and expiry pin. */
  readonly termShow?: number;
  readonly spin?: number;
  readonly glow?: number;
  readonly ticks?: number;
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * The income right: a ring of light lifted off the asset.
 * Its outer track is the term clock; the pin at 12 o'clock is the expiry.
 */
export const IncomeRing: React.FC<IncomeRingProps> = ({
  size = 260,
  elapsed,
  termShow = 1,
  spin = 0,
  glow = 1,
  ticks = 6,
  children,
  style,
}) => {
  const id = svgId(useId(), 'ring');
  const e = Math.max(0, Math.min(1, elapsed ?? 0));
  const knob = ((-90 + e * 360) * Math.PI) / 180;
  return (
    <div style={{ position: 'relative', width: size, height: size, ...style }}>
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.35,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(153,227,158,${0.2 * glow}) 30%, transparent 62%)`,
        }}
      />
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        style={{ position: 'absolute', overflow: 'visible' }}
      >
        <defs>
          <linearGradient
            id={`${id}-g`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
            gradientTransform={`rotate(${spin} 0.5 0.5)`}
          >
            <stop offset="0" stopColor="#e6ffe7" />
            <stop offset="0.35" stopColor={C.green1} />
            <stop offset="0.7" stopColor={C.green3} />
            <stop offset="1" stopColor="#a99fff" />
          </linearGradient>
        </defs>
        <circle
          cx="120"
          cy="120"
          r="86"
          fill="none"
          stroke={C.green1}
          strokeOpacity={0.12 * glow}
          strokeWidth="24"
        />
        <circle
          cx="120"
          cy="120"
          r="86"
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth="7"
        />
        <circle
          cx="120"
          cy="120"
          r="86"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.55"
          strokeWidth="1.2"
        />
        <circle
          cx="120"
          cy="120"
          r="71"
          fill="none"
          stroke={C.text1}
          strokeOpacity="0.14"
          strokeWidth="1"
        />
        {Array.from({ length: ticks }, (_, i) => {
          const a = ((-90 + (i * 360) / ticks) * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={120 + Math.cos(a) * 99}
              y1={120 + Math.sin(a) * 99}
              x2={120 + Math.cos(a) * 107}
              y2={120 + Math.sin(a) * 107}
              stroke={C.mint}
              strokeOpacity={0.55 * termShow}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
        {elapsed !== undefined ? (
          <g opacity={termShow}>
            <circle
              cx="120"
              cy="120"
              r="114"
              fill="none"
              stroke={C.green1}
              strokeOpacity="0.14"
              strokeWidth="4"
            />
            <circle
              cx="120"
              cy="120"
              r="114"
              fill="none"
              stroke={C.green1}
              strokeWidth="4.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${e * 100} 100`}
              transform="rotate(-90 120 120)"
            />
            <circle
              cx={120 + Math.cos(knob) * 114}
              cy={120 + Math.sin(knob) * 114}
              r="7"
              fill="#effff0"
              stroke={C.green1}
              strokeWidth="3"
            />
            <path d="M120 -2 l7 9 -7 9 -7 -9Z" fill={C.text1} />
          </g>
        ) : null}
      </svg>
      {children ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontFamily: FONT,
            color: C.text1,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
