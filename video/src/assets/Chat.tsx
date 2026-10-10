import type React from 'react';
import { C, FONT, primaryGradient } from '../theme';

const appear = (show: number): React.CSSProperties => {
  const vis = Math.max(0, Math.min(1, show));
  return {
    opacity: vis,
    translate: `0 ${(1 - show) * 28}px`,
    filter: vis < 0.98 ? `blur(${(1 - vis) * 8}px)` : undefined,
  };
};

export const ChatPanel: React.FC<{
  readonly children: React.ReactNode;
  readonly width?: number;
  readonly height?: number;
}> = ({ children, width = 900, height = 700 }) => (
  <div
    style={{
      position: 'relative',
      isolation: 'isolate',
      width,
      height,
      borderRadius: 40,
      overflow: 'hidden',
      fontFamily: FONT,
      background:
        'linear-gradient(160deg, rgba(24, 21, 58, 0.92), rgba(8, 9, 20, 0.94) 60%)',
      border: '1.5px solid rgba(124, 114, 254, 0.38)',
      boxShadow:
        '0 60px 120px rgba(0,0,0,0.6), 0 0 80px rgba(124,114,254,0.18), inset 0 1px rgba(255,255,255,0.08)',
    }}
  >
    {children}
  </div>
);

export const ChatHeader: React.FC<{ readonly orb: React.ReactNode }> = ({
  orb,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 96,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '0 34px',
      borderBottom: '1px solid rgba(124, 114, 254, 0.2)',
      background: '#0e0c22',
      zIndex: 3,
    }}
  >
    {orb}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: C.text1,
          letterSpacing: '-0.02em',
        }}
      >
        Yieldex AI
      </div>
      <div style={{ fontSize: 19, color: '#a9a4d8', marginTop: 2 }}>
        Answers from onchain listings
      </div>
    </div>
    <div
      style={{
        fontSize: 20,
        color: '#e1ddff',
        padding: '8px 16px',
        borderRadius: 999,
        border: '1.5px solid rgba(124,114,254,0.55)',
        background: 'rgba(40, 32, 100, 0.6)',
      }}
    >
      Read-only
    </div>
  </div>
);

export const UserBubble: React.FC<{
  readonly text: string;
  readonly show: number;
}> = ({ text, show }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', ...appear(show) }}>
    <div
      style={{
        maxWidth: 620,
        padding: '22px 28px',
        borderRadius: '30px 30px 8px 30px',
        background: 'linear-gradient(180deg, #2a2560, #1d1a47)',
        border: '1.5px solid rgba(124,114,254,0.4)',
        color: '#f0eeff',
        fontSize: 30,
        lineHeight: 1.35,
        letterSpacing: '-0.01em',
      }}
    >
      {text}
    </div>
  </div>
);

export const AiText: React.FC<{
  readonly children: React.ReactNode;
  readonly show: number;
}> = ({ children, show }) => (
  <div
    style={{
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
      ...appear(show),
    }}
  >
    <i
      style={{
        marginTop: 12,
        width: 14,
        height: 14,
        flex: 'none',
        borderRadius: '50%',
        background: C.purple1,
        boxShadow: `0 0 14px ${C.purple1}`,
      }}
    />
    <div style={{ fontSize: 29, lineHeight: 1.4, color: '#dedcf3' }}>
      {children}
    </div>
  </div>
);

export const TypingDots: React.FC<{
  readonly frame: number;
  readonly show: number;
}> = ({ frame, show }) => (
  <div
    style={{
      display: 'flex',
      gap: 10,
      padding: '14px 4px 14px 30px',
      ...appear(show),
    }}
  >
    {[0, 1, 2].map((i) => (
      <i
        key={i}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#b3acff',
          opacity: 0.35 + 0.65 * Math.max(0, Math.sin(frame / 4 - i * 0.9)),
        }}
      />
    ))}
  </div>
);

type ListingProps = {
  readonly glyph: string;
  readonly ticker: string;
  readonly kind: 'Primary' | 'Resale';
  readonly share: string;
  readonly term: string;
  readonly price: string;
  readonly show: number;
  readonly highlight?: number;
};

