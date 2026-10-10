'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
  PositionResponse,
  ListingResponse,
  PrepareIntentRequest,
} from '@rwa/shared';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { usePlatform } from './platform-provider';
import { useAssets } from './use-portfolio';
import { useRead } from './use-read';
import {
  amount,
  company,
  listingHref,
  positionActions,
  positiveAtomic,
  shortAddress,
} from './data';
import { TransactionPanel, WalletActivity } from './transaction-panel';
import s from './live.module.css';

export function PositionDetail({ positionKey }: { positionKey: string }) {
  const { manifest: m, access, positions, listings, revision } = usePlatform();
  const read = useRead<PositionResponse>(
    `/chains/${m.chainId}/markets/${m.market}/positions/${positionKey.split(':').at(-1)}`,
    'api.PositionResponse',
    revision,
  );
  const assets = useAssets();
  const overlay = positions.find((p) => p.positionKey === positionKey),
    indexed = read.data?.data;
  const p =
    overlay &&
    (!indexed ||
      BigInt(overlay.snapshot.blockNumber) >
        BigInt(indexed.snapshot.blockNumber))
      ? overlay
      : indexed;
  const currentListingKey =
    p && p.currentListingId !== '0'
      ? `eip155:${m.chainId}:${m.market}:${p.currentListingId}`
      : null;
  const currentListing = useRead<ListingResponse>(
    currentListingKey
      ? `/chains/${m.chainId}/markets/${m.market}/listings/${p!.currentListingId}`
      : null,
    'api.ListingResponse',
    revision,
  );
  const receiptListing = listings.find(
    (l) => l.listing.listingKey === currentListingKey,
  )?.listing;
  const indexedListing = currentListing.data?.data.listing;
  const listing =
    receiptListing &&
    (!indexedListing ||
      BigInt(receiptListing.snapshot.blockNumber) >
        BigInt(indexedListing.snapshot.blockNumber))
      ? receiptListing
      : indexedListing;
  const asset = assets.data?.items.find((a) => a.assetKey === p?.assetKey);
  const [request, setRequest] = useState<PrepareIntentRequest | null>(null);
  const [sale, setSale] = useState(false),
    [price, setPrice] = useState('');
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  const actions = p
    ? positionActions(
        p,
        access.identity.wallet,
        now || p.snapshot.blockTimestamp,
        listing,
      )
    : null;
  function choose(
    action: 'CHECKPOINT_POSITION' | 'SETTLE_POSITION' | 'RELEASE_PRINCIPAL',
  ) {
    setSale(false);
    setRequest({ action, positionKey, maxEvents: 32 });
  }
  return (
    <div className={s.page}>
      <Link href="/dashboard" className={s.back}>
        ← My portfolio
      </Link>
      {!p ? (
        <section className={s.offer}>
          <h1>{read.loading ? 'Loading position…' : 'Position unavailable'}</h1>
          {read.error && <p role="alert">{read.error}</p>}
          <Button
            variant="outline"
            disabled={read.loading}
            onClick={read.refresh}
          >
            Refresh
          </Button>
        </section>
      ) : (
        <>
          <header className={s.heading}>
            <p className={s.eyebrow}>POSITION #{p.positionId}</p>
            <h1>
              {asset ? company(asset.token.symbol) : 'Your'} income position.
            </h1>
            <p>Backing ownership and income rights are tracked separately.</p>
          </header>
          <section className={s.offer}>
            <Button
              size="sm"
              variant="ghost"
              disabled={read.loading}
              onClick={() => {
                read.refresh();
                assets.refresh();
                currentListing.refresh();
              }}
            >
              Refresh position
            </Button>
            <div className={s.offerTop}>
              <h2>{asset?.token.symbol ?? 'Asset'}</h2>
              <span className={s.badge}>{p.displayState.toLowerCase()}</span>
            </div>
            <dl className={s.facts}>
              <div>
                <dt>Principal owner</dt>
                <dd>
                  {shortAddress(p.principalOwner)}
                  {p.principalOwner === access.identity.wallet ? ' (you)' : ''}
                </dd>
              </div>
              <div>
                <dt>Income rights holder</dt>
                <dd>
                  {p.rightsOwner
                    ? `${shortAddress(p.rightsOwner)}${p.rightsOwner === access.identity.wallet ? ' (you)' : ''}`
                    : 'Not purchased yet'}
                </dd>
              </div>
              <div>
                <dt>Recorded backing</dt>
                <dd>
                  {asset
                    ? amount(p.principalTokenAmountAtomic, asset.token.decimals)
                    : 'Unavailable'}{' '}
                  {asset?.token.symbol}
                </dd>
              </div>
              <div>
                <dt>Buyer’s income share</dt>
                <dd>{p.incomeBps / 100}%</dd>
              </div>
              <div>
                <dt>Rights expiry</dt>
                <dd>
                  {p.endAt
                    ? new Date(p.endAt * 1000).toLocaleString()
                    : 'Term starts at purchase'}
                </dd>
              </div>
              <div>
                <dt>Snapshot</dt>
                <dd>
                  #{p.snapshot.blockNumber} ·{' '}
                  {p.snapshot.finality.toLowerCase()}
                </dd>
              </div>
            </dl>
            <p className={s.muted}>
              Previously allocated claims stay with their recipient after
              resale. Selling the rights keeps the original expiry. Backing
              release can wait for verified event coverage.
            </p>
            {currentListingKey && (
              <Link className={s.back} href={listingHref(currentListingKey)}>
                View current offer →
              </Link>
            )}
          </section>
          {(read.error || assets.error) && (
            <p role="alert" className={s.notice}>
              {read.error || assets.error}{' '}
              <button
                onClick={() => {
                  read.refresh();
                  assets.refresh();
                  currentListing.refresh();
                }}
              >
                Retry
              </button>
            </p>
          )}
          {!access.identity.wallet ? (
            <Link className={s.back} href="/wallet">
              Connect wallet to manage your position →
            </Link>
          ) : (
            <section className={s.review} aria-label="Manage position">
              <h2>Your actions</h2>
              <div className={s.actions}>
                {actions?.resale && (
                  <Button
                    onClick={() => {
                      setRequest(null);
                      setSale(true);
                    }}
                  >
                    Sell income rights
                  </Button>
                )}
                {actions?.relist && (
                  <Button
                    onClick={() => {
                      setRequest(null);
                      setSale(true);
                    }}
                  >
                    Relist backing
                  </Button>
                )}
                {actions?.cancel && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSale(false);
                      setRequest({
                        action: 'CANCEL_LISTING',
                        listingKey: currentListingKey!,
                      });
                    }}
                  >
                    Cancel offer
                  </Button>
                )}
                {actions?.checkpoint && (
                  <Button
                    variant="outline"
                    onClick={() => choose('CHECKPOINT_POSITION')}
                  >
                    Process income
                  </Button>
                )}
                {actions?.settle && (
                  <Button
                    variant="outline"
                    onClick={() => choose('SETTLE_POSITION')}
                  >
                    Settle position
                  </Button>
                )}
                {actions?.release && (
                  <Button
                    variant="outline"
                    onClick={() => choose('RELEASE_PRINCIPAL')}
                  >
                    Release backing
                  </Button>
                )}
              </div>
              <p className={s.muted}>
                {p.storedState === 'RELEASED'
                  ? 'Backing has been released. Any remaining claims are still available in your portfolio.'
                  : 'Each action is reviewed against current contract state before you can confirm.'}
              </p>
            </section>
          )}
          {sale && (actions?.resale || actions?.relist) && (
            <section className={s.review}>
              <h2>
                {actions.resale
                  ? 'Sell the whole income position'
                  : 'Reopen your primary offer'}
              </h2>
              <p className={s.muted}>
                {actions.resale
                  ? 'The original expiry stays. Claims already earned remain yours.'
                  : 'Your backing is already locked. No additional deposit is needed.'}
              </p>
              <div className={s.fields}>
                <TextInput
                  label={`Fixed price (${m.paymentToken.symbol})`}
                  value={price}
                  inputMode="decimal"
                  onChange={(e) => setPrice(e.target.value)}
                  error={
                    price && !positiveAtomic(price, m.paymentToken.decimals)
                      ? 'Enter an exact positive amount.'
                      : ''
                  }
                />
              </div>
              {positiveAtomic(price, m.paymentToken.decimals) && (
                <TransactionPanel
                  key={`${positionKey}:${price}:${access.identity.wallet}`}
                  label={
                    actions.resale ? 'List rights for resale' : 'Relist backing'
                  }
                  buildRequest={async () => {
                    if (!access.wallet)
                      throw new Error('Connect your wallet first.');
                    const snapshot =
                      await access.wallet.reader.snapshot('latest');
                    return {
                      action: actions.resale
                        ? 'CREATE_SECONDARY_LISTING'
                        : 'RELIST_PRIMARY_POSITION',
                      positionKey,
                      priceAtomic: positiveAtomic(
                        price,
                        m.paymentToken.decimals,
                      )!,
                      listingExpiresAt: Math.min(
                        snapshot.blockTimestamp + 7 * 86400,
                        p.endAt ?? Number.MAX_SAFE_INTEGER,
                      ),
                    };
                  }}
                />
              )}
            </section>
          )}
          {request &&
            actions &&
            ((request.action === 'CANCEL_LISTING' && actions.cancel) ||
              (request.action === 'CHECKPOINT_POSITION' &&
                actions.checkpoint) ||
              (request.action === 'SETTLE_POSITION' && actions.settle) ||
              (request.action === 'RELEASE_PRINCIPAL' && actions.release)) && (
              <TransactionPanel
                key={`${JSON.stringify(request)}:${access.identity.wallet}`}
                request={request}
                label={
                  request.action === 'CANCEL_LISTING'
                    ? 'Cancel listing'
                    : request.action === 'RELEASE_PRINCIPAL'
                      ? 'Release backing'
                      : request.action === 'SETTLE_POSITION'
                        ? 'Settle position'
                        : 'Process income'
                }
              >
                <p className={s.muted}>
                  {request.action === 'CANCEL_LISTING'
                    ? 'Cancelling stops the sale. Withdrawing backing is a separate step, after accounting is safe.'
                    : request.action === 'RELEASE_PRINCIPAL'
                      ? 'Backing returns only to its principal owner; claim reserves stay protected.'
                      : 'Process at most 32 pending events. Repeat only if the contract still has a backlog.'}
                </p>
              </TransactionPanel>
            )}
        </>
      )}
      <WalletActivity />
    </div>
  );
}
