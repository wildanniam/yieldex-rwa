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

export const MARKET_DURATION = 1290;

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

/** Story beats, in frames local to this scene. */
const T = {
  coinsFly: 38,
  coinGap: 11,
  coinFlight: 22,
  lidClose: 106,
  lock: 124,
  ringRise: 152,
  ringFly: 182,
  ticketOpen: 196,
  rows: [222, 236, 250, 264] as const,
  status: 282,
  bobIn: 350,
  button: 362,
  cursorIn: 370,
  click: 402,
  capsule: 408,
  xfer: 426,
  xferEnd: 496,
  settled: 500,
  termStart: 516,
  lapse1: 600,
  lapse1End: 646,
  event1: 652,
  split1: 688,
  split1End: 746,
  carolIn: 868,
  resaleCard: 892,
  carolClick: 934,
  resaleXfer: 948,
  resaleEnd: 1008,
  lapse2: 1134,
  lapse2End: 1170,
  event2: 1176,
  split2: 1196,
  split2End: 1250,
} as const;

/** Camera path for the whole stage; exported so the global background can parallax. */
export const stageCamera = (f: number) => ({
  x: keys(
    f,
    [0, 330, 374, 852, 900, 1128, 1176],
    [-330, -330, 0, 0, 960, 960, 320],
  ),
  y: keys(
    f,
    [0, 330, 374, 596, 640, 1128, 1176, 1250, 1290],
    [-60, -60, -50, -50, 60, 60, 110, 110, -180],
  ),
  zoom: keys(
    f,
    [0, 44, 330, 374, 660, 700, 750, 852, 900, 1128, 1176, 1250, 1290],
    [1.55, 0.96, 0.97, 0.86, 0.86, 0.9, 0.86, 0.86, 0.86, 0.86, 0.6, 0.6, 0.46],
  ),
});

const decay = (f: number, at: number, len = 16) =>
  f < at ? 0 : Math.exp(-(f - at) / len);

/** Position on a timed arc between two points. */
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

