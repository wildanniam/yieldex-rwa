import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LedgerBlock } from '../assets/Ledger';
import { Lockup } from '../assets/Logo';
import { Caption, Chip, Kinetic } from '../assets/Type';
import { copy, LEDGER_EVENTS, MARKET_ADDRESS } from '../copy';
import { Bloom, Flare } from '../fx/Light';
import { Burst, Shockwave } from '../fx/Particles';
import { easeIn, easeInOut, easeOut, keys, pop, tween } from '../lib/anim';
import { C, FONT, primaryGradient } from '../theme';
import { CLOSE as K, SCENES } from '../timeline';
import { DIAL_CENTER } from './NumbersScene';

export const CLOSE_DURATION = SCENES.close.duration;

const SPACING = 480;
const LOGO_Y = 400;

/** Proof that the rules live onchain, then the brand promise and one CTA. */
export const CloseScene: React.FC = () => {
  const f = useCurrentFrame();
  const c = copy.close;
  const converge = tween(f, K.converge[0], K.converge[1], 0, 1, easeIn);
  const pan =
    keys(f, [0, K.converge[0]], [560, -620], easeInOut) * (1 - converge);
  const lineDraw = tween(f, K.line[0], K.line[1], 0, 1, easeOut);
  const pulseX =
    (-2.5 + tween(f, K.blocks, K.blocks + 5 * K.blockGap, 0, 5, (t) => t)) *
    SPACING;
  const boom = f < K.boom ? 0 : Math.exp(-(f - K.boom) / 16);
  const endFade = tween(f, K.end[0], K.end[1]);

  return (
    <AbsoluteFill style={{ opacity: 1 - endFade }}>
      {/* --- proof: the lifecycle as real contract events */}
      <AbsoluteFill
        style={{ opacity: 1 - tween(f, K.converge[1] - 6, K.converge[1] + 2) }}
      >
        <div style={{ opacity: 1 - converge }}>
          <Caption
            position="top"
            size={80}
            start={K.headline[0]}
            end={K.headline[1]}
            lines={[
              { text: c.headline[0] },
              { text: c.headline[1], color: C.mint },
            ]}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: DIAL_CENTER.x,
            top: DIAL_CENTER.y - 40,
            perspective: 2400,
          }}
        >
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${12 * tween(f, 0, 30)}deg) rotateY(${-16 * tween(f, 0, 40)}deg) translateX(${pan}px) translateY(${tween(f, 0, 30, 40, 0)}px)`,
            }}
          >
            <svg
              width={SPACING * 6}
              height={20}
              style={{
                position: 'absolute',
                left: -SPACING * 3,
                top: -10,
                overflow: 'visible',
                opacity: 1 - converge,
              }}
            >
              <line
                x1={SPACING * 3 * (1 - lineDraw)}
                y1={10}
                x2={SPACING * 3 + SPACING * 3 * lineDraw}
                y2={10}
                stroke={C.green1}
                strokeOpacity={0.7}
                strokeWidth={4}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(153,227,158,0.8))',
                }}
              />
              {f >= K.blocks && f < K.blocks + 5 * K.blockGap + 8 ? (
                <circle
                  cx={SPACING * 3 + pulseX}
                  cy={10}
                  r={10}
                  fill="#effff0"
                  style={{ filter: 'drop-shadow(0 0 14px #99E39E)' }}
                />
              ) : null}
            </svg>
            {LEDGER_EVENTS.map((e, i) => {
              const at = K.blocks + i * K.blockGap;
              const p = pop(f, at, { damping: 14, stiffness: 120 });
              const vis = Math.max(0, Math.min(1, p));
              const x = (i - 2.5) * SPACING - 210;
              return (
                <div
                  key={e.name}
                  style={{
                    position: 'absolute',
                    left: x * (1 - converge) - 210 * converge,
                    top: -100 + converge * (LOGO_Y - DIAL_CENTER.y + 40),
                    opacity: vis * (1 - converge * 0.8),
                    transform: `translateY(${(1 - p) * 120}px) rotateX(${(1 - vis) * 40}deg) scale(${1 - converge * 0.85})`,
                  }}
                >
                  <LedgerBlock
                    index={i}
                    name={e.name}
                    detail={e.detail}
                    glow={f < at ? 0 : Math.exp(-(f - at) / 14) + converge}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ opacity: 1 - converge }}>
          <div
            style={{
              position: 'absolute',
              top: 820,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {c.proof.map((p, i) => (
              <Chip
                key={p}
                show={pop(f, K.chips + i * 10)}
                tone={i === 0 ? 'green' : 'neutral'}
                size={27}
              >
                {p}
              </Chip>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 910,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 24,
              color: C.text3,
              letterSpacing: '0.04em',
              opacity: tween(f, K.address, K.address + 16),
            }}
          >
            SEPOLIA MARKET · {MARKET_ADDRESS.slice(0, 8)}…
            {MARKET_ADDRESS.slice(-4)}
          </div>
        </div>
      </AbsoluteFill>

      {/* --- brand resolve */}
      <Bloom amount={boom} x={960} y={LOGO_Y} />
      <Shockwave
        frame={f}
        at={K.boom}
        x={960}
        y={LOGO_Y}
        radius={900}
        life={34}
        width={8}
      />
      <Shockwave
        frame={f}
        at={K.boom + 6}
        x={960}
        y={LOGO_Y}
        radius={600}
        life={30}
        width={4}
        color="#c9c4ff"
      />
      <Burst
        frame={f}
        at={K.boom}
        x={960}
        y={LOGO_Y}
        count={60}
        speed={22}
        life={50}
        gravity={0.05}
        seed="logo"
      />
      <Flare x={960} y={LOGO_Y} amount={boom} width={1800} />
      <AbsoluteFill style={{ opacity: tween(f, K.boom - 2, K.boom + 6) }}>
        <div
          style={{
            position: 'absolute',
            left: 960 - 700,
            top: LOGO_Y - 700,
            width: 1400,
            height: 1400,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(153,227,158,${0.12 + boom * 0.3}) 0%, transparent 55%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: LOGO_Y - 90,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            scale: String(
              1.08 - 0.08 * tween(f, K.logo, K.logo + 60, 0, 1, easeOut),
            ),
          }}
        >
          <Lockup
            size={150}
            assembleAt={K.logo}
            sweep={tween(f, K.sweep[0], K.sweep[1], -0.3, 1.3)}
            glow={0.6 + boom * 0.6}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 580,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Kinetic
            size={64}
            weight={440}
            start={K.tagline}
            stagger={2}
            lines={[
              { text: c.tagline[0] },
              { text: c.tagline[1], color: C.mint },
            ]}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 790,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <CtaPill
            show={pop(f, K.cta)}
            glow={0.5 + 0.5 * Math.sin(f / 10)}
            label={c.cta}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 950,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 22,
            color: C.text3,
            opacity: tween(f, K.fine, K.fine + 18),
          }}
        >
          {c.fine}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CtaPill: React.FC<{ show: number; glow: number; label: string }> = ({
  show,
  glow,
  label,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 16,
      padding: '26px 46px',
      borderRadius: 999,
      background: primaryGradient,
      color: C.primaryLabel,
      fontFamily: FONT,
      fontSize: 36,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      opacity: Math.max(0, Math.min(1, show)),
      scale: String(0.8 + 0.2 * show),
      boxShadow: `0 0 ${30 + glow * 30}px rgba(153,227,158,${0.3 + glow * 0.2}), 0 24px 60px rgba(0,0,0,0.5)`,
    }}
  >
    {label}
    <svg width={34} height={34} viewBox="0 0 24 24">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        fill="none"
        stroke={C.primaryLabel}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);
