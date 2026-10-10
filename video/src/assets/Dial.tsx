import type React from 'react';
import { useId } from 'react';
import { svgId } from '../lib/anim';
import { C, FONT } from '../theme';

type DialProps = {
  readonly size?: number;
  /** Income in the period, DemoUSD-equivalent; 200 fills the ring. */
  readonly income: number;
  /** Buyer's share 0..1. */
  readonly share: number;
  readonly children?: React.ReactNode;
};

/** Income allocation ring: buyer arc (mint) + seller arc (neutral). */
export const AllocationDial: React.FC<DialProps> = ({
  size = 520,
  income,
  share,
  children,
}) => {
  const id = svgId(useId(), 'dial');
  const total = Math.max(0, Math.min(1, income / 200)) * 100;
  const buyer = total * share;
  const seller = total - buyer;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.25,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(153,227,158,${0.06 + (buyer / 100) * 0.25}) 30%, transparent 62%)`,
        }}
      />
      <svg
        viewBox="0 0 300 300"
        width={size}
        height={size}
        style={{ position: 'absolute', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d7ffd9" />
            <stop offset="1" stopColor={C.green2} />
          </linearGradient>
        </defs>
        <circle
          cx="150"
          cy="150"
          r="118"
          fill="rgba(8, 14, 14, 0.75)"
          stroke="rgba(229,229,231,0.08)"
          strokeWidth="1"
        />
        <circle
          cx="150"
          cy="150"
          r="128"
          fill="none"
          stroke="rgba(229,229,231,0.07)"
          strokeWidth="22"
        />
        {Array.from({ length: 40 }, (_, i) => {
          const a = ((i / 40) * 360 - 90) * (Math.PI / 180);
          const long = i % 10 === 0;
          return (
            <line
              key={i}
              x1={150 + Math.cos(a) * 144}
              y1={150 + Math.sin(a) * 144}
              x2={150 + Math.cos(a) * (long ? 152 : 148)}
              y2={150 + Math.sin(a) * (long ? 152 : 148)}
              stroke={C.text2}
              strokeOpacity={long ? 0.6 : 0.25}
              strokeWidth={long ? 1.6 : 1}
            />
          );
        })}
        <circle
          cx="150"
          cy="150"
          r="128"
          fill="none"
          stroke={C.text2}
          strokeOpacity="0.5"
          strokeWidth="22"
          pathLength={100}
          strokeDasharray={`${Math.max(0, seller)} 100`}
          strokeDashoffset={-buyer}
          transform="rotate(-90 150 150)"
        />
        <circle
          cx="150"
          cy="150"
          r="128"
          fill="none"
          stroke={`url(#${id}-b)`}
          strokeWidth="22"
          pathLength={100}
          strokeDasharray={`${Math.max(0, buyer)} 100`}
          transform="rotate(-90 150 150)"
          style={{ filter: 'drop-shadow(0 0 8px rgba(153,227,158,0.6))' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          fontFamily: FONT,
          color: C.text1,
        }}
      >
        {children}
      </div>
    </div>
  );
};
