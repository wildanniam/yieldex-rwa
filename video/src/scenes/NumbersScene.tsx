import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AllocationDial } from '../assets/Dial';
import { Caption, Chip, Kicker } from '../assets/Type';
import { copy } from '../copy';
import { easeIn, easeOut, keys, pop, tween } from '../lib/anim';
import { C, FONT } from '../theme';

export const NUMBERS_DURATION = 270;

const PRICE = 90;
const SHARE = 0.5;
const SCENARIOS = [
  { label: 'Higher income', income: 200, at: 44 },
  { label: 'Lower income', income: 100, at: 112 },
  { label: 'No income', income: 0, at: 178 },
] as const;

/** Same fixed price, three hypothetical incomes: the buyer's outcome is not guaranteed. */
export const NumbersScene: React.FC = () => {
  const f = useCurrentFrame();
  const n = copy.numbers;
  const enter = tween(f, 0, 30, 0, 1, easeOut);
  const exit = tween(f, 244, 268, 0, 1, easeIn);
  const exitFade = tween(f, 244, 262, 0, 1, easeIn);
  const income = keys(
    f,
    [28, 62, 112, 134, 178, 200],
    [0, 200, 200, 100, 100, 0],
  );
  const active = f < 112 ? 0 : f < 178 ? 1 : 2;
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

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enter, 1 - exitFade),
        scale: String((0.94 + 0.06 * enter) * (1 + exit * 0.4)),
        filter: exit > 0 ? `blur(${exit * 12}px)` : undefined,
      }}
    >
      <Caption
        position="top"
        size={84}
        start={6}
        end={246}
        lines={[
          { text: n.headline[0] },
          { text: n.headline[1], color: C.mint },
        ]}
      />

      <div style={{ position: 'absolute', left: 960 - 240, top: 360 }}>
        <AllocationDial size={480} income={income} share={SHARE}>
          <div>
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

      <SideCard
        x={250}
        show={pop(f, 20)}
        kicker="Bob paid upfront"
        value={`${PRICE}`}
        unit="DemoUSD · fixed"
        note="Not refunded at expiry"
      />
      <SideCard
        x={1370}
        show={pop(f, 50)}
        kicker="Net for Bob"
        value={`${net > 0 ? '+' : net < 0 ? '−' : ''}${Math.abs(net)}`}
        unit={`${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct).toFixed(2)}% over the term`}
        note={outcome}
        accent={net > 0}
      />

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
          opacity: tween(f, 60, 80),
        }}
      >
        {n.fine}
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
      boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
      opacity: Math.max(0, Math.min(1, show)),
      translate: `0 ${(1 - show) * 40}px`,
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
