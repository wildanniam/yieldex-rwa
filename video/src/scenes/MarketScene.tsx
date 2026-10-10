import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { IncomeDrop, PayCoin } from '../assets/Coins';
import { IncomeRing } from '../assets/IncomeRing';
import { AtomicCapsule, Cursor, Trail } from '../assets/Interaction';
import { OfferTicket, ResaleCard } from '../assets/OfferTicket';
import { Avatar, Balance, ClaimTray } from '../assets/People';
import { Caption, Chip } from '../assets/Type';
import { Vault } from '../assets/Vault';
import { copy } from '../copy';
import { Flare, GodRays, LightSweep } from '../fx/Light';
import { Reflect, Smear } from '../fx/Motion';
import { Burst, Motes, Shockwave } from '../fx/Particles';
import {
  arcPath,
  arcPoint,
  easeIn,
  easeInOut,
  easeOut,
  keys,
  lerp,
  life,
  pop,
  tween,
  type Point,
} from '../lib/anim';
import { MARKET as T, SCENES } from '../timeline';

export const MARKET_DURATION = SCENES.market.duration;

const ALICE = { x: -640, y: 40 };
const VAULT = { x: 0, y: -20 };
const BOB = { x: 640, y: 40 };
const CAROL = { x: 1280, y: 40 };
const BAL_Y = -190;
const DAY_Y = -122;
const TRAY_Y = 262;
const TICKET = { x: -400, y: -300 };
const TICKET_ORIGIN = { x: 57.6, y: 54 };
const RESALE = { x: 960, y: -340 };
const RING = 250;
const TERM_DAYS = 180;
const VAULT_TOP: Point = { x: VAULT.x, y: -220 };
const SPLIT_FROM: Point = { x: VAULT.x, y: -290 };
const TILT = 9;

/** Camera path for the stage; exported so the global background can parallax. */
export const stageCamera = (f: number) => ({
  x: keys(
    f,
    [
      0,
      T.bobIn,
      T.bobIn + 44,
      T.camToCarol[0],
      T.camToCarol[1],
      T.wide[0],
      T.wide[1],
    ],
    [-330, -330, 0, 0, 960, 960, 320],
  ),
  y: keys(
    f,
    [
      0,
      T.bobIn,
      T.bobIn + 44,
      T.lapse1,
      T.lapse1 + 44,
      T.wide[0],
      T.wide[1],
      T.exit[0],
      T.exit[1],
    ],
    [-60, -60, -50, -50, 60, 60, 110, 110, -180],
  ),
  zoom: keys(
    f,
    [
      0,
      44,
      T.bobIn,
      T.bobIn + 44,
      T.event1 - 18,
      T.event1 + 22,
      T.split1End - 30,
      T.camToCarol[0],
      T.camToCarol[1],
      T.wide[0],
      T.wide[1],
      T.exit[0],
      T.exit[1],
    ],
    [1.55, 0.96, 0.97, 0.86, 0.86, 0.9, 0.86, 0.86, 0.86, 0.86, 0.6, 0.6, 0.5],
  ),
});

const decay = (f: number, at: number, len = 16) =>
  f < at ? 0 : Math.exp(-(f - at) / len);
const spike = (f: number, at: number, len = 14) =>
  Math.max(0, 1 - Math.abs(f - at) / len);
const travel = (
  f: number,
  start: number,
  end: number,
  a: Point,
  b: Point,
  lift: number,
) => arcPoint(tween(f, start, end, 0, 1, easeInOut), a, b, lift);

const Place: React.FC<{
  p: Point;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ p, children, style }) => (
  <div
    style={{
      position: 'absolute',
      left: p.x,
      top: p.y,
      translate: '-50% -50%',
      ...style,
    }}
  >
    {children}
  </div>
);

// Ticket unfolds from the ring, then shrinks aside when Bob arrives.
const ticketLayout = (f: number) => {
  const shift = tween(f, T.bobIn - 14, T.button, 0, 1, easeInOut);
  const scale = lerp(0.92, 0.74, shift);
  const off = { x: lerp(0, -20, shift), y: lerp(0, 60, shift) };
  const at = (lx: number, ly: number): Point => ({
    x:
      TICKET.x - 240 + off.x + TICKET_ORIGIN.x + (lx - TICKET_ORIGIN.x) * scale,
    y:
      TICKET.y - 225 + off.y + TICKET_ORIGIN.y + (ly - TICKET_ORIGIN.y) * scale,
  });
  return { scale, off, at };
};

