import type React from 'react';
import { C, FONT } from '../theme';

/** Pointer with an optional click ripple. */
export const Cursor: React.FC<{
  readonly x: number;
  readonly y: number;
  /** 0..1 click ripple progress; 0 = none. */
  readonly click?: number;
  readonly show?: number;
  readonly size?: number;
}> = ({ x, y, click = 0, show = 1, size = 54 }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      opacity: show,
      pointerEvents: 'none',
    }}
  >
    {click > 0 && click < 1 ? (
      <div
        style={{
          position: 'absolute',
          left: -40 * (0.4 + click),
          top: -40 * (0.4 + click),
          width: 80 * (0.4 + click),
          height: 80 * (0.4 + click),
          borderRadius: '50%',
          border: `3px solid ${C.green1}`,
          opacity: 1 - click,
        }}
      />
    ) : null}
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        position: 'absolute',
        left: -4,
        top: -2,
        scale: String(click > 0 && click < 0.4 ? 0.88 : 1),
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))',
      }}
    >
      <path
        d="M4 2.5 19.5 12 12.4 13.6 8.9 20.6Z"
        fill="#f6f8f7"
        stroke="#0b1210"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

type CapsuleProps = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** 0..1 outline draw progress. */
  readonly draw: number;
  /** 0..1 settled state (check + solid glow). */
  readonly done?: number;
  readonly label: string;
  readonly doneLabel?: string;
  readonly opacity?: number;
};

/**
 * Atomic transaction boundary: one outline around both transfers.
 * Either everything inside settles, or nothing does.
 */
export const AtomicCapsule: React.FC<CapsuleProps> = ({
  x,
  y,
  width,
  height,
  draw,
  done = 0,
  label,
  doneLabel = 'Settled',
  opacity = 1,
}) => {
  const r = 70;
  return (
    <div
      style={{ position: 'absolute', left: x, top: y, width, height, opacity }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', overflow: 'visible' }}
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={r}
          fill={`rgba(153, 227, 158, ${0.025 + done * 0.03})`}
          stroke={C.green1}
          strokeOpacity={0.12}
          strokeWidth={2}
          opacity={draw}
        />
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={r}
          fill="none"
          stroke={C.green1}
          strokeOpacity={0.75}
          strokeWidth={3}
          strokeDasharray={`${draw * 100} 100`}
          pathLength={100}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 ${8 + done * 14}px rgba(153,227,158,0.6))`,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: -30,
          left: '50%',
          translate: '-50% 0',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 26px',
          borderRadius: 999,
          background:
            done > 0.5
              ? 'linear-gradient(180deg, #99E39E, #63C16B 55%, #55B75E)'
              : 'rgba(10, 22, 16, 0.95)',
          border: `1.5px solid rgba(153, 227, 158, ${0.5 + done * 0.4})`,
          color: done > 0.5 ? C.primaryLabel : '#d9f5db',
          fontFamily: FONT,
          fontSize: 27,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          opacity: Math.min(1, draw * 3),
          boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
        }}
      >
        {done > 0.5 ? (
          <svg width={30} height={30} viewBox="0 0 24 24">
            <path
              d="M5 12.5 10 17.5 19.5 7"
              fill="none"
              stroke={C.primaryLabel}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <rect
              x="3"
              y="6"
              width="18"
              height="12"
              rx="6"
              fill="none"
              stroke={C.green1}
              strokeWidth="2"
            />
            <path
              d="M9 12h6"
              stroke={C.green1}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {done > 0.5 ? doneLabel : label}
      </div>
    </div>
  );
};

/** Glowing trail behind a travelling token, drawn along an SVG path. */
export const Trail: React.FC<{
  readonly d: string;
  /** 0..1 head position. */
  readonly head: number;
  readonly color?: string;
  readonly length?: number;
  readonly opacity?: number;
  readonly width?: number;
}> = ({ d, head, color = C.green1, length = 0.28, opacity = 1, width = 5 }) => {
  const tail = Math.max(0, head - length);
  return (
    <svg
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
      width={1}
      height={1}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeOpacity={0.12 * opacity}
        strokeWidth={2}
        strokeDasharray="3 9"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeOpacity={0.85 * opacity}
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.0001, head - tail)} 2`}
        strokeDashoffset={-tail}
        style={{ filter: `drop-shadow(0 0 10px ${color})` }}
      />
    </svg>
  );
};
