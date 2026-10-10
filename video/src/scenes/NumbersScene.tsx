import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AllocationDial } from '../assets/Dial';
import { Caption, Chip, Kicker } from '../assets/Type';
import { copy } from '../copy';
import { Burst, Motes } from '../fx/Particles';
import { easeIn, easeOut, keys, pop, tween } from '../lib/anim';
import { C, FONT } from '../theme';
import { NUMBERS as N, SCENES } from '../timeline';

export const NUMBERS_DURATION = SCENES.numbers.duration;

const PRICE = 90;
const SHARE = 0.5;
/** Shared center for the circular aperture into the proof scene. */
export const DIAL_CENTER = { x: 960, y: 600 };
const DIAL = 480;

export const proofPortalRadius = (frame: number) =>
  tween(frame, N.portal[0], N.portal[1], (DIAL * 128) / 300, 1800, easeIn);

const SCENARIOS = [
  { label: 'Higher income', income: 200 },
  { label: 'Lower income', income: 100 },
  { label: 'No income', income: 0 },
] as const;

/** Same fixed price, three hypothetical incomes: the buyer's outcome is not guaranteed. */
export const NumbersScene: React.FC = () => {
  const f = useCurrentFrame();
  const n = copy.numbers;
  const enter = tween(f, 6, 30, 0, 1, easeOut);
  const income = keys(
    f,
    [N.higher[0], N.higher[1], N.lower[0], N.lower[1], N.zero[0], N.zero[1]],
    [0, 200, 200, 100, 100, 0],
  );
  const active = f < N.lower[0] ? 0 : f < N.zero[0] ? 1 : 2;
  const bob = income * SHARE;
  const net = Math.round(bob - PRICE);
  const pct = ((bob - PRICE) / PRICE) * 100;
  const outcome =
    net > 0
      ? 'Above the price paid'
      : net === 0
        ? 'Break-even'
        : bob <= 0.5
          ? 'The full price is lost'
          : 'Below the price paid';

  // Clear the information before pushing through an undistorted circular rim.
  const othersOut = tween(f, N.exit[0], N.portal[0], 0, 1, easeIn);
  const portal = tween(f, N.portal[0], N.portal[1]);
  const rim =
    tween(f, N.exit[0] + 4, N.portal[0]) *
    (1 - tween(f, N.portal[1], N.exit[1]));
  const radius = proofPortalRadius(f);
  const push = tween(f, 0, N.exit[0], 0.97, 1.03, (t) => t);

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enter, 1 - tween(f, N.exit[1] - 4, N.exit[1])),
      }}
    >
      <div style={{ opacity: 1 - othersOut }}>
        <Caption
          position="top"
          size={84}
          start={N.headline[0]}
          end={N.headline[1]}
          lines={[
            { text: n.headline[0] },
            { text: n.headline[1], color: C.mint },
          ]}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          scale: String(push * (0.94 + 0.06 * enter)),
        }}
      >
        <Motes
          frame={f}
          x={DIAL_CENTER.x}
          y={DIAL_CENTER.y}
          w={560}
          h={560}
          count={22}
          opacity={(income / 200) * (1 - othersOut)}
          seed="dial"
        />
        <Burst
          frame={f}
          at={N.zero[0] + 6}
          x={DIAL_CENTER.x}
          y={DIAL_CENTER.y - DIAL * 0.3}
          count={30}
          color="#9da3a8"
          speed={6}
          gravity={0.6}
          life={40}
          angle={Math.PI / 2}
          spread={Math.PI * 1.4}
          seed="drain"
        />
        <div
          style={{
            position: 'absolute',
            left: DIAL_CENTER.x - DIAL / 2,
            top: DIAL_CENTER.y - DIAL / 2,
            opacity: 1 - othersOut,
          }}
        >
          <AllocationDial size={DIAL} income={income} share={SHARE}>
            <div style={{ opacity: 1 - othersOut }}>
              <Kicker size={20}>Bob’s 50% of income</Kicker>
              <div
                style={{
                  fontSize: 104,
                  fontWeight: 500,
                  letterSpacing: '-0.05em',
                  marginTop: 6,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(bob)}
              </div>
              <div style={{ fontSize: 24, color: C.text2 }}>
                DemoUSD-equivalent
              </div>
            </div>
          </AllocationDial>
        </div>

        <div style={{ opacity: 1 - othersOut }}>
          <SideCard
            x={250}
            show={pop(f, N.paid)}
            kicker="Bob paid upfront"
            value={`${PRICE}`}
            unit="DemoUSD · fixed"
            note="Not refunded at expiry"
          />
          <SideCard
            x={1370}
            show={pop(f, N.net)}
            kicker="Net for Bob"
            value={`${net > 0 ? '+' : net < 0 ? '−' : ''}${Math.abs(net)}`}
            unit={`${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct).toFixed(2)}% over the term`}
            note={outcome}
            accent={net > 0}
          />
        </div>
      </div>

      {/* A lens-like rim travels toward the viewer; text never stretches. */}
      {rim > 0 ? (
        <svg
          width={1920}
          height={1080}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: rim,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <circle
            cx={DIAL_CENTER.x}
            cy={DIAL_CENTER.y}
            r={radius}
            fill="none"
            stroke={C.green1}
            strokeWidth={12 - portal * 8}
            strokeOpacity={0.7}
            style={{ filter: 'drop-shadow(0 0 18px rgba(153,227,158,0.75))' }}
          />
          <circle
            cx={DIAL_CENTER.x}
            cy={DIAL_CENTER.y}
            r={radius + 16}
            fill="none"
            stroke="#dcffdf"
            strokeWidth={2}
            strokeOpacity={0.5}
          />
          <circle
            cx={DIAL_CENTER.x}
            cy={DIAL_CENTER.y}
            r={radius}
            fill="none"
            stroke="#effff0"
            strokeWidth={4}
            pathLength={100}
            strokeDasharray="16 34"
            strokeDashoffset={-portal * 18}
            style={{
              rotate: `${-60 + portal * 90}deg`,
              transformOrigin: `${DIAL_CENTER.x}px ${DIAL_CENTER.y}px`,
            }}
          />
        </svg>
      ) : null}

      <div style={{ opacity: 1 - othersOut }}>
        <div
          style={{
            position: 'absolute',
            top: 880,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 22,
          }}
        >
          {SCENARIOS.map((s, i) => (
            <Chip
              key={s.label}
              show={pop(f, 30 + i * 6)}
              tone={i === active ? 'green' : 'neutral'}
              dot={i === active}
              size={28}
            >
              {s.label} · {s.income}
            </Chip>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 966,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 24,
            color: C.text3,
            opacity: tween(f, N.fine, N.fine + 20),
          }}
        >
          {n.fine}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SideCard: React.FC<{
  x: number;
  show: number;
  kicker: string;
  value: string;
  unit: string;
  note: string;
  accent?: boolean;
}> = ({ x, show, kicker, value, unit, note, accent }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: 470,
      width: 300,
      padding: '28px 30px',
      borderRadius: 28,
      fontFamily: FONT,
      background: 'linear-gradient(150deg, #13221b, #090f0f 70%)',
      border: `1.5px solid ${accent ? 'rgba(153,227,158,0.45)' : 'rgba(171,194,181,0.25)'}`,
      boxShadow: accent
        ? '0 30px 70px rgba(0,0,0,0.5), 0 0 40px rgba(153,227,158,0.18)'
        : '0 30px 70px rgba(0,0,0,0.5)',
      opacity: Math.max(0, Math.min(1, show)),
      translate: `0 ${(1 - show) * 40}px`,
      transform: `perspective(1400px) rotateY(${x < 960 ? 10 : -10}deg)`,
    }}
  >
    <Kicker size={18}>{kicker}</Kicker>
    <div
      style={{
        fontSize: 76,
        fontWeight: 500,
        letterSpacing: '-0.05em',
        color: accent ? C.green1 : C.text1,
        marginTop: 10,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 22, color: C.text2, marginTop: 4 }}>{unit}</div>
    <div style={{ fontSize: 24, color: C.text1, marginTop: 16 }}>{note}</div>
  </div>
);
