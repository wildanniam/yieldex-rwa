'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { useAssistant } from '@/components/ChatbotWrapper';
import s from './dashboard.module.css';

export type DashboardPreview = 'example' | 'empty' | 'loading' | 'error';
type PortfolioTab = 'positions' | 'listings' | 'vault';
const tabs: PortfolioTab[] = ['positions', 'listings', 'vault'];
const tabLabels = {
  positions: 'Positions',
  listings: 'Listings',
  vault: 'Vault',
};
const counts = { positions: '1', listings: '2', vault: '1' };
const activity = [
  [
    'Income allocated',
    '1.00 demoAAPL distributed across income rights.',
    'coins',
  ],
  [
    'Retained income recorded',
    '0.50 demoAAPL remains claimable by the seller.',
    'check-circle',
  ],
  [
    'Buyer income recorded',
    '0.50 demoAAPL belongs to the rights holder.',
    'user',
  ],
] as const;

function Symbol({ name, size = 20 }: { name: IconName; size?: number }) {
  return <Icon name={name} size={size} alt="" inheritColor />;
}
function Panel({
  title,
  extra,
  children,
  className = '',
  id,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
  id?: string;
}) {
  return (
    <section id={id} className={`${s.panel} ${className}`} aria-label={title}>
      <div className={s.panelHeading}>
        <h2>{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
function Empty({
  icon,
  title,
  children,
  action,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Symbol name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

/** Presentation preview only. It neither reads a wallet nor creates financial intents. */
export function PortfolioDashboard({
  initialPreview = 'empty',
}: {
  initialPreview?: DashboardPreview;
}) {
  const [preview, setPreview] = useState<DashboardPreview>(initialPreview);
  const [tab, setTab] = useState<PortfolioTab>('positions');
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState('');
  const menuButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const assistant = useAssistant();
  const example = preview === 'example';
  const known = example || preview === 'empty';

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (action) dialog.current?.showModal();
  }, [action]);

  function showAction(label: string) {
    setAction(label);
  }
  function selectTab(value: PortfolioTab) {
    setTab(value);
    setMenuOpen(false);
  }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target = index;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft')
      target = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[target]!);
    document.getElementById(`portfolio-tab-${tabs[target]}`)?.focus();
  }
  const navAction = (
    label: string,
    icon: IconName,
    onClick: () => void,
    active = false,
  ) => (
    <button
      type="button"
      className={`${s.navItem} ${active ? s.navActive : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => {
        setMenuOpen(false);
        onClick();
      }}
    >
      <Symbol name={icon} />
      {label}
      {active && <span className={s.activeDot} />}
    </button>
  );
  const explore = (
    <Button
      size="sm"
      trailingIcon="arrow-up-right"
      onClick={() => showAction('Explore marketplace')}
    >
      Explore offers
    </Button>
  );

  return (
    <div className={s.shell}>
      <a className={s.skip} href="#portfolio-main">
        Skip to portfolio
      </a>
      <aside
        className={`${s.sidebar} ${menuOpen ? s.sidebarOpen : ''}`}
        id="portfolio-navigation"
      >
        <Link href="/" className={s.brand} aria-label="Yieldex home">
          <Image
            src="/landing/yieldex-logo.png"
            width={611}
            height={188}
            style={{ width: 132, height: 'auto' }}
            alt="Yieldex"
            priority
          />
        </Link>
        <nav aria-label="Application navigation">
          <p className={s.navLabel}>Your workspace</p>
          {navAction(
            'My Portfolio',
            'layers',
            () => {
              document.getElementById('portfolio-main')?.focus();
            },
            true,
          )}
          {navAction('Marketplace', 'tag', () =>
            showAction('Explore marketplace'),
          )}
          {navAction('Create listing', 'plus', () =>
            showAction('Create listing'),
          )}
          <p className={s.navLabel}>Manage</p>
          {navAction('Positions', 'vault', () => {
            selectTab('positions');
            document
              .getElementById('holdings')
              ?.scrollIntoView({ block: 'start' });
          })}
          {navAction('My listings', 'receipt', () => {
            selectTab('listings');
            document
              .getElementById('holdings')
              ?.scrollIntoView({ block: 'start' });
          })}
          <a
            className={s.navItem}
            href="#claims"
            onClick={() => setMenuOpen(false)}
          >
            <Symbol name="coins" />
            Claims
          </a>
          <p className={s.navLabel}>Tools</p>
          {navAction('AI Assistant', 'sparkles', () => {
            if (!assistant.busy) assistant.open();
          })}
          <a
            className={s.navItem}
            href="#activity"
            onClick={() => setMenuOpen(false)}
          >
            <Symbol name="history" />
            Activity
          </a>
          <Link className={s.navItem} href="/lab">
            <Symbol name="globe" />
            Demo console
            <Symbol name="arrow-up-right" size={16} />
          </Link>
        </nav>
        <div className={s.sidebarFoot}>
          <span className={s.networkDot} />
          <span>
            Ethereum Sepolia<small>Test network · 11155111</small>
          </span>
          <Symbol name="shield-check" size={18} />
        </div>
      </aside>
      <div className={s.workspace}>
        <header className={s.header}>
          <button
            ref={menuButton}
            className={s.menuToggle}
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="portfolio-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Symbol name={menuOpen ? 'x' : 'layers'} />
          </button>
          <div className={s.headerTitle}>
            Dashboard<span> / My Portfolio</span>
          </div>
          <div className={s.headerActions}>
            <span className={s.networkLabel}>
              <i />
              Sepolia demo
            </span>
            <Button
              variant="accent"
              size="sm"
              leadingIcon="wallet"
              onClick={() => showAction('Connect wallet')}
            >
              Connect wallet
            </Button>
          </div>
        </header>
        <main id="portfolio-main" tabIndex={-1} className={s.main}>
          <div className={s.intro}>
            <div>
              <p className={s.eyebrow}>YOUR INCOME, AT A GLANCE</p>
              <h1>
                My Portfolio<span>.</span>
              </h1>
              <p>Your positions, your backing. All in one place.</p>
            </div>
            <Button
              leadingIcon="plus"
              onClick={() => showAction('Create listing')}
            >
              Create listing
            </Button>
          </div>
          <div className={s.previewBar}>
            <div>
              <span className={s.previewDot} />
              <strong>Design preview</strong>
              <span className={s.previewExplanation}>
                Illustrative data · No wallet connected
              </span>
            </div>
            <label className={s.statePicker}>
              View state
              <select
                aria-label="Preview state"
                value={preview}
                onChange={(e) => setPreview(e.target.value as DashboardPreview)}
              >
                <option value="example">Example portfolio</option>
                <option value="empty">Empty portfolio</option>
                <option value="loading">Loading</option>
                <option value="error">Error</option>
              </select>
            </label>
          </div>
          <div className={s.metrics} aria-busy={preview === 'loading'}>
            <section
              className={`${s.metric} ${s.claimMetric}`}
              aria-label="Claimable now"
            >
              <div className={s.metricTop}>
                <span>Claimable now</span>
                <Symbol name="coins" />
              </div>
              <strong>
                {known ? (example ? '0.50' : '0.00') : '—'}
                <small>demoAAPL</small>
              </strong>
              <div className={s.metricBottom}>
                <span>
                  {known ? 'Paid in tokens, not cash' : 'Balance unavailable'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!example}
                  onClick={() => showAction('Claim income')}
                >
                  Claim
                  <Symbol name="arrow-up-right" size={14} />
                </Button>
              </div>
            </section>
            <section className={s.metric} aria-label="Active positions">
              <div className={s.metricTop}>
                <span>Active positions</span>
                <Symbol name="layers" />
              </div>
              <strong>{known ? (example ? '1' : '0') : '—'}</strong>
              <div className={s.metricBottom}>
                <span>
                  {example
                    ? 'Retained income overview'
                    : known
                      ? 'No income rights yet'
                      : 'Waiting for portfolio data'}
                </span>
              </div>
            </section>
            <section className={s.metric} aria-label="Active listings">
              <div className={s.metricTop}>
                <span>Active listings</span>
                <Symbol name="tag" />
              </div>
              <strong>{known ? (example ? '2' : '0') : '—'}</strong>
              <div className={s.metricBottom}>
                <span>
                  {example
                    ? 'Illustrative primary offers'
                    : known
                      ? 'No offers published'
                      : 'Waiting for portfolio data'}
                </span>
              </div>
            </section>
            <section className={s.metric} aria-label="Locked backing">
              <div className={s.metricTop}>
                <span>Locked backing</span>
                <Symbol name="lock" />
              </div>
              <strong>
                {known ? (example ? '100' : '0') : '—'}
                <small>demoAAPL</small>
              </strong>
              <div className={s.metricBottom}>
                <span>Principal remains yours</span>
                <span className={s.miniIcon}>
                  <Symbol name="shield-check" size={16} />
                </span>
              </div>
            </section>
          </div>
          {preview === 'error' && (
            <div className={s.error} role="alert">
              <Symbol name="alert-triangle" />
              <div>
                <strong>Portfolio could not be loaded</strong>
                <p>Error-state preview. Your assets are not affected.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                leadingIcon="refresh"
                onClick={() => setPreview('example')}
              >
                Retry preview
              </Button>
            </div>
          )}
          <div className={s.grid}>
            <Panel
              title="Positions and listings"
              id="holdings"
              extra={
                <span className={s.caption}>
                  {example ? 'Example account' : 'Portfolio overview'}
                </span>
              }
            >
              <div
                role="tablist"
                aria-label="Portfolio holdings"
                className={s.tabs}
              >
                {tabs.map((value, i) => (
                  <button
                    key={value}
                    type="button"
                    id={`portfolio-tab-${value}`}
                    role="tab"
                    aria-selected={tab === value}
                    aria-controls="portfolio-panel"
                    tabIndex={tab === value ? 0 : -1}
                    onKeyDown={(e) => tabKey(e, i)}
                    onClick={() => setTab(value)}
                  >
                    {tabLabels[value]}
                    <span>{known ? (example ? counts[value] : '0') : '—'}</span>
                  </button>
                ))}
              </div>
              <div
                className={s.tabPanel}
                id="portfolio-panel"
                role="tabpanel"
                tabIndex={0}
                aria-labelledby={`portfolio-tab-${tab}`}
              >
                {!known ? (
                  preview === 'loading' ? (
                    <div className={s.skeleton} role="status">
                      <span>Loading portfolio preview…</span>
                      <i />
                      <i />
                      <i />
                    </div>
                  ) : (
                    <Empty icon="refresh" title="Your portfolio is unavailable">
                      Use Retry preview above to restore the example.
                    </Empty>
                  )
                ) : !example ? (
                  <Empty
                    icon={
                      tab === 'vault'
                        ? 'vault'
                        : tab === 'listings'
                          ? 'tag'
                          : 'layers'
                    }
                    title={
                      tab === 'vault' ? 'No backing deposited' : `No ${tab} yet`
                    }
                  >
                    {tab === 'positions'
                      ? 'Explore time-limited income rights. Review the share, term and risks before buying.'
                      : tab === 'listings'
                        ? 'Offer a share of future income while keeping ownership of your backing.'
                        : 'Backing is locked when a primary offer is created.'}
                    {tab === 'positions' ? (
                      <span className={s.emptyAction}>{explore}</span>
                    ) : (
                      <span className={s.emptyAction}>
                        <Button
                          size="sm"
                          leadingIcon="plus"
                          onClick={() => showAction('Create listing')}
                        >
                          Create first listing
                        </Button>
                      </span>
                    )}
                  </Empty>
                ) : (
                  <>
                    {tab === 'positions' && (
                      <>
                        <div className={s.positionHeading}>
                          <span className={s.token}>A</span>
                          <div>
                            <strong>Apple income rights</strong>
                            <small>Retained share · Example L-0142</small>
                          </div>
                          <span className={s.status}>Active example</span>
                        </div>
                        <div className={s.positionDetails}>
                          <div>
                            <span>Asset</span>
                            <strong>demoAAPL</strong>
                          </div>
                          <div>
                            <span>Your income share</span>
                            <strong>50%</strong>
                          </div>
                          <div>
                            <span>Original term</span>
                            <strong>6 months</strong>
                          </div>
                        </div>
                        <div className={s.term}>
                          <span>Illustrative term at activation</span>
                          <strong>0 of 6 months</strong>
                        </div>
                        <div className={s.progress} aria-hidden="true">
                          <span />
                        </div>
                        <p className={s.finePrint}>
                          Your retained 50% is not transferable. The buyer holds
                          the other income right; your backing remains locked
                          until release is safe.
                        </p>
                      </>
                    )}
                    {tab === 'listings' && (
                      <div className={s.tableScroll}>
                        <table>
                          <caption className={s.srOnly}>
                            Illustrative primary listings
                          </caption>
                          <thead>
                            <tr>
                              <th>Offer</th>
                              <th>Share</th>
                              <th>Term</th>
                              <th>Fixed price</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ['L-0143', '30%', '3 months', '45'],
                              ['L-0144', '20%', '6 months', '40'],
                            ].map(([id, share, term, price]) => (
                              <tr key={id}>
                                <td>
                                  <strong>{id}</strong>
                                  <small>demoAAPL · Example</small>
                                </td>
                                <td>{share}</td>
                                <td>{term}</td>
                                <td>
                                  {price}
                                  <small>DemoUSD</small>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className={s.textAction}
                                    onClick={() =>
                                      showAction(`Review example ${id}`)
                                    }
                                  >
                                    Review
                                    <Symbol name="arrow-up-right" size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className={s.finePrint}>
                          Separate illustrative offers. Terms begin at purchase;
                          prices are paid upfront.
                        </p>
                      </div>
                    )}
                    {tab === 'vault' && (
                      <>
                        <div className={s.positionHeading}>
                          <span className={s.token}>A</span>
                          <div>
                            <strong>Apple backing</strong>
                            <small>demoAAPL · Example vault</small>
                          </div>
                          <span className={s.status}>Locked example</span>
                        </div>
                        <div className={s.positionDetails}>
                          <div>
                            <span>Locked tokens</span>
                            <strong>100 demoAAPL</strong>
                          </div>
                          <div>
                            <span>Ownership</span>
                            <strong>Retained</strong>
                          </div>
                        </div>
                        <div className={s.note}>
                          <Symbol name="lock" />
                          <span>
                            Release requires maturity and verified income
                            accounting. A finished timer alone does not unlock
                            backing.
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </Panel>
            <Panel
              title="Claimable balances"
              id="claims"
              extra={<Symbol name="coins" />}
            >
              {example ? (
                <>
                  <div className={s.balances}>
                    {[
                      ['A', 'demoAAPL', '0.50'],
                      ['M', 'demoMSFT', '0.00'],
                      ['S', 'demoSPY', '0.00'],
                    ].map(([letter, symbol, amount]) => (
                      <div className={s.balance} key={symbol}>
                        <span className={`${s.token} ${s.smallToken}`}>
                          {letter}
                        </span>
                        <div>
                          <strong>{symbol}</strong>
                          <small>Simulated token</small>
                        </div>
                        <strong
                          className={amount === '0.50' ? s.positive : s.muted}
                        >
                          {amount}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <Button
                    className={s.fullButton}
                    onClick={() => showAction('Claim income')}
                    trailingIcon="arrow-right"
                  >
                    Review claim
                  </Button>
                </>
              ) : (
                <Empty
                  icon="coins"
                  title={known ? 'Nothing to claim yet' : 'Balance unavailable'}
                >
                  {known
                    ? 'Income appears here after an allocation event.'
                    : 'Claimable amounts will appear when data is available.'}
                </Empty>
              )}
              <div className={s.note}>
                <Symbol name="info" size={18} />
                <span>Old claims stay yours after you resell.</span>
              </div>
            </Panel>
            <Panel
              title="Recent activity"
              id="activity"
              extra={<span className={s.exampleBadge}>Illustration</span>}
            >
              {example ? (
                <>
                  <p className={s.caption}>
                    One income allocation, three views. Not live receipts.
                  </p>
                  <ol className={s.activity}>
                    {activity.map(([title, description, icon], i) => (
                      <li key={title}>
                        <span className={s.activityIcon}>
                          <Symbol name={icon} />
                        </span>
                        <div>
                          <strong>{title}</strong>
                          <p>{description}</p>
                        </div>
                        <span className={s.activityStep}>0{i + 1}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <Empty
                  icon="history"
                  title={
                    known ? 'Your story starts here' : 'Activity unavailable'
                  }
                >
                  {known
                    ? 'Your listings, purchases and claims will appear here once confirmed.'
                    : 'No activity can be shown in this preview state.'}
                </Empty>
              )}
            </Panel>
            <Panel
              title="Ask Yieldex AI"
              className={s.aiPanel}
              extra={
                <span className={s.aiSymbol}>
                  <Symbol name="sparkles" />
                </span>
              }
            >
              <p className={s.aiCopy}>
                A little clarity.
                <br />
                <span>Before your next move.</span>
              </p>
              <p className={s.caption}>
                Understand offers, income rights and risks.
              </p>
              <div className={s.suggestions}>
                {[
                  'How do income rights work?',
                  'What happens after resale?',
                ].map((question) => (
                  <button
                    type="button"
                    key={question}
                    disabled={assistant.busy}
                    onClick={assistant.open}
                  >
                    {question}
                    <Symbol name="arrow-up-right" size={16} />
                  </button>
                ))}
              </div>
              <Button
                variant="accent"
                className={s.fullButton}
                leadingIcon="sparkles"
                isLoading={assistant.busy}
                onClick={assistant.open}
              >
                Open assistant
              </Button>
              <small className={s.finePrint}>
                Opens chat; example holdings are not sent as your data.
              </small>
            </Panel>
          </div>
          <footer className={s.disclosure}>
            <Symbol name="shield-check" />
            <p>
              <strong>Built for the demo. Clear about the limits.</strong>
              <span>
                Sepolia testnet · Simulated assets · Income is not guaranteed.
              </span>
            </p>
            <Link href="/lab">
              Open demo console
              <Symbol name="arrow-up-right" size={16} />
            </Link>
          </footer>
          <noscript>
            <p>
              Enable JavaScript to switch preview states and use dashboard
              controls. <a href="/lab">Open the demo console</a>.
            </p>
          </noscript>
        </main>
      </div>
      <dialog
        ref={dialog}
        onClose={() => setAction('')}
        className={s.dialog}
        aria-labelledby="dashboard-action-title"
        aria-describedby="dashboard-action-description"
      >
        <div className={s.dialogHeading}>
          <span className={s.dialogIcon}>
            <Symbol
              name={action === 'Connect wallet' ? 'wallet' : 'info'}
              size={24}
            />
          </span>
          <button
            type="button"
            aria-label="Close action details"
            className={s.close}
            onClick={() => dialog.current?.close()}
          >
            <Symbol name="x" />
          </button>
        </div>
        <p className={s.eyebrow}>DESIGN PREVIEW</p>
        <h2 id="dashboard-action-title">{action}</h2>
        <p id="dashboard-action-description">
          This dashboard uses illustrative data. No wallet is connected here and
          no transaction will be sent. Use the demo console for the existing
          wallet and transaction flow.
        </p>
        <div className={s.dialogActions}>
          <Button variant="outline" onClick={() => dialog.current?.close()}>
            Back to preview
          </Button>
          <Link href="/lab" className={buttonVariants({ variant: 'accent' })}>
            Open demo console
            <Symbol name="arrow-up-right" size={16} />
          </Link>
        </div>
      </dialog>
    </div>
  );
}