export const MarketScene: React.FC = () => {
  const f = useCurrentFrame();
  const cam = stageCamera(f);
  const m = copy.market;

  // --- ticket: unfolds from the ring, then shrinks aside when Bob arrives
  const shift = tween(f, T.bobIn - 14, T.button, 0, 1, easeInOut);
  const tScale = lerp(0.92, 0.74, shift);
  const tOff = { x: lerp(0, -20, shift), y: lerp(0, 60, shift) };
  const onTicket = (lx: number, ly: number): Point => ({
    x:
      TICKET.x -
      240 +
      tOff.x +
      TICKET_ORIGIN.x +
      (lx - TICKET_ORIGIN.x) * tScale,
    y:
      TICKET.y -
      225 +
      tOff.y +
      TICKET_ORIGIN.y +
      (ly - TICKET_ORIGIN.y) * tScale,
  });
  const TICKET_ICON = onTicket(62, 62);

  // --- ring: lifted from the vault, folded into the ticket, sold to Bob, resold to Carol
  const ringRise = tween(f, T.ringRise, T.ringFly);
  const ringToTicket = tween(f, T.ringFly, T.ringFly + 26, 0, 1, easeInOut);
  const rise: Point = { x: VAULT.x, y: lerp(-190, -280, ringRise) };
  let ringPos: Point = rise;
  let ringSize = lerp(90, 200, ringRise);
  let ringOpacity = tween(f, T.ringRise, T.ringRise + 12);
  if (f >= T.ringFly) {
    ringPos = arcPoint(ringToTicket, rise, TICKET_ICON, 120);
    ringSize = lerp(200, 56, ringToTicket);
    ringOpacity = 1 - tween(f, T.ringFly + 22, T.ringFly + 28);
  }
  if (f >= T.xfer) {
    const t = tween(f, T.xfer, T.xferEnd, 0, 1, easeInOut);
    ringPos = arcPoint(t, TICKET_ICON, BOB, -60);
    ringSize = lerp(56, RING, t);
    ringOpacity = 1;
  }
  if (f >= T.resaleXfer) {
    ringPos = travel(f, T.resaleXfer, T.resaleEnd, BOB, CAROL, 140);
    ringSize = RING;
  }
  const elapsed =
    keys(f, [T.lapse1, T.lapse1End], [0, 62 / TERM_DAYS], easeInOut) +
    keys(f, [T.lapse2, T.lapse2End], [0, 58 / TERM_DAYS], easeInOut);
  const day = Math.max(1, Math.round(elapsed * TERM_DAYS));
  const termShow = tween(f, T.termStart, T.termStart + 18);
  const ringOwner = f < T.resaleEnd ? BOB : CAROL;
  const dayChip =
    f >= T.termStart && !(f > T.resaleXfer - 6 && f < T.resaleEnd + 6);

  // --- payments (neutral DemoUSD) travel opposite to the right
  const pay1 = travel(
    f,
    T.xfer,
    T.xferEnd,
    { x: BOB.x, y: -20 },
    { x: ALICE.x, y: -20 },
    520,
  );
  const pay1Head = tween(f, T.xfer, T.xferEnd, 0, 1, easeInOut);
  const pay2 = travel(
    f,
    T.resaleXfer,
    T.resaleEnd,
    { x: CAROL.x, y: -20 },
    { x: BOB.x, y: -20 },
    300,
  );
  const pay2Head = tween(f, T.resaleXfer, T.resaleEnd, 0, 1, easeInOut);

  // --- backing coins from Alice into the vault
  const coinDrops = [0, 1, 2, 3, 4].map((k) =>
    tween(
      f,
      T.coinsFly + k * T.coinGap + T.coinFlight,
      T.coinsFly + k * T.coinGap + T.coinFlight + 12,
      0,
      1,
      easeOut,
    ),
  );

  // --- income events
  const vaultTop: Point = { x: VAULT.x, y: -220 };
  const eventDrop = (start: number, split: number) => ({
    show: pop(f, start + 8) * (1 - tween(f, split, split + 8)),
    y: vaultTop.y - tween(f, start + 8, split, 0, 70),
  });
  const drop1 = eventDrop(T.event1, T.split1);
  const drop2 = eventDrop(T.event2, T.split2);
  const trayA = { x: ALICE.x, y: TRAY_Y + 40 };
  const trayB = { x: BOB.x, y: TRAY_Y + 40 };
  const trayC = { x: CAROL.x, y: TRAY_Y + 40 };
  const splitFrom1 = { x: VAULT.x, y: vaultTop.y - 70 };
  const aliceClaim =
    (f >= T.split1End ? 0.5 : 0) + (f >= T.split2End ? 0.5 : 0);
  const bobClaim = f >= T.split1End ? 0.5 : 0;
  const carolClaim = f >= T.split2End ? 0.5 : 0;

  const vaultPulse = decay(f, T.lock) + decay(f, T.event1) + decay(f, T.event2);

  // --- cursors
  const btn = onTicket(370, 392);
  const bobCursor = travel(
    f,
    T.cursorIn,
    T.click - 4,
    { x: BOB.x - 40, y: 10 },
    btn,
    120,
  );
  const bobClick = tween(f, T.click, T.click + 18, 0, 1, (t) => t);
  const resaleBtn = { x: RESALE.x + 222, y: RESALE.y + 50 };
  const carolCursor = travel(
    f,
    T.resaleCard + 14,
    T.carolClick - 4,
    { x: CAROL.x - 40, y: 10 },
    resaleBtn,
    100,
  );
  const carolClick = tween(f, T.carolClick, T.carolClick + 18, 0, 1, (t) => t);

  // --- ticket
  const ticketOpen = tween(f, T.ticketOpen, T.ticketOpen + 30, 0, 1, easeOut);
  const ticketOut = tween(f, T.xfer + 8, T.xfer + 34, 0, 1, easeIn);
  const resaleShow =
    pop(f, T.resaleCard) *
    (1 - tween(f, T.resaleEnd + 8, T.resaleEnd + 30, 0, 1, easeIn));

  // --- scene exit
  const exit = tween(f, 1250, 1280, 0, 1, easeIn);
  const exitFade = tween(f, 1250, 1272, 0, 1, easeIn);

  return (
    <AbsoluteFill style={{ opacity: Math.min(tween(f, 4, 22), 1 - exitFade) }}>
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 540,
          transform: `scale(${cam.zoom}) translate(${-cam.x}px, ${-cam.y}px)`,
          filter:
            f < 16
              ? `blur(${(1 - f / 16) * 12}px)`
              : exit > 0
                ? `blur(${exit * 6}px)`
                : undefined,
        }}
      >
        {/* vault */}
        <Place p={VAULT}>
          <Vault
            width={440}
            open={1 - tween(f, T.lidClose, T.lidClose + 18, 0, 1, easeInOut)}
            locked={pop(f, T.lock, { damping: 11, stiffness: 180 })}
            coins={coinDrops}
            pulse={Math.min(1, vaultPulse)}
            style={{ opacity: tween(f, 0, 20) }}
          />
        </Place>
        <Place p={{ x: VAULT.x, y: 232 }}>
          <Chip
            show={pop(f, 70) * (1 - tween(f, 852, 868)) + tween(f, 1130, 1146)}
            size={26}
          >
            {f < T.lock
              ? 'Backing · 100 demoAAPL'
              : 'Backing · 100 demoAAPL · locked'}
          </Chip>
        </Place>
        <Place p={{ x: VAULT.x, y: 300 }}>
          <Chip
            show={life(f, 536, T.lapse1 + 10)}
            size={24}
            dot={false}
            tone="neutral"
          >
            The backing stays in the vault
          </Chip>
        </Place>
        <Place p={{ x: VAULT.x, y: -330 }}>
          <Chip
            show={
              pop(f, T.event1) * (1 - tween(f, 770, 790)) +
              pop(f, T.event2) * (1 - tween(f, 1262, 1280))
            }
            tone="green"
            size={28}
          >
            Dividend event · +1 demoAAPL
          </Chip>
        </Place>

        {/* people */}
        <Place p={ALICE}>
          <Avatar
            name="Alice"
            role="Keeps the principal"
            tone="green"
            show={pop(f, 8)}
            active={decay(f, T.xferEnd, 30)}
          />
        </Place>
        <Place p={BOB}>
          <Avatar
            name="Bob"
            role="Buys the income"
            tone="slate"
            show={pop(f, T.bobIn)}
          />
        </Place>
        <Place p={CAROL}>
          <Avatar
            name="Carol"
            role="Buys it next"
            tone="teal"
            show={pop(f, T.carolIn)}
          />
        </Place>

        <Place p={{ x: ALICE.x, y: BAL_Y }}>
          <Balance
            amount={1000 + (f >= T.xferEnd ? 90 : 0)}
            delta={90}
            deltaShow={life(f, T.xferEnd, 640, 6, 30)}
            show={pop(f, T.xferEnd - 10)}
          />
        </Place>
        <Place p={{ x: BOB.x, y: BAL_Y }}>
          <Balance
            amount={
              1000 - (f >= T.xfer + 4 ? 90 : 0) + (f >= T.resaleEnd ? 45 : 0)
            }
            delta={f >= T.resaleEnd ? 45 : -90}
            deltaShow={
              life(f, T.xfer + 4, T.xfer + 70, 6, 20) +
              life(f, T.resaleEnd, 1100, 6, 30)
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
            show={pop(f, 640)}
            pulse={decay(f, T.split1End, 20) + decay(f, T.split2End, 20)}
            width={220}
          />
        </Place>
        <Place p={{ x: BOB.x, y: TRAY_Y + 95 }}>
          <ClaimTray
            amount={bobClaim}
            show={pop(f, 646)}
            pulse={decay(f, T.split1End, 20) + decay(f, T.resaleEnd + 10, 26)}
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
        <Place p={{ x: BOB.x - 330, y: TRAY_Y + 60 }}>
          <Chip show={life(f, T.resaleEnd + 12, 1128)} tone="green" size={24}>
            Earned before resale · still Bob’s
          </Chip>
        </Place>

        {/* backing coins flying into the vault */}
        {[0, 1, 2, 3, 4].map((k) => {
          const s = T.coinsFly + k * T.coinGap;
          const t = tween(f, s, s + T.coinFlight, 0, 1, easeInOut);
          if (f < s || f > s + T.coinFlight + 2) return null;
          const p = arcPoint(
            t,
            { x: ALICE.x, y: ALICE.y - 30 },
            { x: VAULT.x, y: -200 },
            260,
          );
          return (
            <Place key={k} p={p}>
              <IncomeDrop size={70} spin={t * 360} glow={0.6} />
            </Place>
          );
        })}

        {/* offer ticket */}
        {f >= T.ticketOpen && ticketOut < 1 ? (
          <div
            style={{
              position: 'absolute',
              left: TICKET.x - 240 + tOff.x,
              top: TICKET.y - 225 + tOff.y,
              transformOrigin: '12% 12%',
              transform: `perspective(1600px) rotateY(${(1 - ticketOpen) * 70 - 4}deg) rotateZ(${-2 + ticketOut * -6}deg) scale(${(0.2 + 0.72 * ticketOpen) * (tScale / 0.92) * (1 - ticketOut * 0.4)})`,
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
          doneLabel="Settled · right → Bob, 90 DemoUSD → Alice"
          opacity={1 - tween(f, 556, 580)}
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

        {/* payment trails + coins */}
        {f >= T.xfer && f <= T.xferEnd + 12 ? (
          <>
            <Trail
              d={arcPath({ x: BOB.x, y: -20 }, { x: ALICE.x, y: -20 }, 520)}
              head={pay1Head}
              color="#dfe6ec"
              opacity={1 - tween(f, T.xferEnd, T.xferEnd + 12)}
            />
            <Place
              p={pay1}
              style={{ opacity: 1 - tween(f, T.xferEnd - 2, T.xferEnd + 8) }}
            >
              <PayCoin size={96} label="90 DemoUSD" spin={f * 6} />
            </Place>
          </>
        ) : null}
        {f >= T.resaleXfer && f <= T.resaleEnd + 12 ? (
          <>
            <Trail
              d={arcPath({ x: CAROL.x, y: -20 }, { x: BOB.x, y: -20 }, 300)}
              head={pay2Head}
              color="#dfe6ec"
              opacity={1 - tween(f, T.resaleEnd, T.resaleEnd + 12)}
            />
            <Place
              p={pay2}
              style={{
                opacity: 1 - tween(f, T.resaleEnd - 2, T.resaleEnd + 8),
              }}
            >
              <PayCoin size={90} label="45 DemoUSD" spin={f * 6} />
            </Place>
          </>
        ) : null}

        {/* ring trail while it travels to a new owner */}
        {f >= T.xfer && f <= T.xferEnd + 12 ? (
          <Trail
            d={arcPath(TICKET_ICON, BOB, -60)}
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
        {ringOpacity > 0.01 &&
        f >= T.ringRise &&
        !(f > T.ringFly + 28 && f < T.xfer) ? (
          <Place p={ringPos} style={{ opacity: ringOpacity }}>
            <IncomeRing
              size={ringSize}
              spin={f * 1.5}
              elapsed={f >= T.termStart ? elapsed : undefined}
              termShow={termShow}
              glow={1}
            />
          </Place>
        ) : null}
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

        {/* income drops */}
        {drop1.show > 0.01 ? (
          <Place
            p={{ x: VAULT.x, y: drop1.y }}
            style={{ scale: String(Math.max(0, drop1.show)) }}
          >
            <IncomeDrop size={96} spin={f * 4} glow={1.2} />
          </Place>
        ) : null}
        {drop2.show > 0.01 ? (
          <Place
            p={{ x: VAULT.x, y: drop2.y }}
            style={{ scale: String(Math.max(0, drop2.show)) }}
          >
            <IncomeDrop size={96} spin={f * 4} glow={1.2} />
          </Place>
        ) : null}
        <SplitDrops
          f={f}
          start={T.split1}
          end={T.split1End}
          from={splitFrom1}
          targets={[trayA, trayB]}
        />
        <SplitDrops
          f={f}
          start={T.split2}
          end={T.split2End}
          from={splitFrom1}
          targets={[trayA, trayC]}
        />

        {/* cursors */}
        <Cursor
          x={bobCursor.x}
          y={bobCursor.y}
          click={bobClick}
          show={life(f, T.cursorIn, T.click + 16, 8, 14)}
        />
        <Cursor
          x={carolCursor.x}
          y={carolCursor.y}
          click={carolClick}
          show={life(f, T.resaleCard + 14, T.carolClick + 16, 8, 14)}
        />
      </div>

      <Caption start={24} end={150} lines={[{ text: m.lock }]} />
      <Caption start={162} end={318} lines={[{ text: m.terms }]} />
      <Caption start={344} end={470} lines={[{ text: m.buy }]} />
      <Caption start={484} end={596} lines={[{ text: m.clock }]} />
      <Caption start={612} end={740} lines={[{ text: m.income }]} />
      <Caption start={752} end={846} lines={[{ text: m.claim }]} />
      <Caption start={862} end={990} lines={[{ text: m.resale }]} />
      <Caption start={1004} end={1126} lines={[{ text: m.deadline }]} />
      <Caption start={1186} end={1240} lines={[{ text: m.summary }]} />
    </AbsoluteFill>
  );
};

const SplitDrops: React.FC<{
  f: number;
  start: number;
  end: number;
  from: Point;
  targets: readonly [Point, Point];
}> = ({ f, start, end, from, targets }) => {
  if (f < start || f > end + 10) return null;
  const t = tween(f, start, end, 0, 1, easeInOut);
  const fade = 1 - tween(f, end - 4, end + 6);
  return (
    <>
      {targets.map((target, i) => {
        const p = arcPoint(t, from, target, 200);
        return (
          <div key={i}>
            <Trail d={arcPath(from, target, 200)} head={t} opacity={fade} />
            <Place p={p} style={{ opacity: fade }}>
              <IncomeDrop size={66} label="0.50" spin={f * 5 + i * 90} />
            </Place>
          </div>
        );
      })}
    </>
  );
};
