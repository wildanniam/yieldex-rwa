import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import deployment from '../../../../../deployments/sepolia.json';
import s from './footer.module.css';
import { FooterBrand } from './footer-brand';

const repo = 'https://github.com/wildanniam/yieldex-rwa';

export function LandingFooter() {
  return (
    <footer className={s.footer} aria-label="Yieldex footer">
      <div className={s.inner}>
        <div className={s.top}>
          <div className={s.statement}>
            <span className={s.eyebrow}>
              <i /> OWNERSHIP, WITH OPTIONS.
            </span>
            <p>
              Income, on
              <br />
              <em>your terms.</em>
            </p>
            <a
              className={s.network}
              href={`https://sepolia.etherscan.io/address/${deployment.market}`}
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 16 24" aria-hidden="true" fill="none">
                <path d="m8 0 8 13-8 5-8-5Z" fill="currentColor" opacity=".8" />
                <path d="m0 15 8 5 8-5-8 9Z" fill="currentColor" opacity=".4" />
                <path d="M8 0v18l8-5Z" fill="#071611" opacity=".5" />
              </svg>
              Ethereum Sepolia
              <Icon name="arrow-up-right" size={14} alt="" inheritColor />
            </a>
          </div>
          <nav className={s.links} aria-label="Footer product navigation">
            <h2>Explore</h2>
            <Link href="/lab">Enter Yieldex</Link>
            <a href="#how-it-works">How it works</a>
            <a href="#calculator">Income scenarios</a>
            <a href="#assistant">AI assistant</a>
          </nav>
          <nav className={s.links} aria-label="Footer resources">
            <h2>Resources</h2>
            <a
              href={`${repo}/blob/main/docs/product.md`}
              target="_blank"
              rel="noreferrer"
            >
              Product docs
            </a>
            <a
              href={`${repo}/blob/main/docs/hosted-rollout.md`}
              target="_blank"
              rel="noreferrer"
            >
              Onchain deployment
            </a>
            <Link href="/design-system">Design system</Link>
            <a href="#risks">Risks & limitations</a>
          </nav>
        </div>
        <div className={s.signature}>
          <div className={s.signatureLine}>
            <span>THE ASSET STAYS. THE POSSIBILITIES OPEN.</span>
            <a href="#top" className={s.backTop} aria-label="Back to top">
              <span>Back to top</span>
              <span className={s.backArrow} aria-hidden="true">
                ↑
              </span>
            </a>
          </div>
          <FooterBrand />
        </div>
        <div className={s.bottom}>
          <span>© 2026 Yieldex</span>
          <span>Built for Ethereum Jakarta 2026</span>
          <Link href="/workspace">
            Team workspace{' '}
            <Icon name="arrow-up-right" size={13} alt="" inheritColor />
          </Link>
        </div>
        <p className={s.disclosure}>
          Sepolia testnet · Payments in {deployment.paymentToken.symbol} ·
          Simulated assets, no real-world backing.
        </p>
      </div>
    </footer>
  );
}
