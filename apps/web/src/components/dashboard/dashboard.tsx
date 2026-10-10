'use client';

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
  const [action, setAction] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const example = preview === 'example';
  const known = example || preview === 'empty';

  useEffect(() => {
    if (action) dialog.current?.showModal();
  }, [action]);

  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === '#activity') {
        const details = document.getElementById('activity');
        if (details instanceof HTMLDetailsElement) details.open = true;
      }
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);

  function showAction(label: string) {
    setAction(label);
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
  const explore = (
    <Link href="/marketplace" className={buttonVariants({ size: 'sm' })}>
      Explore offers <Symbol name="arrow-up-right" size={16} />
    </Link>
  );

  return (
    <div className={s.shell}>
      <div className={s.intro}>
        <h1>My Portfolio</h1>
        <span className={s.previewLabel}>UI preview · No wallet connected</span>
      </div>
      <section
        className={s.incomeCard}
        id="claims"
        aria-label="Claimable now"
        aria-busy={preview === 'loading'}
      >
        <span className={s.incomeLabel}>Available to claim</span>
        <strong className={s.incomeAmount}>
          {known ? (example ? '0.50' : '0.00') : '—'} <small>demoAAPL</small>
        </strong>
        <p>
          {example
            ? 'Your allocated income, ready when you are.'
            : known
              ? 'Nothing to claim yet'
              : 'Balance unavailable'}
        </p>
        <div className={s.incomeActions}>
          <Button
            variant="outline"
            leadingIcon="coins"
            disabled={!example}
            onClick={() => showAction('Claim income')}
          >
            Claim income
          </Button>
          <Link href="/sell" className={buttonVariants({ variant: 'outline' })}>
            <Symbol name="plus" size={18} />
            Create listing
          </Link>
        </div>
      </section>
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
        <Panel title="Your portfolio" id="holdings">
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
                  ? 'Find income rights that fit your plans.'
                  : tab === 'listings'
                    ? 'Create an offer to sell a share of future income.'
                    : 'Backing is locked when a primary offer is created.'}
                {tab === 'positions' ? (
                  <span className={s.emptyAction}>{explore}</span>
                ) : (
                  <span className={s.emptyAction}>
                    <Link
                      href="/sell"
                      className={buttonVariants({ size: 'sm' })}
                    >
                      <Symbol name="plus" size={16} />
                      Create first listing
                    </Link>
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
                    <details className={s.positionDisclosure}>
                      <summary>
                        Position details{' '}
                        <Symbol name="chevron-down" size={14} />
                      </summary>
                      <p className={s.finePrint}>
                        Illustrative term at activation: 0 of 6 months. Your
                        retained 50% is not transferable. Backing remains locked
                        until release is safe. Old claims stay yours after
                        resale.
                      </p>
                    </details>
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
                          ['PF-0143', '30%', '3 months', '45'],
                          ['PF-0144', '20%', '6 months', '40'],
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
        <details className={s.activityDisclosure} id="activity">
          <summary>
            Recent activity <Symbol name="chevron-down" size={16} />
          </summary>
          {example ? (
            <>
              <p className={s.caption}>
                Illustrative data · Not live receipts.
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
              title={known ? 'No activity yet' : 'Activity unavailable'}
            >
              {known
                ? 'Your listings, purchases and claims will appear here once confirmed.'
                : 'No activity can be shown in this preview state.'}
            </Empty>
          )}
        </details>
      </div>
      <footer className={s.footer}>
        <span>Simulated assets · Income is not guaranteed.</span>
        <details className={s.previewTools}>
          <summary>Preview settings</summary>
          <label className={s.statePicker}>
            Illustrative data
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
        </details>
      </footer>
      <noscript>
        <p>
          Enable JavaScript to switch preview states and use dashboard controls.{' '}
          <a href="/lab">Open the demo console</a>.
        </p>
      </noscript>
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
