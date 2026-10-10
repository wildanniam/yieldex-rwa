import type React from 'react';
import { useId } from 'react';
import { svgId } from '../lib/anim';
import { C, FONT } from '../theme';
import { CoinFace } from './Coins';

type Tone = 'green' | 'slate' | 'teal';

const AVATAR_TONES: Record<Tone, { core: string; edge: string; ring: string }> =
  {
    green: {
      core: '#4f7a55',
      edge: '#12261d',
      ring: 'rgba(153, 227, 158, 0.35)',
    },
    slate: {
      core: '#566b80',
      edge: '#111b26',
      ring: 'rgba(190, 210, 230, 0.32)',
    },
    teal: {
      core: '#3f7472',
      edge: '#0f2221',
      ring: 'rgba(160, 225, 215, 0.32)',
    },
  };

type AvatarProps = {
  readonly name: string;
  readonly role: string;
  readonly tone?: Tone;
  readonly size?: number;
  /** 0..1 entrance (spring overshoot welcome). */
  readonly show?: number;
  /** 0..1 highlight halo. */
  readonly active?: number;
};

/** A market participant: initial disc with soft halo, name and role. */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  role,
  tone = 'green',
  size = 150,
  show = 1,
  active = 0,
}) => {
  const t = AVATAR_TONES[tone];
  const vis = Math.max(0, Math.min(1, show));
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        opacity: vis,
        scale: String(0.7 + 0.3 * show),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.16,
          borderRadius: '50%',
          border: `1.5px solid ${t.ring}`,
          boxShadow: `0 0 ${40 + active * 50}px ${t.ring}`,
          opacity: 0.5 + active * 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: `radial-gradient(circle at 32% 20%, ${t.core}, ${t.edge} 72%)`,
          border: '1.5px solid rgba(214, 232, 216, 0.35)',
          boxShadow:
            'inset 0 2px 0 rgba(255,255,255,0.12), 0 24px 50px rgba(0,0,0,0.5)',
          fontFamily: FONT,
          fontSize: size * 0.4,
          fontWeight: 500,
          color: '#eef7ef',
          letterSpacing: '-0.03em',
        }}
      >
        {name[0]}
      </div>
      <div
        style={{
          position: 'absolute',
          top: size + size * 0.22,
          left: '50%',
          translate: '-50% 0',
          textAlign: 'center',
          fontFamily: FONT,
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            color: C.text1,
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 25, color: C.text2, marginTop: 4 }}>{role}</div>
      </div>
    </div>
  );
};

type BalanceProps = {
  readonly amount: number;
  readonly delta?: number;
  /** 0..1 visibility of the delta flash. */
  readonly deltaShow?: number;
  readonly show?: number;
};

/** Wallet balance in DemoUSD with an optional +/− flash. */
export const Balance: React.FC<BalanceProps> = ({
  amount,
  delta,
  deltaShow = 0,
  show = 1,
}) => {
  const vis = Math.max(0, Math.min(1, show));
  const flash = Math.max(0, Math.min(1, deltaShow));
  const positive = (delta ?? 0) > 0;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px 10px 10px',
        borderRadius: 999,
        background: 'rgba(9, 16, 18, 0.88)',
        border: `1.5px solid ${flash > 0.05 && positive ? `rgba(153,227,158,${0.3 + flash * 0.5})` : 'rgba(171, 194, 181, 0.26)'}`,
        fontFamily: FONT,
        whiteSpace: 'nowrap',
        opacity: vis,
        scale: String(0.85 + 0.15 * show),
        boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div style={{ width: 38, height: 38 }}>
        <CoinFace variant="pay" />
      </div>
      <span
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: C.text1,
          letterSpacing: '-0.02em',
        }}
      >
        {Math.round(amount).toLocaleString('en-US')}
      </span>
      <span style={{ fontSize: 22, color: C.text2 }}>DemoUSD</span>
      {delta !== undefined && flash > 0 ? (
        <span
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: positive ? C.green1 : C.text2,
            opacity: flash,
            marginLeft: 4,
          }}
        >
          {positive ? '+' : '−'}
          {Math.abs(delta)}
        </span>
      ) : null}
    </div>
  );
};

type ClaimTrayProps = {
  /** Claimable demoAAPL. */
  readonly amount: number;
  readonly show?: number;
  readonly pulse?: number;
  readonly width?: number;
  readonly note?: string;
};

/** Glass dish holding allocated, claimable income. */
export const ClaimTray: React.FC<ClaimTrayProps> = ({
  amount,
  show = 1,
  pulse = 0,
  width = 250,
  note,
}) => {
  const id = svgId(useId(), 'tray');
  const vis = Math.max(0, Math.min(1, show));
  const stack = Math.round(amount * 2);
  return (
    <div
      style={{
        position: 'relative',
        width,
        opacity: vis,
        translate: `0 ${(1 - show) * 30}px`,
      }}
    >
      <svg
        viewBox="0 0 250 120"
        width={width}
        height={(width * 120) / 250}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop
              offset="0"
              stopColor={C.green1}
              stopOpacity={0.25 + pulse * 0.45}
            />
            <stop offset="1" stopColor={C.green1} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-side`} x1="0" x2="1">
            <stop offset="0" stopColor="#264131" />
            <stop offset="0.35" stopColor="#a6cfab" />
            <stop offset="1" stopColor="#1b3023" />
          </linearGradient>
        </defs>
        <ellipse cx="125" cy="78" rx="150" ry="52" fill={`url(#${id}-glow)`} />
        <ellipse
          cx="125"
          cy="80"
          rx="116"
          ry="34"
          fill="rgba(16, 33, 25, 0.75)"
          stroke="#bfe5c6"
          strokeOpacity={0.4 + pulse * 0.4}
          strokeWidth="2"
        />
        <ellipse
          cx="125"
          cy="76"
          rx="96"
          ry="25"
          fill="none"
          stroke="#bfe5c6"
          strokeOpacity="0.16"
        />
        {Array.from({ length: stack }, (_, k) => {
          const y = 72 - k * 11;
          return (
            <g key={k}>
              <path
                d={`M80 ${y} v9 a45 16 0 0 0 90 0 v-9 Z`}
                fill={`url(#${id}-side)`}
              />
              <ellipse
                cx="125"
                cy={y}
                rx="45"
                ry="16"
                fill="#2f523b"
                stroke="#d2f2d6"
                strokeOpacity="0.8"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="0"
                transform={`translate(125 ${y + 6}) scale(1.2 0.6)`}
                textAnchor="middle"
                fontFamily="Inter"
                fontWeight={600}
                fontSize="20"
                fill="#e2f7e4"
              >
                A
              </text>
            </g>
          );
        })}
      </svg>
      <div
        style={{
          textAlign: 'center',
          fontFamily: FONT,
          marginTop: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: '0.16em',
            color: '#9cab9f',
            fontWeight: 500,
          }}
        >
          CLAIMABLE
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: amount > 0 ? C.green1 : C.text3,
            letterSpacing: '-0.02em',
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {amount.toFixed(2)}{' '}
          <span style={{ fontSize: 24, fontWeight: 500, color: C.text2 }}>
            demoAAPL
          </span>
        </div>
        {note ? (
          <div style={{ fontSize: 22, color: C.text2, marginTop: 6 }}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
};
