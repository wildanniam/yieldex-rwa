import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LedgerBlock } from '../assets/Ledger';
import { Lockup } from '../assets/Logo';
import { Caption, Chip, Kinetic } from '../assets/Type';
import { copy, LEDGER_EVENTS, MARKET_ADDRESS } from '../copy';
import { easeIn, easeInOut, easeOut, keys, pop, tween } from '../lib/anim';
import { C, FONT, primaryGradient } from '../theme';

export const CLOSE_DURATION = 330;

const SPACING = 480;

/** Proof that the rules live onchain, then the brand promise and one CTA. */
export const CloseScene: React.FC = () => {
  const f = useCurrentFrame();
  const c = copy.close;
  const chainOut = tween(f, 160, 188, 0, 1, easeIn);
  const pan = keys(f, [0, 170], [560, -620], easeInOut);
  const flash = f < 180 ? 0 : Math.exp(-(f - 180) / 18);
  const endFade = tween(f, 320, 330);

  return (
    <AbsoluteFill style={{ opacity: Math.min(tween(f, 6, 22), 1 - endFade) }}>
      {/* --- proof: the lifecycle as real contract events */}
      <AbsoluteFill
        style={{
          opacity: 1 - chainOut,
          scale: String(1 - chainOut * 0.55),
          filter: chainOut > 0 ? `blur(${chainOut * 10}px)` : undefined,
        }}
      >
        <Caption
          position="top"
          size={80}
          start={14}
          end={160}
          lines={[
            { text: c.headline[0] },
            { text: c.headline[1], color: C.mint },
          ]}
        />
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 560,
            perspective: 2400,
          }}
        >
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(12deg) rotateY(-16deg) translateX(${pan}px)`,
            }}
          >
            <svg
              width={SPACING * 6}
              height={20}
              style={{
                position: 'absolute',
                left: -SPACING * 2.5 - 10,
                top: -10,
                overflow: 'visible',
              }}
            >
              <line
                x1={0}
                y1={10}
                x2={SPACING * 5 * tween(f, 18, 18 + 5 * 15, 0, 1, (t) => t)}
                y2={10}
                stroke={C.green1}
                strokeOpacity={0.7}
                strokeWidth={4}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(153,227,158,0.8))',
                }}
              />
            </svg>
            {LEDGER_EVENTS.map((e, i) => {
              const at = 14 + i * 15;
              const p = pop(f, at, { damping: 14, stiffness: 120 });
              const vis = Math.max(0, Math.min(1, p));
              return (
                <div
                  key={e.name}
                  style={{
                    position: 'absolute',
                    left: (i - 2.5) * SPACING - 210,
                    top: -100,
                    opacity: vis,
                    transform: `translateY(${(1 - p) * 120}px) rotateX(${(1 - vis) * 40}deg)`,
                  }}
                >
                  <LedgerBlock
                    index={i}
                    name={e.name}
                    detail={e.detail}
                    glow={f < at ? 0 : Math.exp(-(f - at) / 14)}
                  />
                </div>
              );
            })}
          </div>
        </div>
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
              show={pop(f, 92 + i * 10)}
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
            opacity: tween(f, 124, 140),
          }}
        >
          SEPOLIA MARKET · {MARKET_ADDRESS.slice(0, 8)}…
          {MARKET_ADDRESS.slice(-4)}
        </div>
      </AbsoluteFill>

      {/* --- brand resolve */}
      <AbsoluteFill style={{ opacity: tween(f, 176, 190) }}>
        <div
          style={{
            position: 'absolute',
            left: 960 - 700,
            top: 420 - 700,
            width: 1400,
            height: 1400,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(153,227,158,${0.1 + flash * 0.35}) 0%, transparent 55%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 330,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            translate: `0 ${(1 - tween(f, 184, 214, 0, 1, easeOut)) * 30}px`,
          }}
        >
          <Lockup
            size={150}
            assembleAt={184}
            sweep={tween(f, 212, 262, -0.3, 1.3)}
            glow={0.6}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 560,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Kinetic
            size={64}
            weight={440}
            start={220}
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
            top: 780,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <CtaPill
            show={pop(f, 250)}
            glow={0.5 + 0.5 * Math.sin(f / 10)}
            label={c.cta}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 940,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 22,
            color: C.text3,
            opacity: tween(f, 262, 280),
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
