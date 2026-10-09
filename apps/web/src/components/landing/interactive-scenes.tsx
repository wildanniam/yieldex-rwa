'use client';

import { useState, type CSSProperties } from 'react';
import { Icon } from '@/components/ui/icon';
import {
  SCENARIO_CENTS,
  PURCHASE_CENTS,
  incomeScenario,
  fixedHundredths,
} from './income-math';
import s from './interactive-scenes.module.css';

const STEPS = [
  {
    title: 'Lock & list',
    detail:
      'Alice deposits 100 demoAAPL and offers 50% of its income. Her price: 90 DemoUSD. Her term: six months.',
    note: 'The backing is held in the vault. Ownership stays with Alice.',
    status: 'Offer open',
    caption: 'Set the terms. Keep the asset.',
  },
  {
    title: 'Buy the rights',
    detail:
      'Bob pays Alice 90 DemoUSD upfront. His 50% income right becomes active, and the six-month clock starts now.',
    note: 'Bob buys the income rights. The 100 demoAAPL backing stays in the vault.',
    status: 'Rights active',
    caption: 'The income right moves. The backing stays.',
  },
  {
    title: 'Claim the income',
    detail:
      'If 1 demoAAPL of income is allocated during the term, Alice and Bob can each claim 0.50 demoAAPL.',
    note: 'Each person claims their own share. No income means nothing to claim.',
    status: 'Income allocated',
    caption: 'One income event. Two separate claims.',
  },
] as const;

