import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { AiOrb } from './assets/AiOrb';
import { Atmosphere } from './assets/Atmosphere';
import { ExplainCard, ListingRow, PreviewCard } from './assets/Chat';
import { PayCoin, StockCoin } from './assets/Coins';
import { AllocationDial } from './assets/Dial';
import { IncomeRing } from './assets/IncomeRing';
import { Cursor } from './assets/Interaction';
import { LedgerBlock } from './assets/Ledger';
import { Lockup, LogoMark } from './assets/Logo';
import { OfferTicket, ResaleCard } from './assets/OfferTicket';
import { Avatar, Balance, ClaimTray } from './assets/People';
import { Chip, Kicker } from './assets/Type';
import { Vault } from './assets/Vault';
import { copy } from './copy';
import { C, FONT } from './theme';

const FULL_STACK = [1, 1, 1, 1, 1];

/** Center a wide element in a cell, then scale it down. */
const fit = (width: number, scale: number): React.CSSProperties => ({
  position: 'absolute',
  left: '50%',
  top: '44%',
  width,
  translate: '-50% -50%',
  scale: String(scale),
});

/** Individually exportable assets, rendered on a transparent canvas. */
export const ASSETS = {
  'stock-coin': {
    w: 900,
    h: 900,
    node: <StockCoin size={560} spin={22} tilt={6} />,
  },
  'pay-coin': { w: 900, h: 900, node: <PayCoin size={560} spin={22} /> },
  'income-ring': {
    w: 900,
    h: 900,
    node: <IncomeRing size={600} elapsed={0.34} spin={40} />,
  },
  vault: {
    w: 1200,
    h: 1100,
    node: <Vault width={1000} coins={FULL_STACK} locked={1} />,
  },
  'ai-orb': { w: 1100, h: 1100, node: <AiOrb size={520} /> },
  'allocation-dial': {
    w: 1000,
    h: 1000,
    node: <AllocationDial size={760} income={200} share={0.5} />,
  },
  'claim-tray': {
    w: 700,
    h: 560,
    node: <ClaimTray amount={0.5} width={520} />,
  },
  'offer-ticket': {
    w: 700,
    h: 640,
    node: (
      <OfferTicket
        share={50}
        price={90}
        term="6 months"
        validity="7 days"
        status="Offer open"
        button={1}
      />
    ),
  },
  'resale-card': {
    w: 760,
    h: 360,
    node: <ResaleCard status="Listed by Bob" />,
  },
  'logo-lockup': { w: 1400, h: 500, node: <Lockup size={200} /> },
  'logo-mark': { w: 600, h: 600, node: <LogoMark size={420} /> },
  'avatar-alice': {
    w: 520,
    h: 560,
    node: <Avatar name="Alice" role="Keeps the principal" size={240} />,
  },
  'avatar-bob': {
    w: 520,
    h: 560,
    node: <Avatar name="Bob" role="Buys the income" tone="slate" size={240} />,
  },
  'avatar-carol': {
    w: 520,
    h: 560,
    node: <Avatar name="Carol" role="Buys it next" tone="teal" size={240} />,
  },
  'ledger-block': {
    w: 640,
    h: 340,
    node: (
      <LedgerBlock
        index={2}
        name="IncomeAllocated"
        detail="0.50 Alice · 0.50 Bob"
      />
    ),
  },
} as const;

export type AssetName = keyof typeof ASSETS;

export const AssetStill: React.FC<{ readonly name: AssetName }> = ({
  name,
}) => (
  <AbsoluteFill
    style={{ display: 'grid', placeItems: 'center', fontFamily: FONT }}
  >
    {ASSETS[name].node}
  </AbsoluteFill>
);

const Cell: React.FC<{
  readonly label: string;
  readonly note?: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ label, note, children, style }) => (
  <div
    style={{
      position: 'relative',
      borderRadius: 28,
      border: `1px solid ${C.hairline}`,
      background: 'rgba(6, 12, 14, 0.55)',
      overflow: 'hidden',
      display: 'grid',
      placeItems: 'center',
      ...style,
    }}
  >
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        height: '100%',
        paddingBottom: 56,
      }}
    >
      {children}
    </div>
    <div
      style={{ position: 'absolute', left: 24, bottom: 18, fontFamily: FONT }}
    >
      <div style={{ fontSize: 22, fontWeight: 600, color: C.text1 }}>
        {label}
      </div>
      {note ? (
        <div style={{ fontSize: 16, color: C.text2, marginTop: 2 }}>{note}</div>
      ) : null}
    </div>
  </div>
);

const SheetTitle: React.FC<{ title: string; sub: string }> = ({
  title,
  sub,
}) => (
  <div style={{ position: 'absolute', left: 60, top: 40, fontFamily: FONT }}>
    <Kicker size={16}>Yieldex film · asset kit</Kicker>
    <div
      style={{
        fontSize: 40,
        fontWeight: 500,
        color: C.text1,
        letterSpacing: '-0.03em',
        marginTop: 6,
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: 20, color: C.text2, marginTop: 4 }}>{sub}</div>
  </div>
);

