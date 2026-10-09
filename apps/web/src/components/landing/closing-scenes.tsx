'use client';

import { useState, type CSSProperties } from 'react';
import { Icon } from '@/components/ui/icon';
import { LinkAction } from './interactions';
import deployment from '../../../../../deployments/sepolia.json';
import s from './closing-scenes.module.css';

const assets = [...deployment.assets].sort((a, b) =>
  a.symbol.localeCompare(b.symbol),
);
const identities: Record<string, { name: string; mark: string; hue: string }> =
  {
    demoAAPL: { name: 'Apple-linked simulation', mark: 'A', hue: '#b3dda8' },
    demoMSFT: {
      name: 'Microsoft-linked simulation',
      mark: 'M',
      hue: '#a6c9df',
    },
    demoSPY: { name: 'S&P 500-linked simulation', mark: '500', hue: '#c5b8e3' },
  };

export function AssetCollection() {
  const [selected, setSelected] = useState(0);
  const asset = assets[selected]!;
  const identity = identities[asset.symbol]!;
  return (
    <div className={s.collection}>
      <div className={s.catalog}>
        <div className={s.catalogHeader}>
          <span>THE DEMO COLLECTION</span>
          <span>03 ASSETS</span>
        </div>
        <div
          className={s.assetChoices}
          role="group"
          aria-label="Explore demo assets"
        >
          {assets.map((item, index) => (
            <div
              key={item.assetId}
              className={s.assetRow}
              data-selected={index === selected}
            >
              <button
                type="button"
                aria-pressed={index === selected}
                aria-controls="selected-asset-details"
                onClick={() => setSelected(index)}
              >
                <span
                  className={s.miniToken}
                  style={
                    {
                      '--token-hue': identities[item.symbol]!.hue,
                    } as CSSProperties
                  }
                >
                  {identities[item.symbol]!.mark}
                </span>
                <span>
                  <strong>{item.symbol}</strong>
                  <small>{identities[item.symbol]!.name}</small>
                </span>
                <span className={s.selectedDot} aria-hidden="true" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${item.token}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Inspect ${item.symbol} contract`}
              >
                <Icon name="arrow-up-right" alt="" inheritColor size={17} />
              </a>
            </div>
          ))}
        </div>
        <div className={s.catalogNote}>
          <Icon name="info" alt="" inheritColor size={16} />
          <p>
            All three are simulated tokens on Sepolia. No real shares or
            real-world backing.
          </p>
        </div>
        <a
          className={s.networkLink}
          href={`https://sepolia.etherscan.io/address/${deployment.registry}`}
          target="_blank"
          rel="noreferrer"
        >
          <span>
            <i /> Ethereum Sepolia
          </span>
          <span>
            Inspect registry{' '}
            <Icon name="arrow-up-right" alt="" inheritColor size={13} />
          </span>
        </a>
      </div>
      <div
        id="selected-asset-details"
        className={s.specimen}
        style={{ '--token-hue': identity.hue } as CSSProperties}
      >
        <div className={s.specimenTop}>
          <span>SIMULATED ASSET / 0{selected + 1}</span>
          <span>NOT A REAL STOCK</span>
        </div>
        <div key={asset.symbol} className={s.tokenScene} aria-hidden="true">
          <div className={s.plinth}>
            <i />
            <i />
            <i />
          </div>
          <div className={s.tokenShadow} />
          <div className={s.tokenDisc}>
            <div className={s.tokenRim}>
              <span className={s.tokenStamp}>YIELDEX · SEPOLIA</span>
              <strong data-wide={identity.mark.length > 1}>
                {identity.mark}
              </strong>
              <span className={s.tokenSerial}>
                SIMULATED / {String(selected + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className={s.tokenTag}>
            <span>IN-KIND INCOME</span>
            <strong>{asset.symbol}</strong>
            <small>Same token as the backing</small>
          </div>
        </div>
        <div
          className={s.assetExplanation}
          aria-live="polite"
          aria-atomic="true"
        >
          <h3>
            {asset.symbol}
            <span>DEMO</span>
          </h3>
          <p>
            Back an offer with {asset.symbol}. Any allocated income is claimed
            in {asset.symbol} too.
          </p>
          <div className={s.assetRoles}>
            <div>
              <span>BUY THE RIGHTS WITH</span>
              <strong>{deployment.paymentToken.symbol}</strong>
            </div>
            <span aria-hidden="true">↗</span>
            <div>
              <span>CLAIM INCOME IN</span>
              <strong>{asset.symbol}</strong>
            </div>
          </div>
          <a
            className={s.contract}
            href={`https://sepolia.etherscan.io/address/${asset.token}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>Token contract</span>
            <code>
              {asset.token.slice(0, 10)}…{asset.token.slice(-6)}
            </code>
            <Icon name="arrow-up-right" alt="" inheritColor size={14} />
          </a>
        </div>
      </div>
      <noscript>
        <p>
          The initial example uses demoAAPL. All three token contracts can be
          inspected with the links in the collection.
        </p>
      </noscript>
    </div>
  );
}

const risks = [
  {
    title: 'What am I actually buying?',
    tag: 'THE RIGHT',
    body: 'The buyer acquires a share of income for a fixed term. The backing remains owned by the seller and locked in the vault. This is a sale, not a loan: there is no debt or principal repayment.',
  },
  {
    title: 'What if there is no income?',
    tag: 'THE DOWNSIDE',
    body: 'Dividends aren’t guaranteed. Income may be lower than the purchase price, or zero. The upfront price is not refunded at expiry. Actual claims are paid in asset tokens, whose value can also change.',
  },
  {
    title: 'Are these real stocks?',
    tag: 'THE DEMO',
    body: 'All assets and DemoUSD are simulated on Ethereum Sepolia. The smart contracts are onchain, but the demo tokens have no real shares or real-world backing. This is not a production investment service.',
  },
  {
    title: 'What happens if dividend data is delayed?',
    tag: 'THE DEPENDENCY',
    body: 'The hackathon demo trusts a constrained team finalizer to verify income events. Unclear or incomplete data can pause related actions and delay backing release. There is no guaranteed resolution time, and completed payouts cannot automatically be clawed back.',
  },
];

export function RiskGuide() {
  return (
    <div className={s.riskLayout}>
      <div className={s.downside}>
        <span className={s.eyebrow}>A POSSIBLE OUTCOME</span>
        <div className={s.emptyScene} aria-hidden="true">
          <div className={s.emptyPlate}>
            <span>0</span>
            <i />
          </div>
          <div className={s.emptyShadow} />
          <span className={s.emptyCaption}>NO INCOME ALLOCATED</span>
        </div>
        <h3>
          A fixed price.
          <br />
          <em>No promised payout.</em>
        </h3>
        <div className={s.downsideNumbers}>
          <div>
            <span>Price paid</span>
            <strong>
              90 <small>DemoUSD</small>
            </strong>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <span>Income value</span>
            <strong>
              0 <small>equivalent</small>
            </strong>
          </div>
        </div>
        <p>
          Illustrative zero-income outcome. The buyer’s full purchase price can
          be lost.
        </p>
        <a href="#calculator">
          Explore the scenarios{' '}
          <Icon name="arrow-up-right" alt="" inheritColor size={16} />
        </a>
      </div>
      <div className={s.riskQuestions}>
        <div className={s.riskHeader}>
          <span>READ BEFORE YOU COMMIT</span>
          <span>04 NOTES</span>
        </div>
        {risks.map((item, index) => (
          <details key={item.title} className={s.question} open={index === 0}>
            <summary>
              <span className={s.questionNumber}>0{index + 1}</span>
              <span>
                <small>{item.tag}</small>
                <strong>{item.title}</strong>
              </span>
              <span className={s.questionToggle}>
                <Icon name="plus" alt="" inheritColor size={18} />
              </span>
            </summary>
            <p>{item.body}</p>
          </details>
        ))}
        <div className={s.riskFootnote}>
          <Icon name="vault" alt="" inheritColor size={16} />
          <span>
            Ownership, income rights and claim timing are separate. Read the
            terms of each offer.
          </span>
        </div>
      </div>
    </div>
  );
}

export function ClosingInvitation() {
  return (
    <div className={s.invitation}>
      <div className={s.invitationCopy}>
        <span className={s.eyebrow}>FROM UNDERSTANDING TO EXPLORING</span>
        <h2 id="cta-title">
          Keep the asset.
          <br />
          <span>Explore the possibilities.</span>
        </h2>
        <p>
          You’ve seen how the pieces fit.
          <br />
          Now try the flow in the Sepolia demo.
        </p>
        <div className={s.invitationActions}>
          <LinkAction href="/lab">Start exploring</LinkAction>
          <a href="#how-it-works">
            Revisit the flow{' '}
            <Icon name="arrow-up-right" alt="" inheritColor size={15} />
          </a>
        </div>
        <small>Simulated tokens · Your wallet confirms transactions</small>
      </div>
      <div className={s.launchScene} aria-hidden="true">
        <div className={s.launchOrbit} />
        <svg className={s.launchPaths} viewBox="0 0 440 400" fill="none">
          <path
            d="M60 320 215 235 385 320M215 235V65"
            stroke="#9bc7a1"
            strokeOpacity=".24"
          />
          <path
            d="m190 116 25-14 25 14-25 14Z"
            stroke="#b5d6b0"
            strokeOpacity=".35"
          />
          <circle cx="60" cy="320" r="4" fill="#94b695" />
          <circle cx="385" cy="320" r="4" fill="#94b695" />
        </svg>
        <div className={s.launchBase} />
        <div className={s.launchGlyph}>
          <i />
          <i />
          <i />
        </div>
        <div className={`${s.launchLabel} ${s.launchBacking}`}>
          <Icon name="vault" alt="" inheritColor size={15} />
          <span>
            THE BACKING<strong>Stays yours.</strong>
          </span>
        </div>
        <div className={`${s.launchLabel} ${s.launchIncome}`}>
          <Icon name="coins" alt="" inheritColor size={15} />
          <span>
            THE INCOME<strong>On your terms.</strong>
          </span>
        </div>
        <div className={s.launchNetwork}>
          <i /> EXPLORE ON SEPOLIA
        </div>
      </div>
    </div>
  );
}
