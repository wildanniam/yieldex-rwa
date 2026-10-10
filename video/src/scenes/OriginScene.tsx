import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { IncomeDrop, StockCoin } from '../assets/Coins';
import { IncomeRing } from '../assets/IncomeRing';
import { Lockup } from '../assets/Logo';
import { Caption, Kinetic } from '../assets/Type';
import { copy } from '../copy';
import { easeIn, easeInOut, keys, life, pop, tween } from '../lib/anim';
import { C, FONT } from '../theme';

export const ORIGIN_DURATION = 480;

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

/** Hook → problem → the idea: income can be lifted off the asset. */
export const OriginScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = copy.origin;

  // Camera dolly: the coin slides left to reveal the income timeline, then returns.
  const groupX = keys(frame, [70, 108, 228, 262], [0, -560, -560, 0]);

  // Selling: the coin leaves, an empty outline remains.
  const sold = keys(frame, [188, 214, 236, 262], [0, 1, 1, 0]);
  const coinEnter = pop(frame, 2, { damping: 16, stiffness: 90 });
  const spin =
    tween(frame, 0, 56, -200, 0) + Math.sin(frame / 38) * 14 + sold * 40;

  // Separation: the ring lifts off the coin and becomes its own object.
  const peel = tween(frame, 262, 300, 0, 1, easeInOut);
  const split = tween(frame, 300, 338, 0, 1, easeInOut);
  const ringRot = 74 * (1 - split) * Math.min(1, peel * 1.4);
  const coinX = groupX + split * -330 + sold * 760;
  const ringX = groupX + split * 330;
  const ringY = -peel * 70 * (1 - split);

  // Dive into the market scene.
  const dive = tween(frame, 438, 470, 0, 1, easeIn);
  const diveFade = tween(frame, 438, 462, 0, 1, easeIn);

  const timelineDraw = tween(frame, 84, 134);
  const timelineFade =
    1 - tween(frame, 156, 190) * 0.75 - tween(frame, 228, 246) * 0.25;

  return (
    <AbsoluteFill
      style={{
        scale: String(1 + dive * 0.9),
        opacity: 1 - diveFade,
        filter: dive > 0 ? `blur(${dive * 14}px)` : undefined,
      }}
    >
      <Caption
        position="top"
        size={84}
        start={10}
        end={64}
        lines={[{ text: t.earn }]}
      />
      <Caption
        position="top"
        size={84}
        start={76}
        end={146}
        lines={[{ text: t.slow }]}
      />
      <Caption
        position="top"
        size={84}
        start={154}
        end={228}
        lines={[{ text: t.need }]}
      />
      <div
        style={{
          position: 'absolute',
          top: 222,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Kinetic
          size={48}
          weight={420}
          start={180}
          end={228}
          lines={[{ text: t.sell, color: C.text2 }]}
        />
      </div>
      <Caption
        position="top"
        size={84}
        start={244}
        end={326}
        lines={[{ text: t.whatIf[0] }, { text: t.whatIf[1], color: C.mint }]}
      />

      {/* World centered slightly below the caption band. */}
      <div style={{ position: 'absolute', left: 960, top: 600 }}>
        {/* income timeline */}
        {/* the future income leaves together with the sold asset */}
        <div
          style={{
            position: 'absolute',
            left: groupX + sold * 760,
            top: 0,
            opacity: Math.max(0, timelineFade) * (1 - sold * 0.85),
          }}
        >
          <svg
            width={1200}
            height={20}
            style={{
              position: 'absolute',
              left: 150,
              top: -10,
              overflow: 'visible',
            }}
          >
            <line
              x1={0}
              y1={10}
              x2={1050 * timelineDraw}
              y2={10}
              stroke={C.mint}
              strokeOpacity={0.5}
              strokeWidth={2}
              strokeDasharray="2 10"
              strokeLinecap="round"
            />
          </svg>
          {MONTHS.map((m, i) => {
            const at = 96 + i * 7;
            const p = pop(frame, at);
            const x = 300 + i * 150;
            return (
              <div
                key={m}
                style={{
                  position: 'absolute',
                  left: x,
                  top: 0,
                  opacity: tween(frame, at, at + 8),
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -1,
                    top: -14,
                    width: 2,
                    height: 28,
                    background: C.mint,
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: -27,
                    top: -98 - (1 - p) * 30,
                    scale: String(0.6 + 0.4 * p),
                  }}
                >
                  <IncomeDrop
                    size={54}
                    glow={0.7}
                    spin={Math.sin(frame / 20 + i) * 25}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 28,
                    left: '50%',
                    translate: '-50% 0',
                    fontFamily: FONT,
                    fontSize: 24,
                    color: C.text3,
                    fontWeight: 500,
                  }}
                >
                  {m}
                </div>
              </div>
            );
          })}
        </div>

        {/* empty slot left behind when selling */}
        <div
          style={{
            position: 'absolute',
            left: groupX - 130,
            top: -130,
            width: 260,
            height: 260,
            borderRadius: '50%',
            border: `2px dashed ${C.text3}`,
            opacity: sold * 0.8,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: groupX - 60,
            top: 170,
            width: 120,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 600,
            color: C.green1,
            opacity: life(frame, 150, 228),
            letterSpacing: '0.12em',
          }}
        >
          TODAY
        </div>
        {/* ring */}
        <div
          style={{
            position: 'absolute',
            left: ringX - 170,
            top: ringY - 170,
            width: 340,
            height: 340,
            perspective: 1600,
            opacity: tween(frame, 262, 280) * (1 - dive * 0.2),
          }}
        >
          <div
            style={{
              transform: `rotateX(${ringRot}deg)`,
              scale: String(0.78 + 0.22 * peel),
            }}
          >
            <IncomeRing
              size={340}
              spin={frame * 1.2}
              elapsed={0}
              termShow={tween(frame, 352, 380)}
              glow={0.6 + peel * 0.6}
            />
          </div>
        </div>

        {/* coin */}
        <div
          style={{
            position: 'absolute',
            left: coinX - 130,
            top: -130,
            opacity: Math.min(tween(frame, 0, 18), 1 - sold * 0.9),
            scale: String((0.55 + 0.45 * coinEnter) * (1 - sold * 0.12)),
          }}
        >
          <StockCoin size={260} spin={spin} tilt={6} dim={sold * 0.85} />
        </div>

        {/* labels after the split */}
        <ObjectLabel
          x={-330}
          show={pop(frame, 338)}
          title={t.principal[0]}
          sub={t.principal[1]}
        />
        <ObjectLabel
          x={330}
          show={pop(frame, 348)}
          title={t.right[0]}
          sub={t.right[1]}
          accent
        />
      </div>

      {/* definition: product name in one sentence */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
          opacity: life(frame, 372, Infinity, 16),
        }}
      >
        <div style={{ translate: `0 ${(1 - tween(frame, 372, 400)) * 24}px` }}>
          <Lockup
            size={88}
            assembleAt={372}
            sweep={tween(frame, 392, 432, -0.3, 1.3)}
          />
        </div>
        <Kinetic
          size={44}
          weight={420}
          start={392}
          stagger={1.6}
          lines={[{ text: t.definition, color: C.text2 }]}
        />
      </div>
    </AbsoluteFill>
  );
};

const ObjectLabel: React.FC<{
  x: number;
  show: number;
  title: string;
  sub: string;
  accent?: boolean;
}> = ({ x, show, title, sub, accent }) => {
  const vis = Math.max(0, Math.min(1, show));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 196,
        translate: `-50% ${(1 - show) * 30}px`,
        textAlign: 'center',
        fontFamily: FONT,
        opacity: vis,
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          fontSize: 50,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          color: accent ? C.green1 : C.text1,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 30, color: C.text2, marginTop: 6 }}>{sub}</div>
    </div>
  );
};
