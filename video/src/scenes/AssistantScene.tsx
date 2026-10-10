import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AiOrb } from '../assets/AiOrb';
import {
  AiText,
  ChatHeader,
  ChatPanel,
  ExplainCard,
  ListingRow,
  PreviewCard,
  TypingDots,
  UserBubble,
} from '../assets/Chat';
import { Chip, Kinetic } from '../assets/Type';
import { copy } from '../copy';
import {
  arcPoint,
  easeIn,
  easeOut,
  keys,
  life,
  pop,
  tween,
  type Point,
} from '../lib/anim';
import { C, FONT } from '../theme';

export const ASSISTANT_DURATION = 330;

const decay = (f: number, at: number, len = 12) =>
  f < at ? 0 : Math.exp(-(f - at) / len);

const ORB: Point = { x: 450, y: 650 };

/** Discovery, explanation and a purchase preview; the wallet stays in the user's hands. */
export const AssistantScene: React.FC = () => {
  const f = useCurrentFrame();
  const a = copy.assistant;
  const enter = tween(f, 0, 42, 0, 1, easeOut);
  const exit = tween(f, 296, 324, 0, 1, easeIn);
  const exitFade = tween(f, 296, 316, 0, 1, easeIn);
  const activity = Math.min(
    1,
    life(f, 90, 132, 8, 16) + 0.5 * life(f, 196, 226, 6, 14),
  );
  const pulse = Math.min(
    1,
    decay(f, 132) +
      decay(f, 142) +
      decay(f, 152) +
      decay(f, 204) +
      decay(f, 262),
  );
  const chars = Math.floor(tween(f, 40, 86, 0, a.prompt.length, (t) => t));
  const caret = f < 92 && Math.floor(f / 8) % 2 === 0 ? '▍' : '';
  const scroll = keys(f, [196, 216, 252, 270], [0, -190, -190, -340]);

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(tween(f, 2, 20), 1 - exitFade),
        scale: String(1 + exit * 0.5),
        filter: exit > 0 ? `blur(${exit * 12}px)` : undefined,
      }}
    >
      <div style={{ position: 'absolute', left: 130, top: 150 }}>
        <Kinetic
          size={84}
          align="left"
          start={10}
          end={292}
          lines={[
            { text: a.headline[0] },
            { text: a.headline[1], color: '#bdb7ff' },
          ]}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: ORB.x - 160,
          top: ORB.y - 160,
          scale: String(0.25 + 0.75 * enter),
          filter: enter < 0.98 ? `blur(${(1 - enter) * 16}px)` : undefined,
        }}
      >
        <AiOrb size={320} activity={activity} pulse={pulse} />
      </div>

      <Beam
        f={f}
        start={122}
        end={176}
        from={{ x: ORB.x + 150, y: ORB.y - 20 }}
        to={{ x: 900, y: 480 }}
      />
      <Beam
        f={f}
        start={196}
        end={236}
        from={{ x: ORB.x + 150, y: ORB.y - 20 }}
        to={{ x: 900, y: 600 }}
      />

      <div
        style={{ position: 'absolute', left: 860, top: 140, perspective: 2200 }}
      >
        <div
          style={{
            transformOrigin: '0% 50%',
            transform: `translateX(${(1 - enter) * 260}px) rotateY(${-9 + (1 - enter) * 28}deg) translateY(${Math.sin(f / 40) * 6}px)`,
            opacity: enter,
          }}
        >
          <ChatPanel width={900} height={730}>
            <ChatHeader orb={<AiOrb size={46} activity={activity} />} />
            <div
              style={{
                position: 'absolute',
                left: 34,
                right: 34,
                top: 122,
                translate: `0 ${scroll}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <UserBubble
                text={a.prompt.slice(0, chars) + caret}
                show={pop(f, 30)}
              />
              {f >= 90 && f < 124 ? (
                <TypingDots frame={f} show={pop(f, 90)} />
              ) : null}
              {f >= 124 ? (
                <AiText show={pop(f, 124)}>
                  3 listings match. Prices are fixed; income isn’t.
                </AiText>
              ) : null}
              {f >= 128 ? (
                <>
                  <ListingRow
                    glyph="A"
                    ticker="demoAAPL"
                    kind="Primary"
                    share="50%"
                    term="6 months"
                    price="90 DemoUSD"
                    show={pop(f, 130)}
                    highlight={tween(f, 182, 198)}
                  />
                  <ListingRow
                    glyph="M"
                    ticker="demoMSFT"
                    kind="Primary"
                    share="30%"
                    term="3 months"
                    price="40 DemoUSD"
                    show={pop(f, 140)}
                  />
                  <ListingRow
                    glyph="S"
                    ticker="demoSPY"
                    kind="Resale"
                    share="50%"
                    term="42 days"
                    price="25 DemoUSD"
                    show={pop(f, 150)}
                  />
                </>
              ) : null}
              {f >= 198 ? (
                <ExplainCard
                  lines={a.explain}
                  show={pop(f, 200)}
                  lineShow={[pop(f, 208), pop(f, 218), pop(f, 228)]}
                />
              ) : null}
              {f >= 256 ? (
                <PreviewCard show={pop(f, 258)} glow={life(f, 272)} />
              ) : null}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 96,
                height: 60,
                background:
                  'linear-gradient(180deg, rgba(14,12,34,0.95), transparent)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 40,
                background:
                  'linear-gradient(0deg, rgba(8,9,20,0.95), transparent)',
              }}
            />
          </ChatPanel>
          <div
            style={{
              marginTop: 14,
              marginLeft: 34,
              fontSize: 19,
              color: '#8d89b5',
              fontFamily: FONT,
              letterSpacing: '0.04em',
            }}
          >
            Illustrative listings · simulated demo tokens ·{' '}
            <span style={{ color: C.text2 }}>Sepolia</span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 104,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Chip tone="purple" size={30} show={pop(f, 236)}>
          {a.note}
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

/** Short stream of light from the orb into the conversation. */
const Beam: React.FC<{
  f: number;
  start: number;
  end: number;
  from: Point;
  to: Point;
}> = ({ f, start, end, from, to }) => {
  if (f < start || f > end + 20) return null;
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const t = tween(f, start + i * 3, start + i * 3 + 22, 0, 1, (x) => x);
        if (t <= 0 || t >= 1) return null;
        const p = arcPoint(t, from, to, 90 + (i % 3) * 30);
        const size = 6 + (i % 3) * 3;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x - size / 2,
              top: p.y - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              background: i % 4 === 0 ? '#c7f3ca' : '#c9c4ff',
              boxShadow: '0 0 16px #9d95ff',
              opacity: Math.sin(t * Math.PI),
            }}
          />
        );
      })}
    </>
  );
};
