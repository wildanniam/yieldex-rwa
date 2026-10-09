import {
  AssetCollection,
  RiskGuide,
  ClosingInvitation,
} from './closing-scenes';
import { FlowStory, IncomeCalculator } from './interactive-scenes';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import {
  LandingNav,
  LinkAction,
  ProductPreview,
  SectionMotion,
} from './interactions';
import s from './landing.module.css';
import { HeroMotion } from './hero-motion';
import { ConceptCards } from './concept-cards';
const repo = 'https://github.com/wildanniam/yieldex-rwa';
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
        <div data-eth-pointer>
          <div data-eth-float>
            <img
              src="/landing/ethereum-large-left.svg"
              width="299"
              height="377"
              alt=""
            />
          </div>
        </div>
      </div>
      <div className={s.ethLargeRight}>
        <div data-eth-pointer>
          <div data-eth-float>
            <img
              src="/landing/ethereum-large-right.svg"
              width="299"
              height="377"
              alt=""
            />
          </div>
        </div>
      </div>
      <div className={s.ethSmallLeft}>
        <div data-eth-pointer>
          <div data-eth-float>
            <img
              src="/landing/ethereum-small-left.svg"
              width="114.981"
              height="165.1"
              alt=""
            />
          </div>
        </div>
      </div>
      <div className={s.ethSmallRight}>
        <div data-eth-pointer>
          <div data-eth-float>
            <img
              src="/landing/ethereum-small-right.svg"
              width="114.981"
              height="165.1"
              alt=""
            />
          </div>
        </div>
      </div>
      <div className={s.ethUpperLeft}>
        <div data-eth-pointer>
          <div data-eth-float>
            <img
              src="/landing/ethereum-upper-left.svg"
              width="114.981"
              height="165.1"
              alt=""
            />
          </div>
        </div>
      </div>
      <div className={s.ethUpperRight}>
        <div data-eth-pointer>
          <div data-eth-float>
            <img
              src="/landing/ethereum-upper-right.svg"
              width="114.981"
              height="165.1"
              alt=""
            />
          </div>
        </div>
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
        <HeroMotion>
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
        </HeroMotion>
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
          <ConceptCards />
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
          <FlowStory />
        </section>
        <section
          id="calculator"
          className={`${s.container} ${s.section}`}
          aria-labelledby="math-title"
        >
          <div data-landing-reveal className={s.sectionHeading}>
            <div>
              <span className={s.sectionIndex}>03 / THE NUMBERS</span>
              <h2 id="math-title">
                The price is fixed.
                <br />
                <span>The income isn’t.</span>
              </h2>
            </div>
            <p>
              Move the share. Change the income.
              <br />
              See what each person keeps.
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
          <AssetCollection />
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
          <RiskGuide />
        </section>
        <section
          className={`${s.container} ${s.finalCta}`}
          aria-labelledby="cta-title"
        >
          <ClosingInvitation />
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
