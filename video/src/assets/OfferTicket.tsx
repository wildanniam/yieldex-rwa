import type React from 'react';
import { C, FONT, primaryGradient } from '../theme';
import { IncomeRing } from './IncomeRing';
import { TokenBrand } from './TokenBrand';

type OfferTicketProps = {
  readonly width?: number;
  /** Per-row reveal 0..1: share, term, price, validity. */
  readonly rows?: readonly [number, number, number, number];
  readonly share: number;
  readonly price: number;
  readonly term: string;
  readonly validity: string;
  readonly status: string;
  readonly statusTone?: 'green' | 'neutral';
  /** 0..1 button visibility. */
  readonly button?: number;
  /** 0..1 pressed state. */
  readonly pressed?: number;
  readonly buttonLabel?: string;
  readonly kind?: string;
  readonly spin?: number;
  /** 0..1 progress of a light sweep across the card. */
  readonly sheen?: number;
};

const Row: React.FC<{
  label: string;
  show: number;
  children: React.ReactNode;
}> = ({ label, show, children }) => (
  <div style={{ opacity: show, translate: `0 ${(1 - show) * 18}px` }}>
    <div style={{ fontSize: 20, color: '#9aae9e', marginBottom: 8 }}>
      {label}
    </div>
    <div
      style={{
        fontSize: 50,
        fontWeight: 460,
        letterSpacing: '-0.035em',
        color: C.text1,
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  </div>
);

const Unit: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: 22,
      letterSpacing: 0,
      marginLeft: 6,
      color: '#b9cdbd',
      fontWeight: 400,
    }}
  >
    {children}
  </span>
);

type ResaleCardProps = {
  readonly status: string;
  readonly button?: number;
  readonly pressed?: number;
  readonly spin?: number;
};

/** Compact secondary listing: the whole remaining position, fixed price. */
export const ResaleCard: React.FC<ResaleCardProps> = ({
  status,
  button = 1,
  pressed = 0,
  spin = 0,
}) => (
  <div
    style={{
      width: 600,
      padding: '26px 28px',
      borderRadius: 28,
      fontFamily: FONT,
      background: 'linear-gradient(140deg, #24352b, #101b16 70%)',
      border: '1.5px solid rgba(172, 199, 173, 0.42)',
      boxShadow:
        '0 36px 70px rgba(0,0,0,0.55), inset 0 1px rgba(210, 246, 212, 0.1)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <IncomeRing size={52} spin={spin} glow={0.5} ticks={0} />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: '#dfebe1',
            letterSpacing: '-0.02em',
          }}
        >
          Whole position
        </div>
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.18em',
            color: '#91a699',
            marginTop: 4,
          }}
        >
          RESALE · AAPLx
        </div>
      </div>
      <div
        style={{
          fontSize: 19,
          color: '#c4e3c8',
          padding: '8px 14px',
          borderRadius: 999,
          border: '1.5px solid rgba(158,197,163,0.45)',
        }}
      >
        {status}
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 22,
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 30 }}>
        {[
          ['Income', '50%'],
          ['Left', '118 days'],
          ['Price', '45 USDC'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 18, color: '#9aae9e' }}>{k}</div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: C.text1,
                letterSpacing: '-0.03em',
                marginTop: 6,
                whiteSpace: 'nowrap',
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          opacity: Math.min(1, button),
          scale: String(1 - pressed * 0.06),
          padding: '14px 24px',
          borderRadius: 999,
          background: primaryGradient,
          color: C.primaryLabel,
          fontSize: 24,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: `0 0 ${18 + pressed * 30}px rgba(153,227,158,${0.35 + pressed * 0.4})`,
        }}
      >
        Buy
      </div>
    </div>
  </div>
);

/** Fixed-price offer for an income right; DNA from the landing offer ticket. */
export const OfferTicket: React.FC<OfferTicketProps> = ({
  width = 480,
  rows = [1, 1, 1, 1],
  share,
  price,
  term,
  validity,
  status,
  statusTone = 'green',
  button = 0,
  pressed = 0,
  buttonLabel = 'Buy rights',
  kind = 'INCOME RIGHTS',
  spin = 0,
  sheen = 0,
}) => (
  <div
    style={{
      width,
      padding: 32,
      borderRadius: 30,
      fontFamily: FONT,
      background: 'linear-gradient(140deg, #26392c, #111d17 70%)',
      border: '1.5px solid rgba(172, 199, 173, 0.42)',
      boxShadow:
        '0 40px 80px rgba(0,0,0,0.55), inset 0 1px rgba(210, 246, 212, 0.1)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}
      >
        <IncomeRing size={60} spin={spin} glow={0.5} ticks={0} />
        <div style={{ position: 'absolute', inset: 18 }}>
          <TokenBrand brand="AAPLx" size={24} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: '#dfebe1',
            letterSpacing: '-0.02em',
          }}
        >
          AAPLx
        </div>
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.18em',
            color: '#91a699',
            marginTop: 4,
          }}
        >
          {kind}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 999,
          border: `1.5px solid ${statusTone === 'green' ? 'rgba(158,197,163,0.45)' : 'rgba(171,194,181,0.3)'}`,
          color: statusTone === 'green' ? '#c4e3c8' : C.text2,
          fontSize: 19,
          whiteSpace: 'nowrap',
        }}
      >
        <i
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: statusTone === 'green' ? '#a8dda4' : C.text3,
            boxShadow: statusTone === 'green' ? '0 0 10px #a8dda4' : undefined,
          }}
        />
        {status}
      </div>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '26px 18px',
        margin: '30px 0 26px',
      }}
    >
      <Row label="Income share" show={rows[0]}>
        {Math.round(share)}
        <Unit>%</Unit>
      </Row>
      <Row label="Term" show={rows[1]}>
        {term}
      </Row>
      <Row label="Fixed price" show={rows[2]}>
        {Math.round(price)}
        <Unit>USDC</Unit>
      </Row>
      <Row label="Offer valid" show={rows[3]}>
        {validity}
      </Row>
    </div>
    <div
      style={{
        position: 'relative',
        height: 1,
        margin: '0 -32px 22px',
        borderTop: '2px dashed rgba(148, 177, 155, 0.35)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: -12,
          top: -13,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#0a1310',
          border: '1.5px solid rgba(142,175,148,0.35)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          right: -12,
          top: -13,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#0a1310',
          border: '1.5px solid rgba(142,175,148,0.35)',
        }}
      />
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        minHeight: 64,
      }}
    >
      <div
        style={{
          fontSize: 19,
          lineHeight: 1.35,
          color: '#9cb2a3',
          maxWidth: 190,
        }}
      >
        Term starts when
        <br />a buyer pays
      </div>
      <div
        style={{
          opacity: Math.min(1, button),
          scale: String((0.8 + 0.2 * button) * (1 - pressed * 0.06)),
          padding: '18px 30px',
          borderRadius: 999,
          background: primaryGradient,
          color: C.primaryLabel,
          fontSize: 26,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: `0 0 ${20 + pressed * 30}px rgba(153,227,158,${0.35 + pressed * 0.4})`,
          filter: pressed > 0 ? `brightness(${1 + pressed * 0.15})` : undefined,
        }}
      >
        {buttonLabel}
      </div>
    </div>
    {sheen > 0 && sheen < 1 ? (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          background: `linear-gradient(115deg, transparent ${sheen * 160 - 50}%, rgba(220, 255, 225, 0.22) ${sheen * 160 - 35}%, transparent ${sheen * 160 - 20}%)`,
        }}
      />
    ) : null}
  </div>
);
