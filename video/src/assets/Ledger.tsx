import type React from 'react';
import { C, FONT } from '../theme';

type LedgerBlockProps = {
  readonly index: number;
  readonly name: string;
  readonly detail: string;
  readonly glow?: number;
};

/** One onchain event, shown as a sealed block with its real event name. */
export const LedgerBlock: React.FC<LedgerBlockProps> = ({
  index,
  name,
  detail,
  glow = 0,
}) => (
  <div
    style={{
      position: 'relative',
      width: 420,
      padding: '26px 28px 24px',
      borderRadius: 26,
      fontFamily: FONT,
      background: 'linear-gradient(150deg, #162a20, #0a1310 72%)',
      border: `1.5px solid rgba(153, 227, 158, ${0.22 + glow * 0.5})`,
      boxShadow: `0 40px 80px rgba(0,0,0,0.55), 0 0 ${glow * 50}px rgba(153,227,158,${glow * 0.35}), inset 0 1px rgba(210,246,212,0.1)`,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: 18, letterSpacing: '0.18em', color: '#9cab9f' }}>
        EVENT {String(index + 1).padStart(2, '0')}
      </span>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path
          d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4Z"
          stroke={C.green1}
          strokeOpacity="0.8"
          strokeWidth="1.6"
        />
        <path
          d="m4 7.4 8 4.6 8-4.6M12 12v9.2"
          stroke={C.green1}
          strokeOpacity="0.5"
          strokeWidth="1.6"
        />
      </svg>
    </div>
    <div
      style={{
        fontSize: 34,
        fontWeight: 600,
        color: C.text1,
        letterSpacing: '-0.02em',
        marginTop: 14,
      }}
    >
      {name}
    </div>
    <div
      style={{
        fontSize: 22,
        color: C.text2,
        marginTop: 8,
        whiteSpace: 'nowrap',
      }}
    >
      {detail}
    </div>
  </div>
);