function VaultScene() {
  return (
    <svg
      viewBox="0 0 360 300"
      className={s.vault}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="flow-front"
          x1="90"
          y1="60"
          x2="245"
          y2="264"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#46634d" stopOpacity=".8" />
          <stop offset="1" stopColor="#101d19" stopOpacity=".98" />
        </linearGradient>
        <linearGradient
          id="flow-top"
          x1="125"
          y1="22"
          x2="241"
          y2="126"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b3d7ba" stopOpacity=".6" />
          <stop offset="1" stopColor="#3c5644" stopOpacity=".1" />
        </linearGradient>
        <linearGradient id="flow-coin">
          <stop stopColor="#406b45" />
          <stop offset=".5" stopColor="#b1e5a9" />
          <stop offset="1" stopColor="#57895b" />
        </linearGradient>
      </defs>
      <ellipse
        cx="178"
        cy="264"
        rx="132"
        ry="27"
        fill="#8fc89f"
        opacity=".045"
      />
      <path
        d="m62 97 128-58 105 49-131 61Z"
        fill="url(#flow-top)"
        stroke="#d0e9d0"
        strokeOpacity=".28"
      />
      <path
        d="m164 149 131-61v134l-131 60Z"
        fill="#0e201b"
        stroke="#afd4b7"
        strokeOpacity=".25"
      />
      <path
        d="m62 97 102 52v133L62 230Z"
        fill="url(#flow-front)"
        stroke="#c4e9c8"
        strokeOpacity=".4"
      />
      <path d="m73 112 80 41v109l-80-40Z" stroke="#a4d2ac" strokeOpacity=".3" />
      <path
        d="m62 97 128-58 105 49M164 149v133"
        stroke="#d0edce"
        strokeOpacity=".5"
      />
      <g className={s.vaultCoins}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(0 ${-i * 11})`}>
            <path d="M148 132v9c0 11 66 11 66 0v-9" fill="url(#flow-coin)" />
            <ellipse
              cx="181"
              cy="132"
              rx="33"
              ry="9"
              fill="#98c796"
              stroke="#c6eac0"
              strokeWidth=".7"
            />
          </g>
        ))}
        <path d="m172 96 9-4 9 4-9 4Zm0-6 9-4 9 4-9 4Z" fill="#47744f" />
      </g>
      <path
        d="m175 157 107-49v104l-107 49Z"
        fill="#aac9b2"
        fillOpacity=".045"
        stroke="#b6dbbb"
        strokeOpacity=".12"
      />
      <ellipse
        cx="113"
        cy="185"
        rx="20"
        ry="27"
        transform="rotate(-25 113 185)"
        fill="#192c21"
        stroke="#aed8b2"
        strokeOpacity=".5"
      />
      <path d="m106 180 13 6v15l-13-6Z" fill="#a3d59f" />
      <path d="M109 181v-6c0-7 8-4 8 3v7" stroke="#a3d59f" strokeWidth="2" />
      <path
        d="m232 134 32-15M232 143l32-15"
        stroke="#a9d7ad"
        strokeOpacity=".28"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FlowStory() {
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;
  return (
    <div className={s.story}>
      <div className={s.storyStage} data-step={step}>
        <div className={s.sceneTop}>
          <span>ONE OFFER, FROM START TO CLAIM</span>
          <span className={s.status}>
            <i />
            {current.status}
          </span>
        </div>
        <div className={s.diagram}>
          <svg
            className={s.connections}
            viewBox="0 0 1000 340"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M158 170H380M620 170H842" />
            <path className={s.paymentPath} d="M842 120V45H158V120" />
            {step === 1 && (
              <path
                key="payment"
                className={s.signal}
                pathLength="100"
                d="M842 120V45H158V120"
              />
            )}
            {step === 2 && (
              <g key="allocation">
                <path
                  className={s.signal}
                  pathLength="100"
                  d="M500 185V270Q500 290 470 290H158V220"
                />
                <path
                  className={s.signal}
                  pathLength="100"
                  d="M500 185V270Q500 290 530 290H842V220"
                />
              </g>
            )}
            <path
              className={s.incomePath}
              d="M500 185V270Q500 290 470 290H158V220M500 270Q500 290 530 290H842V220"
            />
          </svg>
          <div className={`${s.person} ${s.alice}`}>
            <div className={s.avatar}>
              A<span>↗</span>
            </div>
            <strong>Alice</strong>
            <small>Asset owner</small>
            <div className={s.personValue}>
              {step === 2
                ? '0.50 demoAAPL'
                : step === 1
                  ? '+90 DemoUSD'
                  : '100 demoAAPL'}
              <span>
                {step === 2
                  ? 'Available to claim'
                  : step === 1
                    ? 'Payment received'
                    : 'Deposited as backing'}
              </span>
            </div>
          </div>
          <div className={s.vaultSubject}>
            <VaultScene />
            <div className={s.vaultLabel}>
              <Icon name="vault" alt="" inheritColor size={15} />
              <span>
                <strong>100 demoAAPL</strong>
                <small>Backing stays in the vault</small>
              </span>
            </div>
          </div>
          <div className={`${s.person} ${s.bob}`}>
            <div className={s.avatar}>
              B<span>↙</span>
            </div>
            <strong>Bob</strong>
            <small>Income buyer</small>
            <div className={s.personValue}>
              {step === 2
                ? '0.50 demoAAPL'
                : step === 1
                  ? '50% income right'
                  : '50% · 6 months'}
              <span>
                {step === 2
                  ? 'Available to claim'
                  : step === 1
                    ? 'Six-month term starts'
                    : 'Offered for 90 DemoUSD'}
              </span>
            </div>
          </div>
          <div key={step} className={s.movingTicket} aria-hidden="true">
            <Icon
              name={step === 2 ? 'coins' : step === 1 ? 'receipt' : 'vault'}
              alt=""
              inheritColor
              size={16}
            />
            {step === 2
              ? '1 demoAAPL income'
              : step === 1
                ? '90 DemoUSD → Alice'
                : 'Offer · 50% income'}
          </div>
        </div>
        <div className={s.sceneCaption}>
          <span>0{step + 1} / 03</span>
          <p>{current.caption}</p>
          <span>Illustrative lifecycle</span>
        </div>
      </div>
      <div className={s.storyControls}>
        <div
          className={s.steps}
          role="group"
          aria-label="Explore the income lifecycle"
        >
          {STEPS.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-pressed={step === index}
              aria-controls="income-lifecycle-detail"
              onClick={() => setStep(index)}
            >
              <span>0{index + 1}</span>
              <strong>{item.title}</strong>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <div
          id="income-lifecycle-detail"
          className={s.stepDescription}
          aria-live="polite"
          aria-atomic="true"
        >
          <p>{current.detail}</p>
          <small>
            <Icon name="info" alt="" inheritColor size={14} />
            {current.note}
          </small>
        </div>
      </div>
      <div className={s.termNote}>
        <span>AFTER THE TERM</span>
        <p>
          Future income returns to Alice. Existing claims remain claimable.
          Backing is released once event accounting is safe.
        </p>
      </div>
      <noscript>
        <p>
          After Bob purchases the rights, the six-month term starts. If 1
          demoAAPL of income is allocated, each person can claim 0.50 demoAAPL.
        </p>
      </noscript>
    </div>
  );
}

export function IncomeCalculator() {
  const [scenario, setScenario] = useState(1);
  const [share, setShare] = useState(50);
  const income = SCENARIO_CENTS[scenario]!;
  const values = incomeScenario(income, BigInt(share) * 100n);
  const buyerArc = income === 0n ? 0 : share;
  const sellerArc = income === 0n ? 0 : 100 - share;
  const outcome =
    values.netCents > 0n
      ? 'positive'
      : values.netCents < 0n
        ? 'negative'
        : 'even';
  return (
    <div className={s.simulator}>
      <div className={s.allocation}>
        <div className={s.sceneTop}>
          <span>THE INCOME, DIVIDED</span>
          <span className={s.example}>ILLUSTRATION</span>
        </div>
        <div className={s.orbit} data-empty={income === 0n}>
          <svg viewBox="0 0 360 360" aria-hidden="true">
            <defs>
              <linearGradient
                id="split-ring"
                x1="30"
                y1="0"
                x2="340"
                y2="320"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#c3f2b8" />
                <stop offset=".5" stopColor="#7dca7f" />
                <stop offset="1" stopColor="#477c52" />
              </linearGradient>
            </defs>
            <circle cx="180" cy="180" r="167" className={s.orbitFine} />
            <circle cx="180" cy="180" r="122" className={s.orbitFine} />
            <circle cx="180" cy="180" r="145" className={s.orbitTrack} />
            <g transform="rotate(-90 180 180)">
              <circle
                cx="180"
                cy="180"
                r="145"
                pathLength="100"
                className={s.buyerArc}
                strokeDasharray={`${buyerArc} ${100 - buyerArc}`}
              />
              <circle
                cx="180"
                cy="180"
                r="145"
                pathLength="100"
                className={s.sellerArc}
                strokeDasharray={`${sellerArc} ${100 - sellerArc}`}
                strokeDashoffset={-buyerArc}
              />
            </g>
          </svg>
          <div className={s.orbitCenter}>
            <span>TOTAL INCOME VALUE</span>
            <strong>{fixedHundredths(income).replace('.00', '')}</strong>
            <small>DemoUSD equivalent</small>
            <em>
              {income === 0n
                ? 'No income to divide'
                : 'Over the six-month term'}
            </em>
          </div>
          <div
            className={s.orbitMarker}
            style={{ '--share-angle': `${share * 3.6}deg` } as CSSProperties}
            aria-hidden="true"
          >
            <i />
          </div>
        </div>
        <div className={s.splitLabels}>
          <div>
            <span>
              <i />
              Bob · {share}% bought
            </span>
            <strong>{fixedHundredths(values.buyerCents)}</strong>
            <small>Buyer’s income value</small>
          </div>
          <div>
            <span>
              <i />
              Alice · {100 - share}% kept
            </span>
            <strong>{fixedHundredths(values.sellerCents)}</strong>
            <small>Seller’s retained income value</small>
          </div>
        </div>
      </div>
      <div className={s.simulatorControls}>
        <span className={s.eyebrow}>CHANGE THE SCENARIO</span>
        <h3>
          Same price.
          <br />
          <em>Different possibilities.</em>
        </h3>
        <p className={s.controlLabel}>Total income value over the term</p>
        <div
          className={s.scenarios}
          role="group"
          aria-label="Illustrative total income"
        >
          {SCENARIO_CENTS.map((cents, index) => (
            <button
              key={String(cents)}
              type="button"
              aria-pressed={scenario === index}
              onClick={() => setScenario(index)}
            >
              {fixedHundredths(cents).replace('.00', '')}
              <small>
                {index === 0 ? 'Higher' : index === 1 ? 'Lower' : 'None'}
              </small>
            </button>
          ))}
        </div>
        <p className={s.units}>Hypothetical DemoUSD-equivalent value</p>
        <label className={s.shareLabel} htmlFor="landing-income-share">
          Income share bought
          <output htmlFor="landing-income-share">{share}%</output>
        </label>
        <input
          id="landing-income-share"
          className={s.range}
          type="range"
          min={10}
          max={90}
          step={10}
          value={share}
          onChange={(e) => setShare(Number(e.target.value))}
          style={
            {
              '--range-progress': `${((share - 10) / 80) * 100}%`,
            } as CSSProperties
          }
        />
        <div className={s.rangeEnds}>
          <span>10%</span>
          <span>90%</span>
        </div>
        <div className={s.receipt} aria-live="polite" aria-atomic="true">
          <div className={s.cost}>
            <span>
              Upfront price paid<small>Not refunded at expiry</small>
            </span>
            <strong>
              {fixedHundredths(PURCHASE_CENTS)} <small>DemoUSD</small>
            </strong>
          </div>
          <div className={s.result} data-outcome={outcome}>
            <span>
              Illustrative net result
              <small>
                {outcome === 'even'
                  ? 'Break-even before costs'
                  : outcome === 'positive'
                    ? 'Income value above purchase price'
                    : 'Income value below purchase price'}
              </small>
            </span>
            <div>
              <strong>
                {values.netCents > 0n ? '+' : ''}
                {fixedHundredths(values.netCents)}
              </strong>
              <small>
                {values.returnBps > 0n ? '+' : ''}
                {fixedHundredths(values.returnBps)}%
              </small>
            </div>
          </div>
        </div>
      </div>
      <p className={s.simulatorNote}>
        <Icon name="info" alt="" inheritColor size={16} />
        <span>
          This is a comparison, not a forecast. Actual claims are paid in asset
          tokens. Network fees, conversion costs and token price changes are
          excluded.
        </span>
      </p>
      <noscript>
        <p>
          Enable JavaScript to change scenarios. This static example uses 100
          DemoUSD-equivalent income and a 50% share.
        </p>
      </noscript>
    </div>
  );
}
