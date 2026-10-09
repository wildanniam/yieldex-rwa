'use client';

import { useState, type CSSProperties } from 'react';
import { Icon } from '@/components/ui/icon';
import { LinkAction } from './interactions';
import { AssetMark } from './asset-mark';
import { OutcomeArtwork, YieldexSculpture } from './closing-artwork';
import deployment from '../../../../../deployments/sepolia.json';
import s from './closing-scenes.module.css';

const assets = [...deployment.assets].sort((a, b) =>
  a.symbol.localeCompare(b.symbol),
);
const identities: Record<
  string,
  { name: string; ticker: string; hue: string }
> = {
  demoAAPL: { name: 'Apple', ticker: 'AAPL', hue: '#d5e3dc' },
  demoMSFT: {
    name: 'Microsoft',
    ticker: 'MSFT',
    hue: '#a6c9df',
  },
  demoSPY: { name: 'S&P 500', ticker: 'SPY', hue: '#c5b8e3' },
};

export function AssetCollection() {
  const [selected, setSelected] = useState(0);
  const asset = assets[selected]!;
  const identity = identities[asset.symbol]!;
  return (
    <div className={s.collection}>
      <div className={s.catalog}>
        <div className={s.catalogHeader}>
          <span>THE ASSET COLLECTION</span>
          <span>03 ASSETS</span>
        </div>
        <div
          className={s.assetChoices}
          role="group"
          aria-label="Explore assets"
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
                  <AssetMark symbol={item.symbol} />
                </span>
                <span>
                  <strong>{identities[item.symbol]!.name}</strong>
                  <small>
                    {identities[item.symbol]!.ticker} · Equity reference
                  </small>
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
          <span>ASSET COLLECTION / 0{selected + 1}</span>
          <span>EQUITY REFERENCE</span>
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
              <span className={s.tokenStamp}>YIELDEX · INCOME RIGHTS</span>
              <strong className={s.brandMark}>
                <AssetMark symbol={asset.symbol} />
              </strong>
              <span className={s.tokenSerial}>
                {identity.ticker} / {String(selected + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className={s.tokenTag}>
            <span>IN-KIND INCOME</span>
            <strong>{identity.ticker}</strong>
            <small>Same token as the backing</small>
          </div>
        </div>
        <div
          className={s.assetExplanation}
          aria-live="polite"
          aria-atomic="true"
        >
          <h3>
            {identity.name}
            <span>{identity.ticker}</span>
          </h3>
          <p>
            Keep your backing. Trade a share of its income. Allocated income is
            claimed in the same asset token.
          </p>
          <div className={s.assetRoles}>
            <div>
              <span>BUY THE RIGHTS WITH</span>
              <strong>{deployment.paymentToken.symbol}</strong>
            </div>
            <span aria-hidden="true">↗</span>
            <div>
              <span>CLAIM INCOME IN</span>
              <strong>{identity.ticker}</strong>
            </div>
          </div>
          <a
            className={s.contract}
            href={`https://sepolia.etherscan.io/address/${asset.token}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>{asset.symbol} · Sepolia contract</span>
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
    tag: 'THE NETWORK',
    body: 'All assets and DemoUSD are simulated on Ethereum Sepolia. The smart contracts are onchain, but the demo tokens have no real shares or real-world backing. This is not a production investment service.',
  },
  {
    title: 'What happens if dividend data is delayed?',
    tag: 'THE DEPENDENCY',
    body: 'The Sepolia deployment trusts a constrained team finalizer to verify income events. Unclear or incomplete data can pause related actions and delay backing release. There is no guaranteed resolution time, and completed payouts cannot automatically be clawed back.',
  },
];

export function RiskGuide() {
  return (
    <div className={s.riskLayout}>
      <div className={s.downside}>
        <span className={s.eyebrow}>A POSSIBLE OUTCOME</span>
        <div className={s.emptyScene} aria-hidden="true">
          <OutcomeArtwork />
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
          Put your assets to work. On your terms.
        </p>
        <div className={s.invitationActions}>
          <LinkAction href="/lab">Start exploring</LinkAction>
          <a href="#how-it-works">
            Revisit the flow{' '}
            <Icon name="arrow-up-right" alt="" inheritColor size={15} />
          </a>
        </div>
        <small>Your assets. Your decisions. Your wallet confirms.</small>
      </div>
      <div className={s.launchScene} aria-hidden="true">
        <YieldexSculpture />
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
