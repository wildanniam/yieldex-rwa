import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { IncomeDrop, StockCoin } from '../assets/Coins';
import { IncomeRing } from '../assets/IncomeRing';
import { Lockup } from '../assets/Logo';
import { Caption, Kinetic } from '../assets/Type';
import { copy } from '../copy';
import { Flare } from '../fx/Light';
import { Smear } from '../fx/Motion';
import { Burst, Motes, Shockwave } from '../fx/Particles';
import { easeIn, easeInOut, keys, lerp, life, pop, tween } from '../lib/anim';
import { C, FONT } from '../theme';
import { ORIGIN as O, SCENES } from '../timeline';

export const ORIGIN_DURATION = SCENES.origin.duration;

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
const RING = 340;
/** World origin on screen; the coin sits here. */
const WORLD = { x: 960, y: 600 };

const groupXAt = (f: number) =>
  keys(
    f,
    [O.dollyOut[0], O.dollyOut[1], O.dollyBack[0], O.dollyBack[1]],
    [0, -560, -560, 0],
  );
const soldAt = (f: number) =>
  keys(
    f,
    [O.soldOut[0], O.soldOut[1], O.soldBack[0], O.soldBack[1]],
    [0, 1, 1, 0],
  );
const splitAt = (f: number) =>
  tween(f, O.split[0], O.split[1], 0, 1, easeInOut);
const coinXAt = (f: number) =>
  groupXAt(f) + splitAt(f) * -330 + soldAt(f) * 760;
const coinSpinAt = (f: number) =>
  tween(f, 0, 70, -260, 0) + Math.sin(f / 38) * 14 + soldAt(f) * 50;

/** Ring size; during the portal the camera flies through its center. */
export const originRingSize = (f: number) =>
  RING * Math.pow(26, tween(f, O.portal[0], O.portal[1], 0, 1, easeIn));
/** Radius of the ring's inner edge on screen, used to reveal the next scene. */
export const portalRadius = (f: number) => originRingSize(f) * 0.33;

