import type React from 'react';
import { useId } from 'react';
import { svgId } from '../lib/anim';
import { C } from '../theme';

type VaultProps = {
  readonly width?: number;
  /** 0 closed .. 1 lid fully lifted. */
  readonly open?: number;
  /** 0 unlocked .. 1 shackle closed. */
  readonly locked?: number;
  /** Per-coin drop progress, bottom coin first. */
  readonly coins?: readonly number[];
  /** 0..1 energy pulse on edges and pool. */
  readonly pulse?: number;
  readonly style?: React.CSSProperties;
};

const P = {
  tBack: [320, 65],
  tRight: [530, 170],
  tFront: [320, 275],
  tLeft: [110, 170],
  bBack: [320, 295],
  bRight: [530, 400],
  bFront: [320, 505],
  bLeft: [110, 400],
} as const;

const pt = (p: readonly number[], dy = 0) => `${p[0]} ${p[1]! + dy}`;
const poly = (...ps: string[]) => `M${ps.join(' L')} Z`;

const COIN_RX = 96;
const COIN_RY = 48;
const COIN_H = 19;

/** Isometric glass vault holding the backing. ViewBox 640×600. */
export const Vault: React.FC<VaultProps> = ({
  width = 520,
  open = 0,
  locked = 0,
  coins = [],
  pulse = 0,
  style,
}) => {
  const id = svgId(useId(), 'vault');
  const lift = -open * 120;
  const edge = 0.45 + pulse * 0.5;
  return (
    <svg
      viewBox="0 0 640 600"
      width={width}
      height={(width * 600) / 640}
      style={{ overflow: 'visible', ...style }}
    >
      <defs>
        <radialGradient id={`${id}-pool`}>
          <stop
            offset="0"
            stopColor="#8bebaa"
            stopOpacity={0.3 + pulse * 0.35}
          />
          <stop offset="1" stopColor="#8bebaa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-glassL`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b5ebc3" stopOpacity="0.2" />
          <stop offset="0.6" stopColor="#86c891" stopOpacity="0.04" />
          <stop offset="1" stopColor="#557d60" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`${id}-glassR`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b5ebc3" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#86c891" stopOpacity="0.03" />
          <stop offset="1" stopColor="#4c6f57" stopOpacity="0.26" />
        </linearGradient>
        <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9f7de" stopOpacity="0.32" />
          <stop offset="1" stopColor="#6e9679" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id={`${id}-coinSide`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#253f2f" />
          <stop offset="0.3" stopColor="#9fc6a4" />
          <stop offset="0.55" stopColor="#3f6449" />
          <stop offset="1" stopColor="#1a2f22" />
        </linearGradient>
        <radialGradient id={`${id}-coinTop`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#5b8566" />
          <stop offset="1" stopColor="#173022" />
        </radialGradient>
        <radialGradient id={`${id}-inner`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c8ffcf" stopOpacity="0.55" />
          <stop offset="1" stopColor="#c8ffcf" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="320" cy="470" rx="330" ry="120" fill={`url(#${id}-pool)`} />
      {/* plinth */}
      <path
        d="M80 404 L320 286 L560 404 L320 522 Z"
        fill="#0b1a13"
        stroke="#3a5a45"
        strokeWidth="1.5"
      />
      <path
        d="M80 404 L320 522 L320 552 L80 434 Z"
        fill="#081109"
        stroke="#2c4434"
      />
      <path
        d="M560 404 L320 522 L320 552 L560 434 Z"
        fill="#0d1d15"
        stroke="#2c4434"
      />
      <path
        d="M104 404 L320 298 L536 404 L320 510 Z"
        fill="none"
        stroke={C.green1}
        strokeOpacity={0.12 + pulse * 0.4}
      />

      {/* back edges seen through glass */}
      <path
        d={`M${pt(P.tBack)} L${pt(P.bBack)} M${pt(P.bLeft)} L${pt(P.bBack)} L${pt(P.bRight)}`}
        stroke="#cfeed3"
        strokeOpacity={0.18 + pulse * 0.2}
        strokeWidth="1.5"
        fill="none"
      />

      {/* backing stack */}
      {coins.map((d, k) => {
        if (d <= 0) return null;
        const y = 392 - k * COIN_H + -(1 - d) * 330;
        const isTop = k === coins.length - 1 || (coins[k + 1] ?? 0) <= 0;
        return (
          <g key={k} opacity={Math.min(1, d * 2.5)}>
            <path
              d={`M${320 - COIN_RX} ${y} v${COIN_H} a${COIN_RX} ${COIN_RY} 0 0 0 ${COIN_RX * 2} 0 v${-COIN_H} Z`}
              fill={`url(#${id}-coinSide)`}
            />
            <ellipse
              cx="320"
              cy={y}
              rx={COIN_RX}
              ry={COIN_RY}
              fill={`url(#${id}-coinTop)`}
              stroke="#c9ecce"
              strokeOpacity="0.75"
              strokeWidth="1.5"
            />
            <ellipse
              cx="320"
              cy={y}
              rx={COIN_RX - 14}
              ry={COIN_RY - 7}
              fill="none"
              stroke="#bfe5c4"
              strokeOpacity="0.3"
              strokeDasharray="2 6"
            />
            {isTop ? (
              <text
                x="0"
                y="0"
                transform={`translate(320 ${y + 11}) scale(1.25 0.62)`}
                textAnchor="middle"
                fontFamily="Inter"
                fontWeight={600}
                fontSize="40"
                fill="#e2f7e4"
              >
                A
              </text>
            ) : null}
          </g>
        );
      })}

      {/* inner light when the lid is open */}
      <ellipse
        cx="320"
        cy="170"
        rx="200"
        ry="95"
        fill={`url(#${id}-inner)`}
        opacity={open}
      />

      {/* glass faces */}
      <path
        d={poly(pt(P.tLeft), pt(P.tFront), pt(P.bFront), pt(P.bLeft))}
        fill={`url(#${id}-glassL)`}
        stroke="#cdeed2"
        strokeOpacity={edge}
        strokeWidth="1.8"
      />
      <path
        d={poly(pt(P.tFront), pt(P.tRight), pt(P.bRight), pt(P.bFront))}
        fill={`url(#${id}-glassR)`}
        stroke="#cdeed2"
        strokeOpacity={edge * 0.8}
        strokeWidth="1.8"
      />
      <path
        d="M128 196 L300 282 L300 470"
        stroke="#e9fff0"
        strokeOpacity="0.2"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M150 186 L150 380"
        stroke="#e9fff0"
        strokeOpacity="0.08"
        strokeWidth="14"
      />
      <path
        d={`M${pt(P.tFront)} L${pt(P.bFront)}`}
        stroke="#eaffee"
        strokeOpacity={0.55 + pulse * 0.4}
        strokeWidth="2.4"
      />

      {/* lock on the right face */}
      <g
        transform="translate(410 300) skewY(-26.57)"
        opacity={0.35 + locked * 0.65}
      >
        <rect
          x="0"
          y="0"
          width="44"
          height="36"
          rx="9"
          fill="#9edaac"
          fillOpacity={0.12 + locked * 0.2}
          stroke="#bdeac8"
          strokeWidth="2"
        />
        <path
          d={`M10 ${-(1 - locked) * 12} v-9 a12 12 0 0 1 24 0 v9`}
          fill="none"
          stroke="#d4f5dc"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="22" cy="16" r="4" fill="#d4f5dc" />
        <path
          d="M22 18 v8"
          stroke="#d4f5dc"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* lid */}
      <g transform={`translate(0 ${lift})`} opacity={1 - open * 0.25}>
        <path
          d={poly(pt(P.tBack), pt(P.tRight), pt(P.tFront), pt(P.tLeft))}
          fill={`url(#${id}-lid)`}
          stroke="#e2f8e5"
          strokeOpacity={0.6 + pulse * 0.35}
          strokeWidth="2"
        />
        <path
          d={poly(
            pt(P.tBack, 14),
            `${P.tRight[0] - 28} ${P.tRight[1]}`,
            pt(P.tFront, -14),
            `${P.tLeft[0] + 28} ${P.tLeft[1]}`,
          )}
          fill="none"
          stroke="#e2f8e5"
          strokeOpacity="0.18"
        />
      </g>
    </svg>
  );
};