/** Where the income right is, how big, and how visible, at any frame. */
const ringState = (f: number) => {
  const icon = ticketLayout(f).at(62, 62);
  const rise: Point = {
    x: VAULT.x,
    y: lerp(-190, -280, tween(f, T.ringRise, T.ringFly)),
  };
  if (f < T.ringFly) {
    return {
      p: rise,
      size: lerp(90, 200, tween(f, T.ringRise, T.ringFly)),
      opacity: tween(f, T.ringRise, T.ringRise + 12),
    };
  }
  if (f < T.xfer) {
    const t = tween(f, T.ringFly, T.ringFly + 26, 0, 1, easeInOut);
    return {
      p: arcPoint(t, rise, icon, 120),
      size: lerp(200, 56, t),
      opacity: 1 - tween(f, T.ringFly + 22, T.ringFly + 28),
    };
  }
  if (f < T.resaleXfer) {
    const t = tween(f, T.xfer, T.xferEnd, 0, 1, easeInOut);
    return {
      p: arcPoint(t, icon, BOB, -60),
      size: lerp(56, RING, t),
      opacity: 1,
    };
  }
  return {
    p: travel(f, T.resaleXfer, T.resaleEnd, BOB, CAROL, 140),
    size: RING,
    opacity: 1,
  };
};