/** Hook → problem → the idea: income can be lifted off the asset. */
export const OriginScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = copy.origin;

  // Macro open: start close on the coin, pull focus, then pull back.
  const macro = tween(frame, 0, 76, 0, 1, easeInOut);
  const worldScale = lerp(2.3, 1, macro);
  const defocus = 1 - tween(frame, 0, 42);

  const groupX = groupXAt(frame);
  const sold = soldAt(frame);
  const coinEnter = pop(frame, 0, { damping: 16, stiffness: 90 });

  const peel = tween(frame, O.peel[0], O.peel[1], 0, 1, easeInOut);
  const split = splitAt(frame);
  const ringRot = 74 * (1 - split) * Math.min(1, peel * 1.4);
  const center = tween(
    frame,
    O.ringCenter[0],
    O.ringCenter[1],
    0,
    1,
    easeInOut,
  );
  const ringX = lerp(groupX + split * 330, 0, center);
  const ringY = lerp(-peel * 70 * (1 - split), -60, center);
  const ringSize = originRingSize(frame);
  const portal = tween(frame, O.portal[0], O.portal[1]);

  const exit = tween(frame, O.exit[0], O.exit[1], 0, 1, easeIn);
  const timelineDraw = tween(frame, O.drops - 12, O.drops + 38);
  const timelineFade =
    1 - tween(frame, 156, 190) * 0.75 - tween(frame, 228, 246) * 0.25;

  const ringScreen = { x: ringX * worldScale, y: ringY * worldScale };

  return (
    <AbsoluteFill>
      <Caption
        position="top"
        size={84}
        start={O.earn[0]}
        end={O.earn[1]}
        lines={[{ text: t.earn }]}
      />
      <Caption
        position="top"
        size={84}
        start={O.slow[0]}
        end={O.slow[1]}
        lines={[{ text: t.slow }]}
      />
      <Caption
        position="top"
        size={84}
        start={O.need[0]}
        end={O.need[1]}
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
          start={O.sell[0]}
          end={O.sell[1]}
          lines={[{ text: t.sell, color: C.text2 }]}
        />
      </div>
      <Caption
        position="top"
        size={84}
        start={O.whatIf[0]}
        end={O.whatIf[1]}
        lines={[{ text: t.whatIf[0] }, { text: t.whatIf[1], color: C.mint }]}
      />

      <div
        style={{
          position: 'absolute',
          left: WORLD.x,
          top: WORLD.y,
          transform: `scale(${worldScale})`,
          filter: defocus > 0.01 ? `blur(${defocus * 16}px)` : undefined,
        }}
      >
        <Motes
          frame={frame}
          x={coinXAt(frame)}
          y={-40}
          w={360}
          h={420}
          count={16}
          opacity={(1 - sold) * (1 - exit) * 0.9}
          seed="origin-coin"
        />

        {/* income timeline */}
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
          {MONTHS.map((month, i) => {
            const at = O.drops + i * 7;
            const p = pop(frame, at);
            return (
              <div
                key={month}
                style={{
                  position: 'absolute',
                  left: 300 + i * 150,
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
                    fontSize: 27,
                    color: '#afc4b8',
                    fontWeight: 500,
                  }}
                >
                  {month}
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
            left: ringX - ringSize / 2,
            top: ringY - ringSize / 2,
            width: ringSize,
            height: ringSize,
            perspective: 1600,
            opacity:
              tween(frame, O.peel[0], O.peel[0] + 18) *
              (1 - tween(frame, O.portal[1] - 10, O.portal[1])),
          }}
        >
          <div
            style={{
              transform: `rotateX(${ringRot}deg)`,
              scale: String(0.78 + 0.22 * peel),
            }}
          >
            <IncomeRing
              size={ringSize}
              spin={frame * 1.2}
              elapsed={0}
              termShow={tween(frame, O.term[0], O.term[1]) * (1 - portal)}
              glow={0.6 + peel * 0.6 + center * 0.6}
            />
          </div>
        </div>

        {/* coin, with motion smear while it is sold off */}
        <div
          style={{
            opacity: Math.min(tween(frame, 0, 10), 1 - sold * 0.9) * (1 - exit),
          }}
        >
          <Smear
            frame={frame}
            path={(f) => ({ x: coinXAt(f), y: 0 })}
            samples={6}
            step={0.8}
            render={(f) => (
              <div
                style={{
                  scale: String(
                    (0.55 + 0.45 * coinEnter) * (1 - soldAt(f) * 0.12),
                  ),
                }}
              >
                <StockCoin
                  size={260}
                  spin={coinSpinAt(f)}
                  tilt={6}
                  dim={soldAt(f) * 0.85}
                />
              </div>
            )}
          />
        </div>

        {/* the income lifts off the asset */}
        <Burst
          frame={frame}
          at={O.peel[0] + 6}
          x={groupX}
          y={-60}
          count={34}
          speed={13}
          life={40}
          gravity={-0.08}
          seed="peel"
        />
        <Shockwave
          frame={frame}
          at={O.split[0] + 4}
          x={groupX + 330}
          y={0}
          radius={300}
          life={28}
        />

        <div style={{ opacity: 1 - exit }}>
          <ObjectLabel
            x={-330}
            show={pop(frame, O.labels)}
            title={t.principal[0]}
            sub={t.principal[1]}
          />
          <ObjectLabel
            x={330}
            show={pop(frame, O.labels + 10)}
            title={t.right[0]}
            sub={t.right[1]}
            accent
          />
        </div>
      </div>

      <Flare
        x={WORLD.x - 70}
        y={WORLD.y - 80}
        amount={Math.max(0, 1 - Math.abs(frame - O.flare) / 16)}
      />
      <Flare
        x={WORLD.x + ringScreen.x}
        y={WORLD.y + ringScreen.y - RING * 0.36}
        amount={Math.max(0, 1 - Math.abs(frame - O.split[0] - 4) / 14) * 0.8}
      />

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
          opacity: life(frame, O.logo, Infinity, 16) * (1 - exit),
          translate: `0 ${-exit * 60}px`,
          filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
        }}
      >
        <div
          style={{
            translate: `0 ${(1 - tween(frame, O.logo, O.logo + 28)) * 24}px`,
          }}
        >
          <Lockup
            size={88}
            assembleAt={O.logo}
            sweep={tween(frame, O.logo + 20, O.logo + 60, -0.3, 1.3)}
          />
        </div>
        <Kinetic
          size={44}
          weight={420}
          start={O.definition}
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
