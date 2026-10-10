import type React from 'react';
import { useId } from 'react';
import { svgId } from '../lib/anim';
import { TokenBrand } from './TokenBrand';

type CoinVariant = 'stock' | 'pay';

const PALETTE: Record<
  CoinVariant,
  { rim: string[]; face: string[]; glyph: string; line: string; edge: string[] }
> = {
  stock: {
    rim: ['#e4f7e5', '#86ad8f', '#1e3a29', '#a9cdac'],
    face: ['#34573f', '#10231a'],
    glyph: '#e5f7e6',
    line: 'rgba(214, 245, 218, 0.5)',
    edge: ['#2a4534', '#5f8a6a', '#2a4534'],
  },
  pay: {
    rim: ['#ffffff', '#c2cad1', '#4c565f', '#dbe2e7'],
    face: ['#46505a', '#161c22'],
    glyph: '#f3f6f8',
    line: 'rgba(235, 240, 245, 0.5)',
    edge: ['#3b434b', '#8b959e', '#3b434b'],
  },
};

type CoinFaceProps = {
  readonly variant?: CoinVariant;
  readonly glyph?: string;
  readonly ticker?: string;
  /** -1..1 position of the moving specular band. */
  readonly sheen?: number;
};

/** Engraved brand face for the stock; neutral silver for payment. */
export const CoinFace: React.FC<CoinFaceProps> = ({
  variant = 'stock',
  glyph,
  ticker = variant === 'stock' ? 'AAPLx' : 'USDC',
  sheen = -1,
}) => {
  const id = svgId(useId(), 'coin');
  const p = PALETTE[variant];
  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={`${id}-rim`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={p.rim[0]} />
          <stop offset="0.3" stopColor={p.rim[1]} />
          <stop offset="0.62" stopColor={p.rim[2]} />
          <stop offset="1" stopColor={p.rim[3]} />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.36" cy="0.28" r="0.85">
          <stop offset="0" stopColor={p.face[0]} />
          <stop offset="1" stopColor={p.face[1]} />
        </radialGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="100" cy="100" r="99" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="99" fill={`url(#${id}-rim)`} />
      <circle
        cx="100"
        cy="100"
        r="83"
        fill={`url(#${id}-face)`}
        stroke={p.line}
        strokeWidth="1.6"
      />
      <circle
        cx="100"
        cy="100"
        r="73"
        fill="none"
        stroke={p.line}
        strokeOpacity="0.45"
        strokeWidth="1.4"
        strokeDasharray="1.5 5"
      />
      {variant === 'stock' && !glyph ? (
        <TokenBrand
          brand="AAPLx"
          size={68}
          x={66}
          y={58}
          monochrome="#f3fff5"
        />
      ) : (
        <text
          x="100"
          y={variant === 'stock' ? 121 : 124}
          textAnchor="middle"
          fontFamily="Inter"
          fontWeight={600}
          fontSize={variant === 'stock' ? 66 : 72}
          fill={p.glyph}
        >
          {glyph ?? '$'}
        </text>
      )}
      <text
        x="100"
        y="152"
        textAnchor="middle"
        fontFamily="Inter"
        fontWeight={500}
        fontSize="16"
        letterSpacing="1.2"
        fill={p.glyph}
        fillOpacity="0.92"
      >
        {ticker}
      </text>
      <g clipPath={`url(#${id}-clip)`}>
        <rect
          x={-70 + sheen * 170 + 100}
          y="-60"
          width="70"
          height="320"
          fill={`url(#${id}-sheen)`}
          transform="rotate(24 100 100)"
        />
        <ellipse
          cx="68"
          cy="52"
          rx="52"
          ry="20"
          fill="#fff"
          opacity="0.1"
          transform="rotate(-32 68 52)"
        />
      </g>
    </svg>
  );
};

type StockCoinProps = {
  readonly size?: number;
  /** Rotation around the vertical axis, degrees. */
  readonly spin?: number;
  readonly tilt?: number;
  readonly glyph?: string;
  readonly ticker?: string;
  readonly variant?: CoinVariant;
  /** 0..1 desaturate and darken. */
  readonly dim?: number;
  readonly glow?: number;
};

/** Thick 3D coin built from stacked CSS layers. */
export const StockCoin: React.FC<StockCoinProps> = ({
  size = 260,
  spin = 0,
  tilt = 0,
  glyph,
  ticker,
  variant = 'stock',
  dim = 0,
  glow = 1,
}) => {
  const thickness = size * 0.085;
  const layers = 16;
  const sheen = Math.sin((spin * Math.PI) / 180) * 1.2;
  const edge = PALETTE[variant].edge;
  const glowColor = variant === 'stock' ? '153, 227, 158' : '220, 228, 235';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {glow > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: -size * 0.7,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${glowColor}, ${0.3 * glow * (1 - dim)}) 0%, transparent 58%)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: size * 6,
          filter:
            dim > 0
              ? `grayscale(${dim}) brightness(${1 - dim * 0.55})`
              : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt}deg) rotateY(${spin}deg)`,
          }}
        >
          {Array.from({ length: layers }, (_, i) => {
            const t = i / (layers - 1);
            const z = -thickness / 2 + t * thickness;
            const color =
              t < 0.5 ? (i % 2 ? edge[1] : edge[0]) : i % 2 ? edge[1] : edge[2];
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: size * 0.004,
                  borderRadius: '50%',
                  background: color,
                  transform: `translateZ(${z}px)`,
                }}
              />
            );
          })}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateZ(${thickness / 2 + 0.8}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <CoinFace
              variant={variant}
              glyph={glyph}
              ticker={ticker}
              sheen={sheen}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `rotateY(180deg) translateZ(${thickness / 2 + 0.8}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <CoinFace
              variant={variant}
              glyph={glyph}
              ticker={ticker}
              sheen={-sheen}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

type TokenProps = {
  readonly size?: number;
  readonly label?: string;
  readonly glow?: number;
  readonly spin?: number;
};

const tokenLabel = (label: string, size: number, color: string) => (
  <div
    style={{
      position: 'absolute',
      top: size + 10,
      left: '50%',
      translate: '-50% 0',
      whiteSpace: 'nowrap',
      fontFamily: 'Inter',
      fontSize: Math.max(22, size * 0.28),
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color,
      textShadow: '0 2px 18px rgba(0,0,0,0.8)',
    }}
  >
    {label}
  </div>
);

/** USDC payment token: neutral silver, never green. */
export const PayCoin: React.FC<TokenProps> = ({
  size = 100,
  label,
  glow = 1,
  spin = 0,
}) => (
  <div style={{ position: 'relative', width: size, height: size }}>
    <StockCoin size={size} variant="pay" spin={spin} glow={glow} />
    {label ? tokenLabel(label, size, '#eef2f5') : null}
  </div>
);

/** Income paid in-kind as the asset token. */
export const IncomeDrop: React.FC<TokenProps> = ({
  size = 78,
  label,
  glow = 1,
  spin = 0,
}) => (
  <div style={{ position: 'relative', width: size, height: size }}>
    <StockCoin size={size} spin={spin} glow={glow * 1.4} />
    {label ? tokenLabel(label, size, '#d9f5db') : null}
  </div>
);