export const MarketScene: React.FC = () => {
  const f = useCurrentFrame();
  const cam = stageCamera(f);
  const m = copy.market;
  const ticket = ticketLayout(f);
  const ring = ringState(f);

  const elapsed =
    keys(f, [T.lapse1, T.lapse1End], [0, 62 / TERM_DAYS], easeInOut) +
    keys(f, [T.lapse2, T.lapse2End], [0, 58 / TERM_DAYS], easeInOut);
  const day = Math.max(1, Math.round(elapsed * TERM_DAYS));
  const termShow = tween(f, T.termStart, T.termStart + 18);
  const ringOwner = f < T.resaleEnd ? BOB : CAROL;
  const dayChip =
    f >= T.termStart && !(f > T.resaleXfer - 6 && f < T.resaleEnd + 6);
  const lapse = Math.max(
    life(f, T.lapse1, T.lapse1End, 8, 8),
    life(f, T.lapse2, T.lapse2End, 8, 8),
  );

  const coinDrops = [0, 1, 2, 3, 4].map((k) => {
    const land = T.coinsFly + k * T.coinGap + T.coinFlight;
    return tween(f, land, land + 12, 0, 1, easeOut);
  });

  const eventDrop = (start: number, split: number) => ({
    show: pop(f, start + 8) * (1 - tween(f, split, split + 8)),
    y:
      VAULT_TOP.y -
      300 +
      tween(f, start - 6, start + 10, 0, 230, easeIn) -
      tween(f, start + 10, split, 0, 70),
  });
  const drop1 = eventDrop(T.event1, T.split1);
  const drop2 = eventDrop(T.event2, T.split2);
  const trayA = { x: ALICE.x, y: TRAY_Y + 40 };
  const trayB = { x: BOB.x, y: TRAY_Y + 40 };
  const trayC = { x: CAROL.x, y: TRAY_Y + 40 };
  const aliceClaim =
    (f >= T.split1End ? 0.5 : 0) + (f >= T.split2End ? 0.5 : 0);
  const bobClaim = f >= T.split1End ? 0.5 : 0;
  const carolClaim = f >= T.split2End ? 0.5 : 0;
  const vaultPulse = Math.min(
    1,
    decay(f, T.lock) + decay(f, T.event1 + 10) + decay(f, T.event2 + 8),
  );

  const btn = ticket.at(370, 392);
  const bobCursor = travel(
    f,
    T.cursorIn,
    T.click - 4,
    { x: BOB.x - 40, y: 10 },
    btn,
    120,
  );
  const resaleBtn = { x: RESALE.x + 222, y: RESALE.y + 50 };
  const carolCursor = travel(
    f,
    T.resaleCard + 14,
    T.carolClick - 4,
    { x: CAROL.x - 40, y: 10 },
    resaleBtn,
    100,
  );

  const ticketOpen = tween(f, T.ticketOpen, T.ticketOpen + 30, 0, 1, easeOut);
  const ticketOut = tween(f, T.xfer + 8, T.xfer + 34, 0, 1, easeIn);
  const resaleShow =
    pop(f, T.resaleCard) *
    (1 - tween(f, T.resaleEnd + 8, T.resaleEnd + 30, 0, 1, easeIn));

  const exit = tween(f, T.exit[0], T.exit[1], 0, 1, easeIn);
  const pin: Point = { x: CAROL.x, y: CAROL.y - RING * 0.52 };

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(
          tween(f, 0, 6),
          1 - tween(f, T.exit[0] + 8, T.exit[1]),
        ),
      }}
    >
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: '50% 35%' }}>
        <AbsoluteFill
          style={{
            transform: `rotateX(${TILT}deg)`,
            transformOrigin: '50% 70%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 540,
              transform: `scale(${cam.zoom}) translate(${-cam.x}px, ${-cam.y}px)`,
              filter: exit > 0 ? `blur(${exit * 8}px)` : undefined,
            }}
          >
            {/* vault */}
            <GodRays
              x={VAULT.x}
              y={VAULT_TOP.y + 40}
              amount={
                life(f, T.event1 - 16, T.event1 + 26, 10, 22) +
                life(f, T.event2 - 14, T.event2 + 22, 10, 20)
              }
            />
            <Place p={VAULT}>
              <Reflect base={173} width={440} fade={150}>
                <Vault
                  width={440}
                  open={
                    1 - tween(f, T.lidClose, T.lidClose + 18, 0, 1, easeInOut)
                  }
                  locked={pop(f, T.lock, { damping: 11, stiffness: 180 })}
                  coins={coinDrops}
                  pulse={vaultPulse}
                  style={{ opacity: tween(f, 0, 20) }}
                />
              </Reflect>
            </Place>
            <Motes
              frame={f}
              x={VAULT.x}
              y={-60}
              w={300}
              h={360}
              count={14}
              opacity={tween(f, T.lock, T.lock + 30) * 0.7}
              seed="vault"
            />
            <Shockwave
              frame={f}
              at={T.lock}
              x={VAULT.x}
              y={-30}
              radius={360}
              life={26}
            />
            <Burst
              frame={f}
              at={T.lock}
              x={VAULT.x + 70}
              y={30}
              count={22}
              speed={11}
              life={30}
              seed="lock"
            />
            <Place p={{ x: VAULT.x, y: 232 }}>
              <Chip
                show={
                  pop(f, 70) *
                    (1 - tween(f, T.camToCarol[0], T.camToCarol[0] + 16)) +
                  tween(f, T.wide[0] - 60, T.wide[0] - 44)
                }
                size={26}
              >
                {f < T.lock
                  ? 'Backing · 100 AAPLx'
                  : 'Backing · 100 AAPLx · locked'}
              </Chip>
            </Place>
            <Place p={{ x: VAULT.x, y: 300 }}>
              <Chip
                show={life(f, T.termStart + 16, T.lapse1 + 10)}
                size={24}
                dot={false}
              >
                The backing stays in the vault
              </Chip>
            </Place>
            <Place p={{ x: VAULT.x, y: -360 }}>
              <Chip
                show={
                  pop(f, T.event1 + 4) *
                    (1 - tween(f, T.claims - 12, T.claims + 6)) +
                  pop(f, T.event2 + 4) *
                    (1 - tween(f, T.exit[0], T.exit[0] + 16))
                }
                tone="green"
                size={28}
              >
                Dividend event · +1 AAPLx
              </Chip>
            </Place>

            {/* people */}
            <Place p={ALICE}>
              <Reflect base={75} width={150} fade={80}>
                <Avatar
                  name="Alice"
                  role="Keeps the principal"
                  tone="green"
                  show={pop(f, 8)}
                  active={decay(f, T.xferEnd, 30)}
                />
              </Reflect>
            </Place>
            <Place p={BOB}>
              <Reflect base={75} width={150} fade={80}>
                <Avatar
                  name="Bob"
                  role="Buys the income"
                  tone="slate"
                  show={pop(f, T.bobIn)}
                  active={decay(f, T.xferEnd, 30)}
                />
              </Reflect>
            </Place>
            <Place p={CAROL}>
              <Reflect base={75} width={150} fade={80}>
                <Avatar
                  name="Carol"
                  role="Buys it next"
                  tone="teal"
                  show={pop(f, T.carolIn)}
                  active={decay(f, T.resaleEnd, 30)}
                />
              </Reflect>
            </Place>

            <Place p={{ x: ALICE.x, y: BAL_Y }}>
              <Balance
                amount={1000 + (f >= T.xferEnd ? 90 : 0)}
                delta={90}
                deltaShow={life(f, T.xferEnd, T.xferEnd + 150, 6, 30)}
                show={pop(f, T.xferEnd - 10)}
              />
            </Place>
            <Place p={{ x: BOB.x, y: BAL_Y }}>
              <Balance
                amount={
                  1000 -
                  (f >= T.xfer + 4 ? 90 : 0) +
                  (f >= T.resaleEnd ? 45 : 0)
                }
                delta={f >= T.resaleEnd ? 45 : -90}
                deltaShow={
                  life(f, T.xfer + 4, T.xfer + 70, 6, 20) +
                  life(f, T.resaleEnd, T.resaleEnd + 100, 6, 30)
                }
                show={pop(f, T.bobIn + 6)}
              />
            </Place>
            <Place p={{ x: CAROL.x, y: BAL_Y }}>
              <Balance
                amount={1000 - (f >= T.resaleXfer + 4 ? 45 : 0)}
                delta={-45}
                deltaShow={life(f, T.resaleXfer + 4, T.resaleXfer + 70, 6, 20)}
                show={pop(f, T.carolIn + 6)}
              />
            </Place>

            {/* claim trays */}
            <Place p={{ x: ALICE.x, y: TRAY_Y + 95 }}>
              <ClaimTray
                amount={aliceClaim}
                show={pop(f, T.lapse1 + 36)}
                pulse={Math.min(
                  1,
                  decay(f, T.split1End, 20) + decay(f, T.split2End, 20),
                )}
                width={220}
              />
            </Place>
            <Place p={{ x: BOB.x, y: TRAY_Y + 95 }}>
              <ClaimTray
                amount={bobClaim}
                show={pop(f, T.lapse1 + 42)}
                pulse={Math.min(
                  1,
                  decay(f, T.split1End, 20) + decay(f, T.earnedStays, 26),
                )}
                width={220}
              />
            </Place>
            <Place p={{ x: CAROL.x, y: TRAY_Y + 95 }}>
              <ClaimTray
                amount={carolClaim}
                show={pop(f, T.resaleEnd)}
                pulse={decay(f, T.split2End, 20)}
                width={220}
              />
            </Place>
            <Motes
              frame={f}
              x={ALICE.x}
              y={TRAY_Y + 40}
              w={160}
              h={200}
              count={8}
              opacity={
                tween(f, T.claims, T.claims + 20) * (aliceClaim > 0 ? 1 : 0)
              }
              seed="trayA"
            />
            <Motes
              frame={f}
              x={BOB.x}
              y={TRAY_Y + 40}
              w={160}
              h={200}
              count={8}
              opacity={
                tween(f, T.claims, T.claims + 20) * (bobClaim > 0 ? 1 : 0)
              }
              seed="trayB"
            />
            <Place p={{ x: BOB.x - 330, y: TRAY_Y + 60 }}>
              <Chip
                show={life(f, T.earnedStays, T.wide[0])}
                tone="green"
                size={24}
              >
                Earned before resale · still Bob’s
              </Chip>
            </Place>

            {/* backing coins flying into the vault */}
            {[0, 1, 2, 3, 4].map((k) => {
              const s = T.coinsFly + k * T.coinGap;
              if (f < s || f > s + T.coinFlight + 2) return null;
              const path = (x: number) =>
                arcPoint(
                  tween(x, s, s + T.coinFlight, 0, 1, easeInOut),
                  { x: ALICE.x, y: ALICE.y - 30 },
                  { x: VAULT.x, y: -200 },
                  260,
                );
              return (
                <Smear
                  key={k}
                  frame={f}
                  path={path}
                  samples={4}
                  step={0.9}
                  render={(x) => (
                    <IncomeDrop
                      size={70}
                      spin={tween(x, s, s + T.coinFlight) * 360}
                      glow={0.6}
                    />
                  )}
                />
              );
            })}

            {/* offer ticket */}
            {f >= T.ticketOpen && ticketOut < 1 ? (
              <div
                style={{
                  position: 'absolute',
                  left: TICKET.x - 240 + ticket.off.x,
                  top: TICKET.y - 225 + ticket.off.y,
                  transformOrigin: '12% 12%',
                  transform: `perspective(1600px) rotateY(${(1 - ticketOpen) * 70 - 4}deg) rotateZ(${-2 + ticketOut * -6}deg) scale(${(0.2 + 0.72 * ticketOpen) * (ticket.scale / 0.92) * (1 - ticketOut * 0.4)})`,
                  opacity: Math.min(1, ticketOpen * 2) * (1 - ticketOut),
                }}
              >
                <OfferTicket
                  rows={[
                    pop(f, T.rows[0]),
                    pop(f, T.rows[1]),
                    pop(f, T.rows[2]),
                    pop(f, T.rows[3]),
                  ]}
                  share={tween(f, T.rows[0], T.rows[0] + 22, 0, 50)}
                  price={tween(f, T.rows[2], T.rows[2] + 22, 0, 90)}
                  term="6 months"
                  validity="7 days"
                  status={
                    f >= T.settled
                      ? 'Filled'
                      : f >= T.status
                        ? 'Offer open'
                        : 'Draft'
                  }
                  statusTone={f >= T.status ? 'green' : 'neutral'}
                  button={pop(f, T.button)}
                  pressed={
                    tween(f, T.click, T.click + 4) *
                    (1 - tween(f, T.click + 8, T.click + 16))
                  }
                  spin={f * 1.5}
                  sheen={tween(f, T.ticketOpen + 14, T.ticketOpen + 50)}
                />
              </div>
            ) : null}

            {/* atomic purchase boundary */}
            <AtomicCapsule
              x={-830}
              y={-500}
              width={1660}
              height={860}
              draw={tween(f, T.capsule, T.capsule + 30, 0, 1, easeInOut)}
              done={tween(f, T.settled, T.settled + 4)}
              label="One transaction · both happen, or neither"
              doneLabel="Settled · right → Bob, 90 USDC → Alice"
              opacity={1 - tween(f, T.termStart + 30, T.termStart + 54)}
            />
            <Burst
              frame={f}
              at={T.settled}
              x={0}
              y={-500}
              count={40}
              speed={16}
              life={40}
              seed="settle"
            />
            <Shockwave
              frame={f}
              at={T.settled}
              x={0}
              y={-500}
              radius={520}
              life={30}
            />

            {/* resale card */}
            {resaleShow > 0.01 ? (
              <Place
                p={RESALE}
                style={{
                  opacity: Math.min(1, resaleShow),
                  scale: String(0.85 + 0.15 * resaleShow),
                }}
              >
                <ResaleCard
                  status={f >= T.resaleEnd ? 'Filled' : 'Listed by Bob'}
                  pressed={
                    tween(f, T.carolClick, T.carolClick + 4) *
                    (1 - tween(f, T.carolClick + 8, T.carolClick + 16))
                  }
                  spin={f * 1.5}
                />
              </Place>
            ) : null}

            {/* payments: neutral USDC, always opposite to the right */}
            {f >= T.xfer && f <= T.xferEnd + 12 ? (
              <>
                <Trail
                  d={arcPath({ x: BOB.x, y: -20 }, { x: ALICE.x, y: -20 }, 520)}
                  head={tween(f, T.xfer, T.xferEnd, 0, 1, easeInOut)}
                  color="#dfe6ec"
                  opacity={1 - tween(f, T.xferEnd, T.xferEnd + 12)}
                />
                <Smear
                  frame={f}
                  path={(x) =>
                    travel(
                      x,
                      T.xfer,
                      T.xferEnd,
                      { x: BOB.x, y: -20 },
                      { x: ALICE.x, y: -20 },
                      520,
                    )
                  }
                  opacity={1 - tween(f, T.xferEnd - 2, T.xferEnd + 8)}
                  render={(x) => (
                    <PayCoin size={96} label="90 USDC" spin={x * 6} />
                  )}
                />
              </>
            ) : null}
            {f >= T.resaleXfer && f <= T.resaleEnd + 12 ? (
              <>
                <Trail
                  d={arcPath({ x: CAROL.x, y: -20 }, { x: BOB.x, y: -20 }, 300)}
                  head={tween(f, T.resaleXfer, T.resaleEnd, 0, 1, easeInOut)}
                  color="#dfe6ec"
                  opacity={1 - tween(f, T.resaleEnd, T.resaleEnd + 12)}
                />
                <Smear
                  frame={f}
                  path={(x) =>
                    travel(
                      x,
                      T.resaleXfer,
                      T.resaleEnd,
                      { x: CAROL.x, y: -20 },
                      { x: BOB.x, y: -20 },
                      300,
                    )
                  }
                  opacity={1 - tween(f, T.resaleEnd - 2, T.resaleEnd + 8)}
                  render={(x) => (
                    <PayCoin size={90} label="45 USDC" spin={x * 6} />
                  )}
                />
              </>
            ) : null}
            <Burst
              frame={f}
              at={T.xferEnd}
              x={ALICE.x}
              y={-40}
              count={18}
              color="#e8eef3"
              speed={9}
              life={26}
              seed="pay1"
            />
            <Burst
              frame={f}
              at={T.resaleEnd}
              x={BOB.x}
              y={-40}
              count={18}
              color="#e8eef3"
              speed={9}
              life={26}
              seed="pay2"
            />

            {/* ring trails while it travels to a new owner */}
            {f >= T.xfer && f <= T.xferEnd + 12 ? (
              <Trail
                d={arcPath(ticketLayout(T.xfer).at(62, 62), BOB, -60)}
                head={tween(f, T.xfer, T.xferEnd, 0, 1, easeInOut)}
                opacity={1 - tween(f, T.xferEnd, T.xferEnd + 12)}
              />
            ) : null}
            {f >= T.resaleXfer && f <= T.resaleEnd + 12 ? (
              <Trail
                d={arcPath(BOB, CAROL, 140)}
                head={tween(f, T.resaleXfer, T.resaleEnd, 0, 1, easeInOut)}
                opacity={1 - tween(f, T.resaleEnd, T.resaleEnd + 12)}
              />
            ) : null}

            {/* the income right */}
            {ring.opacity > 0.01 &&
            f >= T.ringRise &&
            !(f > T.ringFly + 28 && f < T.xfer) ? (
              <div style={{ opacity: ring.opacity }}>
                <Smear
                  frame={f}
                  path={(x) => ringState(x).p}
                  samples={4}
                  step={0.8}
                  render={(x) => (
                    <IncomeRing
                      size={ringState(x).size}
                      spin={x * (1.5 + lapse * 10)}
                      elapsed={x >= T.termStart ? elapsed : undefined}
                      termShow={termShow}
                      glow={1 + lapse * 0.6}
                    />
                  )}
                />
              </div>
            ) : null}
            <Burst
              frame={f}
              at={T.xferEnd}
              x={BOB.x}
              y={BOB.y}
              count={28}
              speed={12}
              life={34}
              seed="ring1"
            />
            <Burst
              frame={f}
              at={T.resaleEnd}
              x={CAROL.x}
              y={CAROL.y}
              count={28}
              speed={12}
              life={34}
              seed="ring2"
            />
            <Shockwave
              frame={f}
              at={T.sameDeadline}
              x={pin.x}
              y={pin.y}
              radius={120}
              life={22}
              width={4}
            />
            <Place p={{ x: ringOwner.x, y: DAY_Y }}>
              <Chip
                show={dayChip ? pop(f, T.termStart + 6) : 0}
                size={24}
                tone="green"
              >
                {`Day ${day} of ${TERM_DAYS}`}
                {f >= T.resaleEnd ? ' · same expiry' : ''}
              </Chip>
            </Place>

            {/* income events */}
            {drop1.show > 0.01 ? (
              <Place
                p={{ x: VAULT.x, y: drop1.y }}
                style={{ scale: String(Math.max(0, drop1.show)) }}
              >
                <IncomeDrop size={96} spin={f * 4} glow={1.4} />
              </Place>
            ) : null}
            {drop2.show > 0.01 ? (
              <Place
                p={{ x: VAULT.x, y: drop2.y }}
                style={{ scale: String(Math.max(0, drop2.show)) }}
              >
                <IncomeDrop size={96} spin={f * 4} glow={1.4} />
              </Place>
            ) : null}
            <Burst
              frame={f}
              at={T.event1 + 10}
              x={VAULT.x}
              y={VAULT_TOP.y}
              count={30}
              speed={12}
              life={34}
              seed="event1"
            />
            <Burst
              frame={f}
              at={T.event2 + 8}
              x={VAULT.x}
              y={VAULT_TOP.y}
              count={26}
              speed={11}
              life={30}
              seed="event2"
            />
            <SplitDrops
              f={f}
              start={T.split1}
              end={T.split1End}
              targets={[trayA, trayB]}
            />
            <SplitDrops
              f={f}
              start={T.split2}
              end={T.split2End}
              targets={[trayA, trayC]}
            />

            <Cursor
              x={bobCursor.x}
              y={bobCursor.y}
              click={tween(f, T.click, T.click + 18, 0, 1, (x) => x)}
              show={life(f, T.cursorIn, T.click + 16, 8, 14)}
            />
            <Cursor
              x={carolCursor.x}
              y={carolCursor.y}
              click={tween(f, T.carolClick, T.carolClick + 18, 0, 1, (x) => x)}
              show={life(f, T.resaleCard + 14, T.carolClick + 16, 8, 14)}
            />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* screen-space light */}
      <LightSweep
        progress={tween(f, T.lapse1 - 4, T.lapse1End + 6)}
        amount={1.2}
      />
      <LightSweep
        progress={tween(f, T.lapse2 - 4, T.lapse2End + 6)}
        amount={1}
      />
      <Flare
        x={960 - cam.x * cam.zoom}
        y={540 + (-500 - cam.y) * cam.zoom}
        amount={spike(f, T.settled + 2, 14) * 0.9}
      />
      <Flare
        x={960 + (VAULT.x - cam.x) * cam.zoom}
        y={540 + (VAULT_TOP.y - cam.y) * cam.zoom}
        amount={
          spike(f, T.lock + 2, 12) * 0.7 +
          spike(f, T.event1 + 10, 14) +
          spike(f, T.event2 + 8, 14) * 0.8
        }
      />
      <Flare
        x={960 + (pin.x - cam.x) * cam.zoom}
        y={540 + (pin.y - cam.y) * cam.zoom}
        amount={spike(f, T.sameDeadline + 2, 16) * 0.9}
        width={900}
      />

      <Caption
        start={T.captions.lock[0]}
        end={T.captions.lock[1]}
        lines={[{ text: m.lock }]}
      />
      <Caption
        start={T.captions.terms[0]}
        end={T.captions.terms[1]}
        lines={[{ text: m.terms }]}
      />
      <Caption
        start={T.captions.buy[0]}
        end={T.captions.buy[1]}
        lines={[{ text: m.buy }]}
      />
      <Caption
        start={T.captions.clock[0]}
        end={T.captions.clock[1]}
        lines={[{ text: m.clock }]}
      />
      <Caption
        start={T.captions.income[0]}
        end={T.captions.income[1]}
        lines={[{ text: m.income }]}
      />
      <Caption
        start={T.captions.claim[0]}
        end={T.captions.claim[1]}
        lines={[{ text: m.claim }]}
      />
      <Caption
        start={T.captions.resale[0]}
        end={T.captions.resale[1]}
        lines={[{ text: m.resale }]}
      />
      <Caption
        start={T.captions.deadline[0]}
        end={T.captions.deadline[1]}
        lines={[{ text: m.deadline }]}
      />
      <Caption
        start={T.captions.summary[0]}
        end={T.captions.summary[1]}
        lines={[{ text: m.summary }]}
      />
    </AbsoluteFill>
  );
};

const SplitDrops: React.FC<{
  f: number;
  start: number;
  end: number;
  targets: readonly [Point, Point];
}> = ({ f, start, end, targets }) => {
  if (f < start || f > end + 10) return null;
  const fade = 1 - tween(f, end - 4, end + 6);
  return (
    <>
      {targets.map((target, i) => (
        <div key={i}>
          <Trail
            d={arcPath(SPLIT_FROM, target, 200)}
            head={tween(f, start, end, 0, 1, easeInOut)}
            opacity={fade}
          />
          <Smear
            frame={f}
            path={(x) =>
              arcPoint(
                tween(x, start, end, 0, 1, easeInOut),
                SPLIT_FROM,
                target,
                200,
              )
            }
            samples={4}
            opacity={fade}
            render={(x) => (
              <IncomeDrop size={66} label="0.50" spin={x * 5 + i * 90} />
            )}
          />
          <Burst
            frame={f}
            at={end}
            x={target.x}
            y={target.y}
            count={14}
            speed={8}
            life={24}
            seed={`split-${start}-${i}`}
          />
        </div>
      ))}
    </>
  );
};
