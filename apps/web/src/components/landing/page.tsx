import Image from 'next/image';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/icon';
import {
  AskAssistant,
  IncomeCalculator,
  LandingNav,
  LinkAction,
  ProductPreview,
  SectionMotion,
} from './interactions';
import deployment from '../../../../../deployments/sepolia.json';
import s from './landing.module.css';
const repo = 'https://github.com/wildanniam/yieldex-rwa';
const assetNames: Record<string, string> = {
  demoAAPL: 'Apple-linked simulation',
  demoMSFT: 'Microsoft-linked simulation',
  demoSPY: 'S&P 500-linked simulation',
};
function FeatureIcon({ name }: { name: IconName }) {
  return (
    <span className={s.featureIcon}>
      <Icon name={name} alt="" inheritColor />
    </span>
  );
}
function HeroArt() {
  // Retain the intrinsic SVG geometry from the Figma export. Wrappers compose the artwork.
  return (
    <div className={s.heroArt} aria-hidden="true">
      {/* eslint-disable @next/next/no-img-element */}
      <img
        className={s.heroGlow}
        src="/landing/hero-glow.svg"
        width="1840"
        height="1480"
        alt=""
      />
      <div className={s.ethLargeLeft}>
        <img
          src="/landing/ethereum-large-left.svg"
          width="299"
          height="377"
          alt=""
        />
      </div>
      <div className={s.ethLargeRight}>
        <img
          src="/landing/ethereum-large-right.svg"
          width="299"
          height="377"
          alt=""
        />
      </div>
      <div className={s.ethSmallLeft}>
        <img
          src="/landing/ethereum-small-left.svg"
          width="114.981"
          height="165.1"
          alt=""
        />
      </div>
      <div className={s.ethSmallRight}>
        <img
          src="/landing/ethereum-small-right.svg"
          width="114.981"
          height="165.1"
          alt=""
        />
      </div>
      <div className={s.ethUpperLeft}>
        <img
          src="/landing/ethereum-upper-left.svg"
          width="114.981"
          height="165.1"
          alt=""
        />
      </div>
      <div className={s.ethUpperRight}>
        <img
          src="/landing/ethereum-upper-right.svg"
          width="114.981"
          height="165.1"
          alt=""
        />
      </div>
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
export function YieldexLanding() {
  return (
    <div className={s.landing}>
      <div id="top" />
      <SectionMotion />
      <a className={s.skip} href="#main-content">
        Skip to content
      </a>
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <section className={s.hero} aria-labelledby="hero-title">
          <HeroArt />
          <div className={s.heroCopy}>
            <span className={s.networkBadge}>
              <i /> Built on Ethereum <span>·</span> Sepolia demo
            </span>
            <h1 id="hero-title">
              Your shares stay yours.
              <br />
              <span>Your income has options.</span>
            </h1>
            <p>
              Turn future token-stock income into cash today.
              <br className={s.desktopBreak} /> Sell a share of the income for a
              fixed term. Keep the principal.
            </p>
            <div className={s.heroActions}>
              <LinkAction href="/lab">Explore the demo</LinkAction>
              <LinkAction href="#how-it-works" outline>
                See how it works
              </LinkAction>
            </div>
            <p className={s.heroCaption}>
              Time-limited income rights. Onchain, on your terms.
            </p>
          </div>
        </section>
        <div className={s.container}>
          <ProductPreview />
        </div>
        <section
          id="why-yieldex"
          className={`${s.container} ${s.section}`}
          aria-labelledby="why-title"
        >
          <div data-landing-reveal className={s.sectionHeading}>
            <div>
              <span className={s.sectionIndex}>01 / THE IDEA</span>
              <h2 id="why-title">
                Keep what you own.
                <br />
                <span>Choose what you earn.</span>
              </h2>
            </div>
            <p>
              Ownership and income don’t have to move together. Yieldex gives
              each one its own place.
            </p>
          </div>
          <div className={s.bento}>
            <article
              data-landing-reveal
              className={`${s.feature} ${s.principalFeature}`}
            >
              <FeatureIcon name="vault" />
              <h3>
                Sell income.
                <br />
                Keep your principal.
              </h3>
              <p>
                Get paid upfront for a defined share of future income. Your
                underlying token backing stays yours, locked for the term.
              </p>
              <div className={s.ownershipVisual}>
                <div>
                  <span>Alice owns</span>
                  <strong>
                    100 <small>demoAAPL</small>
                  </strong>
                  <span className={s.ownershipBadge}>
                    <Icon name="lock" size={14} alt="" inheritColor /> Principal
                    retained
                  </span>
                </div>
                <div className={s.ownershipDivider} />
                <div>
                  <span>Buyer holds</span>
                  <strong>
                    50<small>% income</small>
                  </strong>
                  <span className={s.mutedPill}>6-month example</span>
                </div>
              </div>
              <span className={s.cardFootnote}>
                A sale of rights. No debt. No principal repayment.
              </span>
            </article>
            <article
              data-landing-reveal
              className={`${s.feature} ${s.listFeature}`}
            >
              <FeatureIcon name="layers" />
              <h3>
                Your terms.
                <br />
                One clear offer.
              </h3>
              <p>
                Choose the backing, income share, price and period. Receive
                payment when a buyer accepts.
              </p>
              <div className={s.lifecycle}>
                <div>
                  <Icon name="vault" alt="" inheritColor />
                  <span>Lock</span>
                </div>
                <i />
                <div>
                  <Icon name="receipt" alt="" inheritColor />
                  <span>List</span>
                </div>
                <i />
                <div>
                  <Icon name="coins" alt="" inheritColor />
                  <span>Get paid</span>
                </div>
              </div>
              <Link href="/lab" className={s.textLink}>
                Create an offer in the demo{' '}
                <Icon name="arrow-up-right" alt="" inheritColor />
              </Link>
            </article>
            <article
              data-landing-reveal
              className={`${s.feature} ${s.resaleFeature}`}
            >
              <div className={s.featureTitle}>
                <h3>
                  A position that
                  <br />
                  can change hands.
                </h3>
                <FeatureIcon name="swap" />
              </div>
              <p>
                Sell the whole position to another buyer while it’s active. The
                original deadline stays. Already-earned claims remain yours.
              </p>
              <div className={s.transferVisual}>
                <div>
                  <span>B</span>
                  <small>Bob</small>
                </div>
                <div>
                  <i />
                  <Icon name="arrow-right" alt="" inheritColor />
                  <i />
                  <small>Whole position</small>
                </div>
                <div>
                  <span>C</span>
                  <small>Carol</small>
                </div>
              </div>
              <span className={s.mutedPill}>
                <Icon name="clock" size={14} alt="" inheritColor /> Same
                deadline. New owner.
              </span>
            </article>
            <article
              id="assistant"
              data-landing-reveal
              className={`${s.feature} ${s.aiFeature}`}
            >
              <div className={s.featureTitle}>
                <h3>
                  A little clarity.
                  <br />
                  Before every decision.
                </h3>
                <FeatureIcon name="sparkles" />
              </div>
              <p>
                Find offers, understand the terms, and compare token quotes. You
                decide. Your wallet confirms.
              </p>
              <div
                className={s.aiExample}
                aria-label="Illustrative assistant question"
              >
                <span>YOU</span>
                <p>“What am I actually buying?”</p>
                <div>
                  <Icon name="sparkles" alt="" inheritColor />
                  <p>
                    A share of future income for a fixed period. The principal
                    stays with the seller.
                  </p>
                </div>
              </div>
              <AskAssistant>Ask Yieldex</AskAssistant>
              <small className={s.aiCaption}>
                Read-only quotes. No automatic swaps.
              </small>
            </article>
            <article
              data-landing-reveal
              className={`${s.feature} ${s.chainFeature}`}
            >
              <div>
                <FeatureIcon name="shield-check" />
                <h3>
                  Recorded onchain.
                  <br />
                  Open to inspect.
                </h3>
                <p>
                  Backing, positions and claims are recorded in smart contracts.
                  Inspect the demo deployment yourself.
                </p>
              </div>
              <a
                href={`https://sepolia.etherscan.io/address/${deployment.market}`}
                target="_blank"
                rel="noreferrer"
                className={s.contractLink}
              >
                <span>
                  <i /> ETHEREUM SEPOLIA
                </span>
                <code>
                  {deployment.market.slice(0, 8)}…{deployment.market.slice(-4)}
                </code>
                <span>
                  View market contract{' '}
                  <Icon name="external-link" alt="" inheritColor size={16} />
                </span>
              </a>
            </article>
          </div>
        </section>
        <section
          id="how-it-works"
          className={`${s.container} ${s.section} ${s.how}`}
          aria-labelledby="how-title"
        >
          <div data-landing-reveal className={s.sectionHeading}>
            <div>
              <span className={s.sectionIndex}>02 / THE FLOW</span>
              <h2 id="how-title">
                From holding an asset
                <br />
                to trading its income.
              </h2>
            </div>
            <p>
              A clear beginning. A fixed term.
              <br />A claim you control.
            </p>
          </div>
          <ol className={s.process}>
            <li>
              <span className={s.stepNumber}>01</span>
              <h3>Lock & list</h3>
              <p>
                Alice backs an offer with 100 demoAAPL. She sets 50% of the
                income, a six-month term and a 90 DemoUSD price.
              </p>
              <span className={s.stepDetail}>
                <Icon name="vault" alt="" inheritColor /> Principal stays with
                Alice
              </span>
            </li>
            <li>
              <span className={s.stepNumber}>02</span>
              <h3>Buy the income rights</h3>
              <p>
                Bob pays the fixed price upfront. The six-month term starts at
                purchase. He receives the income rights, not the backing.
              </p>
              <span className={s.stepDetail}>
                <Icon name="receipt" alt="" inheritColor /> Fixed price. Defined
                period.
              </span>
            </li>
            <li>
              <span className={s.stepNumber}>03</span>
              <h3>Claim your share</h3>
              <p>
                If 1 demoAAPL of income is allocated, Alice and Bob can each
                claim 0.50 demoAAPL. No income means nothing to claim.
              </p>
              <span className={s.stepDetail}>
                <Icon name="coins" alt="" inheritColor /> Income paid in asset
                tokens
              </span>
            </li>
          </ol>
          <div className={s.flowNote}>
            <Icon name="info" alt="" inheritColor />
            <p>
              After the term, future income belongs to Alice. Existing claims
              remain claimable. Backing release waits until event accounting is
              safe.
            </p>
            <span>Illustrative lifecycle</span>
          </div>
        </section>
        <section
          id="calculator"
          className={`${s.container} ${s.section} ${s.mathSection}`}
          aria-labelledby="math-title"
        >
          <div className={s.mathCopy}>
            <span className={s.sectionIndex}>03 / THE NUMBERS</span>
            <h2 id="math-title">
              See the upside.
              <br />
              <span>See the downside.</span>
            </h2>
            <p>
              A fixed purchase price doesn’t mean fixed income. Change the
              scenario to see what that means for a buyer.
            </p>
            <div className={s.mathPrinciple}>
              <span>90</span>
              <div>
                DemoUSD paid upfront<small>Not refunded at expiry</small>
              </div>
            </div>
            <p className={s.finePrint}>
              These are hypothetical terminal values, not asset price quotes.
              Actual income is paid in the underlying token and can be lower or
              zero.
            </p>
          </div>
          <IncomeCalculator />
        </section>
        <section
          id="assets"
          className={`${s.container} ${s.section}`}
          aria-labelledby="assets-title"
        >
          <div data-landing-reveal className={s.sectionHeading}>
            <div>
              <span className={s.sectionIndex}>04 / THE ASSETS</span>
              <h2 id="assets-title">
                Real contracts.
                <br />
                <span>Simulated assets.</span>
              </h2>
            </div>
            <p>
              Start with the three tokens in our Sepolia demo deployment. No
              real shares or real-world backing.
            </p>
          </div>
          <div className={s.assetGrid}>
            {[...deployment.assets]
              .sort((a, b) => a.symbol.localeCompare(b.symbol))
              .map((asset) => (
                <a
                  key={asset.assetId}
                  href={`https://sepolia.etherscan.io/address/${asset.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className={s.assetCard}
                >
                  <div className={s.assetCardTop}>
                    <span className={s.assetLetter}>
                      {asset.symbol.replace('demo', '')[0]}
                    </span>
                    <span>SIMULATED</span>
                    <Icon name="arrow-up-right" alt="" inheritColor />
                  </div>
                  <h3>{asset.symbol}</h3>
                  <p>{assetNames[asset.symbol]}</p>
                  <div>
                    <Icon name="layers" alt="" inheritColor size={16} />
                    <span>In-kind income · Sepolia</span>
                  </div>
                </a>
              ))}
          </div>
        </section>
        <section
          id="risks"
          className={`${s.container} ${s.section} ${s.risks}`}
          aria-labelledby="risk-title"
        >
          <div data-landing-reveal className={s.sectionHeading}>
            <div>
              <span className={s.sectionIndex}>05 / BEFORE YOU START</span>
              <h2 id="risk-title">Risks, stated plainly.</h2>
            </div>
            <p>
              Know what changes hands.
              <br />
              And what never gets promised.
            </p>
          </div>
          <div className={s.riskGrid}>
            <article>
              <Icon name="receipt" alt="" inheritColor />
              <h3>A sale, not a loan.</h3>
              <p>
                The buyer acquires income rights for a fixed term. There is no
                debt or principal repayment.
              </p>
            </article>
            <article>
              <Icon name="alert-triangle" alt="" inheritColor />
              <h3>Income can be zero.</h3>
              <p>
                Dividends aren’t guaranteed. Income may be less than the price
                paid. Expiry does not refund the purchase.
              </p>
            </article>
            <article>
              <Icon name="globe" alt="" inheritColor />
              <h3>A testnet demo.</h3>
              <p>
                All assets and DemoUSD are simulated on Ethereum Sepolia. This
                is not a production investment service.
              </p>
            </article>
          </div>
          <details className={s.riskDetails}>
            <summary>
              What happens if dividend data is delayed?
              <span>
                <Icon name="plus" alt="" inheritColor />
              </span>
            </summary>
            <p>
              The hackathon demo trusts a constrained team finalizer to verify
              income events. Unclear or incomplete data can pause related
              actions and delay backing release. There is no guaranteed
              resolution time, and completed payouts cannot automatically be
              clawed back.
            </p>
          </details>
        </section>
        <section
          className={`${s.container} ${s.finalCta}`}
          aria-labelledby="cta-title"
        >
          <div className={s.ctaMark} aria-hidden="true">
            <Icon name="layers" size={32} alt="" inheritColor />
          </div>
          <h2 id="cta-title">Income, on your terms.</h2>
          <p>Keep the asset. Explore what its income can do.</p>
          <LinkAction href="/lab">Start exploring</LinkAction>
          <span>
            Sepolia testnet · Simulated tokens · Wallet confirmation required
          </span>
        </section>
      </main>
      <footer className={`${s.container} ${s.footer}`}>
        <div className={s.footerMain}>
          <div className={s.footerBrand}>
            <a href="#top" aria-label="Yieldex home">
              <Image
                src="/landing/yieldex-logo.png"
                width={117}
                height={36}
                alt="Yieldex"
              />
            </a>
            <p>
              Trade time-limited income rights.
              <br />
              Keep the asset. Understand the risk.
            </p>
            <span>Built on Ethereum Sepolia.</span>
          </div>
          <div>
            <h3>Product</h3>
            <Link href="/lab">Explore demo</Link>
            <a href="#how-it-works">How it works</a>
            <a href="#calculator">Income scenarios</a>
            <a href="#assistant">AI assistant</a>
          </div>
          <div>
            <h3>Resources</h3>
            <a
              href={`${repo}/blob/main/docs/product.md`}
              target="_blank"
              rel="noreferrer"
            >
              Product docs{' '}
              <Icon name="arrow-up-right" size={14} alt="" inheritColor />
            </a>
            <a
              href={`${repo}/blob/main/docs/hosted-rollout.md`}
              target="_blank"
              rel="noreferrer"
            >
              Demo deployment{' '}
              <Icon name="arrow-up-right" size={14} alt="" inheritColor />
            </a>
            <Link href="/design-system">Design system</Link>
            <a href="#risks">Risks & limitations</a>
          </div>
          <div className={s.footerNetwork}>
            <span>
              <i /> ETHEREUM SEPOLIA
            </span>
            <p>
              Chain 11155111
              <br />
              Payments in DemoUSD
              <br />
              All tokens simulated
            </p>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>© 2026 Yieldex</span>
          <span>Built for Ethereum Jakarta Hackathon 2026</span>
          <Link href="/workspace">
            Team workspace{' '}
            <Icon name="arrow-up-right" size={14} alt="" inheritColor />
          </Link>
        </div>
      </footer>
    </div>
  );
}
