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
import { Flare } from '../fx/Light';
import { Motes, Shockwave } from '../fx/Particles';
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
import { FONT } from '../theme';
import { ASSISTANT as A, SCENES } from '../timeline';

export const ASSISTANT_DURATION = SCENES.assistant.duration;

const decay = (f: number, at: number, len = 12) =>
  f < at ? 0 : Math.exp(-(f - at) / len);

const ORB: Point = { x: 450, y: 650 };
const PURPLE = '#b9b3ff';

/** Discovery, explanation and a purchase preview; the wallet stays in the user's hands. */
export const AssistantScene: React.FC = () => {
  const f = useCurrentFrame();
  const a = copy.assistant;
  const enter = tween(f, 0, 42, 0, 1, easeOut);
  const exit = tween(f, A.exit[0], A.exit[1], 0, 1, easeIn);
  const exitFade = tween(f, A.exit[0], A.exit[0] + 14, 0, 1, easeIn);
  const thinking = Math.min(
    1,
    life(f, A.dots[0] - 6, A.answer + 8, 8, 16) +
      0.5 * life(f, A.explain - 4, A.preview + 20, 6, 14),
  );
  const pulse = Math.min(
    1,
    A.listings.reduce((s, at) => s + decay(f, at), 0) +
      decay(f, A.explain + 4) +
      decay(f, A.preview + 4) +
      decay(f, A.answer),
  );
  const chars = Math.floor(
    tween(f, A.typing[0], A.typing[1], 0, a.prompt.length, (t) => t),
  );
  const caret = f < A.typing[1] + 6 && Math.floor(f / 8) % 2 === 0 ? '▍' : '';
  const scroll = keys(
    f,
    [A.scroll[0], A.scroll[1], A.scroll[2], A.scroll[3]],
    [0, -190, -190, -335],
  );
  const yaw = -12 + enter * 4 + tween(f, 40, 300) * 3;

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(tween(f, 0, 10), 1 - exitFade),
        scale: String(1 + exit * 0.5),
        filter: exit > 0 ? `blur(${exit * 12}px)` : undefined,
      }}
    >
      <div style={{ position: 'absolute', left: 130, top: 150 }}>
        <Kinetic
          size={84}
          align="left"
          start={A.headline[0]}
          end={A.headline[1]}
          lines={[
            { text: a.headline[0] },
            { text: a.headline[1], color: '#bdb7ff' },
          ]}
        />
      </div>

      {[A.answer, A.explain + 2, A.preview + 2].map((at) => (
        <Shockwave
          key={at}
          frame={f}
          at={at}
          x={ORB.x}
          y={ORB.y}
          radius={300}
          life={30}
          color="#a99fff"
          width={3}
        />
      ))}
      <Motes
        frame={f}
        x={ORB.x}
        y={ORB.y}
        w={420}
        h={420}
        count={16}
        color="#cfc9ff"
        opacity={enter}
        seed="orb"
      />
      <div
        style={{
          position: 'absolute',
          left: ORB.x - 160,
          top: ORB.y - 160,
          scale: String((0.25 + 0.75 * enter) * (1 + Math.sin(f / 30) * 0.01)),
          filter: enter < 0.98 ? `blur(${(1 - enter) * 16}px)` : undefined,
        }}
      >
        <AiOrb size={320} activity={thinking} pulse={pulse} />
      </div>
      <Flare
        x={ORB.x - 50}
        y={ORB.y - 60}
        amount={Math.max(0, 1 - Math.abs(f - 10) / 18) * 0.9}
        color="160, 150, 255"
      />

      <Beam
        f={f}
        start={A.answer - 2}
        end={A.answer + 52}
        from={{ x: ORB.x + 150, y: ORB.y - 20 }}
        to={{ x: 900, y: 470 }}
      />
      <Beam
        f={f}
        start={A.explain - 2}
        end={A.explain + 40}
        from={{ x: ORB.x + 150, y: ORB.y - 20 }}
        to={{ x: 900, y: 600 }}
      />

      <div
        style={{ position: 'absolute', left: 860, top: 116, perspective: 2000 }}
      >
        <div
          style={{
            transformOrigin: '0% 50%',
            transform: `translateX(${(1 - enter) * 300}px) rotateY(${yaw + (1 - enter) * 26}deg) rotateX(${2 - tween(f, 0, 300) * 2}deg) translateY(${Math.sin(f / 40) * 6}px)`,
            opacity: enter,
          }}
        >
          <ChatPanel width={900} height={760}>
            <ChatHeader orb={<AiOrb size={46} activity={thinking} />} />
            {/* Clip the scrolling conversation below the fixed header. */}
            <div
              style={{
                position: 'absolute',
                inset: '96px 0 20px',
                overflow: 'hidden',
                zIndex: 1,
                maskImage:
                  'linear-gradient(180deg, transparent, black 20px, black calc(100% - 16px), transparent)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 34,
                  right: 34,
                  top: 26,
                  translate: `0 ${scroll}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                }}
              >
                <UserBubble
                  text={a.prompt.slice(0, chars) + caret}
                  show={pop(f, A.typing[0] - 16)}
                />
                {f >= A.dots[0] && f < A.answer ? (
                  <TypingDots frame={f} show={pop(f, A.dots[0])} />
                ) : null}
                {f >= A.answer ? (
                  <AiText show={pop(f, A.answer)}>
                    3 listings match. Prices are fixed; income isn’t.
                  </AiText>
                ) : null}
                {f >= A.listings[0] - 2 ? (
                  <>
                    <ListingRow
                      glyph="A"
                      ticker="demoAAPL"
                      kind="Primary"
                      share="50%"
                      term="6 months"
                      price="90 DemoUSD"
                      show={pop(f, A.listings[0])}
                      highlight={tween(f, A.highlight, A.highlight + 12)}
                    />
                    <ListingRow
                      glyph="M"
                      ticker="demoMSFT"
                      kind="Primary"
                      share="30%"
                      term="3 months"
                      price="40 DemoUSD"
                      show={pop(f, A.listings[1])}
                    />
                    <ListingRow
                      glyph="S"
                      ticker="demoSPY"
                      kind="Resale"
                      share="50%"
                      term="42 days"
                      price="25 DemoUSD"
                      show={pop(f, A.listings[2])}
                    />
                  </>
                ) : null}
                {f >= A.explain - 2 ? (
                  <ExplainCard
                    lines={a.explain}
                    show={pop(f, A.explain)}
                    lineShow={[
                      pop(f, A.explainLines[0]),
                      pop(f, A.explainLines[1]),
                      pop(f, A.explainLines[2]),
                    ]}
                  />
                ) : null}
                {f >= A.preview - 2 ? (
                  <PreviewCard
                    show={pop(f, A.preview)}
                    glow={life(f, A.confirm)}
                  />
                ) : null}
              </div>
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
            {/* glass reflection sweeping across the panel */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
                background: `linear-gradient(110deg, transparent ${tween(f, 10, 90, -40, 140) - 20}%, rgba(200,195,255,0.12) ${tween(f, 10, 90, -40, 140)}%, transparent ${tween(f, 10, 90, -40, 140) + 20}%)`,
              }}
            />
          </ChatPanel>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 924,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Chip tone="purple" size={30} show={pop(f, A.chip)}>
          {a.note}
        </Chip>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1004,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 22,
          color: '#b5afd3',
          fontFamily: FONT,
          letterSpacing: '0.02em',
          opacity: enter,
        }}
      >
        Illustrative listings · simulated demo tokens · Sepolia
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
      {Array.from({ length: 14 }, (_, i) => {
        const t = tween(
          f,
          start + i * 2.5,
          start + i * 2.5 + 22,
          0,
          1,
          (x) => x,
        );
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
              background: i % 4 === 0 ? '#c7f3ca' : PURPLE,
              boxShadow: '0 0 16px #9d95ff',
              opacity: Math.sin(t * Math.PI),
            }}
          />
        );
      })}
    </>
  );
};