export const ListingRow: React.FC<ListingProps> = ({
  glyph,
  ticker,
  kind,
  share,
  term,
  price,
  show,
  highlight = 0,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '64px 1.5fr 0.8fr 1.2fr 1.3fr',
      alignItems: 'center',
      gap: 16,
      padding: '18px 24px',
      borderRadius: 22,
      background: `linear-gradient(120deg, rgba(20, 34, 28, ${0.85 + highlight * 0.1}), rgba(11, 16, 18, 0.9))`,
      border: `1.5px solid rgba(153, 227, 158, ${0.16 + highlight * 0.5})`,
      boxShadow:
        highlight > 0
          ? `0 0 ${30 * highlight}px rgba(153,227,158,${0.25 * highlight})`
          : undefined,
      ...appear(show),
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: '#2d4a37',
        border: '1.5px solid rgba(159,206,174,0.5)',
        color: '#dcf3de',
        fontSize: 26,
        fontWeight: 600,
      }}
    >
      {glyph}
    </div>
    <div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: C.text1,
          letterSpacing: '-0.02em',
        }}
      >
        {ticker}
      </div>
      <div
        style={{
          fontSize: 17,
          letterSpacing: '0.14em',
          color: '#9cab9f',
          marginTop: 4,
        }}
      >
        {kind.toUpperCase()}
      </div>
    </div>
    <Stat label="Income" value={share} />
    <Stat label={kind === 'Resale' ? 'Left' : 'Term'} value={term} />
    <Stat label="Fixed price" value={price} />
  </div>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ whiteSpace: 'nowrap' }}>
    <div style={{ fontSize: 17, color: '#9aae9e' }}>{label}</div>
    <div
      style={{
        fontSize: 27,
        fontWeight: 500,
        color: C.text1,
        letterSpacing: '-0.02em',
        marginTop: 4,
      }}
    >
      {value}
    </div>
  </div>
);

export const ExplainCard: React.FC<{
  readonly lines: readonly string[];
  readonly show: number;
  readonly lineShow: readonly number[];
}> = ({ lines, show, lineShow }) => (
  <div
    style={{
      padding: '26px 30px',
      borderRadius: 26,
      background:
        'linear-gradient(140deg, rgba(48, 40, 120, 0.55), rgba(18, 16, 44, 0.85))',
      border: '1.5px solid rgba(124,114,254,0.45)',
      ...appear(show),
    }}
  >
    <div
      style={{
        fontSize: 18,
        letterSpacing: '0.18em',
        color: '#b9b3ff',
        marginBottom: 16,
      }}
    >
      BEFORE YOU BUY
    </div>
    {lines.map((line, i) => (
      <div
        key={line}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 30,
          color: C.text1,
          marginTop: i ? 14 : 0,
          letterSpacing: '-0.01em',
          ...appear(lineShow[i] ?? 1),
        }}
      >
        <i
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            flex: 'none',
            background: i === 1 ? C.yellow : '#b9b3ff',
            boxShadow: `0 0 12px ${i === 1 ? C.yellow : '#b9b3ff'}`,
          }}
        />
        {line}
      </div>
    ))}
  </div>
);

export const PreviewCard: React.FC<{
  readonly show: number;
  readonly glow?: number;
}> = ({ show, glow = 0 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      padding: '24px 28px',
      borderRadius: 26,
      background:
        'linear-gradient(120deg, rgba(20, 38, 28, 0.95), rgba(10, 16, 16, 0.95))',
      border: '1.5px solid rgba(153,227,158,0.4)',
      ...appear(show),
    }}
  >
    <div>
      <div style={{ fontSize: 18, letterSpacing: '0.18em', color: '#9cab9f' }}>
        PURCHASE PREVIEW · SEPOLIA
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 500,
          color: C.text1,
          marginTop: 8,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        demoAAPL · 50% · 6 months
      </div>
      <div
        style={{
          fontSize: 20,
          color: C.text2,
          marginTop: 6,
          whiteSpace: 'nowrap',
        }}
      >
        90 DemoUSD · listing re-checked · nothing sent yet
      </div>
    </div>
    <div
      style={{
        padding: '18px 28px',
        borderRadius: 999,
        background: primaryGradient,
        color: C.primaryLabel,
        fontSize: 25,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        boxShadow: `0 0 ${20 + glow * 30}px rgba(153,227,158,${0.3 + glow * 0.4})`,
      }}
    >
      Confirm in wallet
    </div>
  </div>
);