export const AssetSheetObjects: React.FC = () => (
  <AbsoluteFill>
    <Atmosphere trails={0} />
    <SheetTitle
      title="Objects"
      sub="Each object is a product concept: what moves, what stays, who controls it."
    />
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 170,
        bottom: 50,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 22,
      }}
    >
      <Cell label="Stock token" note="Principal · demoAAPL (simulated)">
        <StockCoin size={220} spin={24} tilt={6} />
      </Cell>
      <Cell label="Payment token" note="DemoUSD · always neutral silver">
        <PayCoin size={200} spin={24} />
      </Cell>
      <Cell label="Income right" note="Ring = right · outer track = term clock">
        <IncomeRing size={260} elapsed={0.34} spin={40} />
      </Cell>
      <Cell label="Backing vault" note="Locked shares that back the right">
        <Vault width={330} coins={FULL_STACK} locked={1} />
      </Cell>
      <Cell label="Yieldex AI" note="Purple is reserved for intelligence">
        <AiOrb size={170} />
      </Cell>
      <Cell
        label="Allocation dial"
        note="Buyer arc (mint) · seller arc (neutral)"
      >
        <AllocationDial size={270} income={200} share={0.5}>
          <div style={{ fontSize: 54, fontWeight: 500 }}>100</div>
        </AllocationDial>
      </Cell>
      <Cell label="Claim tray" note="Allocated income, claimable in-kind">
        <ClaimTray amount={0.5} width={260} />
      </Cell>
      <Cell label="Logo" note="Facets assemble from the footer mark">
        <Lockup size={74} />
      </Cell>
    </div>
  </AbsoluteFill>
);

export const AssetSheetInterface: React.FC = () => (
  <AbsoluteFill>
    <Atmosphere trails={0} />
    <SheetTitle
      title="Interface pieces"
      sub="Stylized from the shared design system; numbers are illustrative."
    />
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 170,
        bottom: 50,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 22,
      }}
    >
      <Cell label="Offer ticket" note="Primary listing · fixed price">
        <div style={{ scale: '0.66', marginTop: -70 }}>
          <OfferTicket
            share={50}
            price={90}
            term="6 months"
            validity="7 days"
            status="Offer open"
            button={1}
          />
        </div>
      </Cell>
      <Cell label="Participants" note="Alice · Bob · Carol with wallet balance">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 26,
            scale: '0.8',
            marginTop: -40,
          }}
        >
          <Balance amount={1090} delta={90} deltaShow={1} />
          <div style={{ display: 'flex', gap: 70 }}>
            <Avatar name="Alice" role="Principal" size={110} />
            <Avatar name="Bob" role="Income" tone="slate" size={110} />
            <Avatar name="Carol" role="Next buyer" tone="teal" size={110} />
          </div>
        </div>
      </Cell>
      <Cell
        label="Ledger block"
        note="Real event names from IIncomeRightsMarket"
      >
        <div style={{ scale: '0.95' }}>
          <LedgerBlock
            index={1}
            name="ListingFilled"
            detail="90 DemoUSD → Alice · right → Bob"
            glow={0.5}
          />
        </div>
      </Cell>
      <Cell label="AI cards" note="Listing comparison + explanation">
        <div
          style={{
            ...fit(840, 0.6),
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <ListingRow
            glyph="A"
            ticker="demoAAPL"
            kind="Primary"
            share="50%"
            term="6 months"
            price="90 DemoUSD"
            show={1}
            highlight={1}
          />
          <ExplainCard
            lines={copy.assistant.explain}
            show={1}
            lineShow={[1, 1, 1]}
          />
        </div>
      </Cell>
      <Cell label="Resale + preview" note="Whole position · wallet confirms">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            ...fit(860, 0.6),
          }}
        >
          <ResaleCard status="Listed by Bob" />
          <PreviewCard show={1} glow={0.5} />
        </div>
      </Cell>
      <Cell
        label="Chips + cursor"
        note="Green = action · purple = AI · yellow = warning only"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
          }}
        >
          <Chip tone="green" size={24}>
            Dividend event · +1 demoAAPL
          </Chip>
          <Chip tone="neutral" size={24}>
            Backing · 100 demoAAPL · locked
          </Chip>
          <Chip tone="purple" size={24}>
            Read-only quotes
          </Chip>
          <Chip tone="solid" size={24}>
            Settled
          </Chip>
          <div style={{ position: 'relative', width: 60, height: 60 }}>
            <Cursor x={20} y={10} click={0.5} />
          </div>
        </div>
      </Cell>
    </div>
  </AbsoluteFill>
);
