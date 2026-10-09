import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import deployment from '../../../../../deployments/sepolia.json';
import s from './footer.module.css';

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
            <h2>
              <span>01</span> Explore
            </h2>
            <Link href="/lab">
              Enter Yieldex <span aria-hidden="true">↗</span>
            </Link>
            <a href="#how-it-works">
              How it works <span aria-hidden="true">↗</span>
            </a>
            <a href="#calculator">
              Income scenarios <span aria-hidden="true">↗</span>
            </a>
            <a href="#assistant">
              AI assistant <span aria-hidden="true">↗</span>
            </a>
          </nav>
          <nav className={s.links} aria-label="Footer resources">
            <h2>
              <span>02</span> Discover
            </h2>
            <a
              href={`${repo}/blob/main/docs/product.md`}
              target="_blank"
              rel="noreferrer"
            >
              Product docs <span aria-hidden="true">↗</span>
            </a>
            <a
              href={`${repo}/blob/main/docs/hosted-rollout.md`}
              target="_blank"
              rel="noreferrer"
            >
              Onchain deployment <span aria-hidden="true">↗</span>
            </a>
            <Link href="/design-system">
              Design system <span aria-hidden="true">↗</span>
            </Link>
            <a href="#risks">
              Risks & limitations <span aria-hidden="true">↗</span>
            </a>
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
          <div className={s.wordmark} aria-label="Yieldex">
            Yieldex
          </div>
          <div className={s.horizon} aria-hidden="true" />
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
