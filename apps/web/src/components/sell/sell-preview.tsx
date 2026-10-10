'use client';
// The five-step composition from the teammate now uses registered assets and wallet reads.
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AssetMark } from '@/components/landing/asset-mark';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { TextInput } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Slider } from '@/components/ui/slider';
import { usePlatform } from '@/features/marketplace/platform-provider';
import { useAssets, useBalances } from '@/features/marketplace/use-portfolio';
import { amount, company } from '@/features/marketplace/data';
import {
  TransactionPanel,
  WalletActivity,
} from '@/features/marketplace/transaction-panel';
import {
  durationOptions,
  initialSellDraft,
  sellSteps,
  validateSellDraft,
} from './sell-draft';
import s from './sell.module.css';
const titles = [
  'Choose your asset.',
  'Set aside your backing.',
  'Make it your offer.',
  'One last look.',
  'Confirm with your wallet.',
];
const descriptions = [
  'Choose an enabled asset from the registry.',
  'The backing is locked when the listing is created. Ownership stays yours.',
  'Set the income share, upfront price and period.',
  'Review what the buyer receives and what stays with you.',
  'Approve the backing token first if needed, then review again to create your listing.',
];

export function SellPreview() {
  const { access } = usePlatform();
  // Account/network changes reset the financial draft rather than carrying another wallet's terms.
  return (
    <SellFlow key={`${access.identity.wallet}:${access.identity.chainId}`} />
  );
}
function SellFlow() {
  const { access, manifest } = usePlatform();
  const assets = useAssets();
  const balances = useBalances(assets.data?.items ?? []);
  const [draft, setDraft] = useState(initialSellDraft);
  const heading = useRef<HTMLHeadingElement>(null),
    form = useRef<HTMLFormElement>(null);
  const asset = assets.data?.items.find((a) => a.assetKey === draft.assetKey);
  const balance = asset ? (balances.amounts[asset.assetKey] ?? null) : null;
  const validation = validateSellDraft(draft, {
    decimals: asset?.token.decimals ?? 18,
    paymentDecimals: manifest.paymentToken.decimals,
    balance,
  });
  const { errors } = validation;
  const supported =
    asset &&
    asset.newPositionsEnabled &&
    asset.syncStatus === 'SYNCED' &&
    asset.currentMultiplier !== null;
  function edit(values: Partial<typeof draft>) {
    setDraft((old) => ({
      ...old,
      ...values,
      acknowledged: false,
      showErrors: false,
    }));
  }
  useEffect(() => {
    if (draft.step) heading.current?.focus();
  }, [draft.step]);
  useEffect(() => {
    if (draft.showErrors)
      form.current
        ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
        ?.focus();
  }, [draft.showErrors]);
  function submit(e: FormEvent) {
    e.preventDefault();
    const invalid =
      !supported ||
      (draft.step >= 1 && !!errors.amount) ||
      (draft.step >= 2 && Object.keys(errors).length > 0) ||
      (draft.step === 3 && !draft.acknowledged);
    setDraft((old) =>
      invalid
        ? { ...old, showErrors: true }
        : { ...old, step: Math.min(4, old.step + 1), showErrors: false },
    );
  }
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>YOUR ASSET. YOUR TERMS.</p>
          <h1>Sell income rights</h1>
          <p>Keep the asset. Open up its income.</p>
        </div>
      </header>
      {!access.identity.wallet ? (
        <div className={s.explanation}>
          <Icon name="wallet" alt="" inheritColor />
          <div>
            <strong>Connect your wallet to begin</strong>
            <p>Your registered token balances will appear here.</p>
            <Link
              href="/wallet"
              className={buttonVariants({ variant: 'accent', size: 'sm' })}
            >
              Connect wallet
            </Link>
          </div>
        </div>
      ) : access.identity.chainId !== manifest.chainId ? (
        <div className={s.explanation}>
          <Link href="/wallet">
            Switch to the marketplace network to continue →
          </Link>
        </div>
      ) : (
        <>
          <nav className={s.steps} aria-label="Listing creation steps">
            {sellSteps.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-current={i === draft.step ? 'step' : undefined}
                disabled={i > draft.step}
                onClick={() =>
                  setDraft((old) => ({ ...old, step: i, showErrors: false }))
                }
              >
                <span className={i <= draft.step ? s.stepReached : ''}>
                  {i < draft.step ? (
                    <Icon name="check" size={14} alt="" inheritColor />
                  ) : (
                    i + 1
                  )}
                </span>
                {label}
              </button>
            ))}
          </nav>
          {(assets.error || balances.error) && (
            <div role="alert" className={s.explanation}>
              <p>{assets.error || balances.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  assets.refresh();
                  balances.refresh();
                }}
              >
                Retry balances
              </Button>
            </div>
          )}
          <div className={s.columns}>
            <form ref={form} className={s.form} onSubmit={submit} noValidate>
              <div className={s.stepHeading}>
                <h2 ref={heading} tabIndex={-1}>
                  {titles[draft.step]}
                </h2>
                <p>{descriptions[draft.step]}</p>
              </div>
              {draft.step === 0 && (
                <fieldset className={s.assets}>
                  <legend className="sr-only">Backing asset</legend>
                  {assets.loading ? (
                    <p role="status">Loading registered assets…</p>
                  ) : (
                    assets.data?.items.map((a) => (
                      <label className={s.asset} key={a.assetKey}>
                        <input
                          type="radio"
                          name="backing-asset"
                          value={a.assetKey}
                          checked={draft.assetKey === a.assetKey}
                          disabled={
                            !a.newPositionsEnabled || a.syncStatus !== 'SYNCED'
                          }
                          onChange={() =>
                            edit({ assetKey: a.assetKey, amount: '' })
                          }
                        />
                        <span className={s.assetBody}>
                          <span className={s.assetLogo}>
                            <AssetMark symbol={a.token.symbol} />
                          </span>
                          <span className={s.assetName}>
                            <strong>{company(a.token.symbol)}</strong>
                            <small>{a.token.symbol}</small>
                          </span>
                          <span className={s.assetBalance}>
                            {amount(
                              balances.amounts[a.assetKey] ?? null,
                              a.token.decimals,
                            )}
                            <small>
                              {a.syncStatus !== 'SYNCED'
                                ? a.syncStatus.toLowerCase()
                                : balances.loading
                                  ? 'Reading balance'
                                  : 'Wallet balance'}
                            </small>
                          </span>
                          <span className={s.radioDot} />
                        </span>
                      </label>
                    ))
                  )}
                  {draft.showErrors && !supported && (
                    <p role="alert">
                      Choose an enabled asset with available data.
                    </p>
                  )}
                </fieldset>
              )}
              {draft.step === 1 && asset && (
                <div className={s.fields}>
                  <TextInput
                    label="Amount to back the offer"
                    inputMode="decimal"
                    autoComplete="off"
                    value={draft.amount}
                    onChange={(e) => edit({ amount: e.target.value })}
                    error={draft.showErrors ? (errors.amount ?? '') : ''}
                    endAdornment={
                      <span className={s.inputSuffix}>
                        {asset.token.symbol}
                      </span>
                    }
                  />
                  <div className={s.balanceRow}>
                    <span>
                      Balance: {amount(balance, asset.token.decimals)}{' '}
                      {asset.token.symbol}
                    </span>
                    <button
                      type="button"
                      disabled={balance === null}
                      onClick={() =>
                        edit({ amount: amount(balance, asset.token.decimals) })
                      }
                    >
                      Use max
                    </button>
                  </div>
                  <p className={s.quiet}>
                    Backing is deposited only after you confirm creation in your
                    wallet.
                  </p>
                </div>
              )}
              {draft.step === 2 && (
                <div className={s.fields}>
                  <Slider
                    label="Income share offered to the buyer"
                    min={1}
                    max={100}
                    value={draft.incomeShare}
                    onChange={(e) =>
                      edit({ incomeShare: Number(e.target.value) })
                    }
                    helperText={`You keep ${100 - draft.incomeShare}% during the term.`}
                  />
                  <TextInput
                    label="Fixed upfront price"
                    inputMode="decimal"
                    autoComplete="off"
                    value={draft.price}
                    onChange={(e) => edit({ price: e.target.value })}
                    error={draft.showErrors ? (errors.price ?? '') : ''}
                    endAdornment={
                      <span className={s.inputSuffix}>
                        {manifest.paymentToken.symbol}
                      </span>
                    }
                    helperText="Paid when a buyer accepts. No guaranteed income."
                  />
                  <SegmentedControl
                    label="Income-right period"
                    options={durationOptions.map((days) => ({
                      label: `${days} days`,
                      value: String(days),
                    }))}
                    value={String(draft.durationDays)}
                    onChange={(value) => edit({ durationDays: Number(value) })}
                    helperText="The term starts at purchase. This offer will be valid for 7 days."
                  />
                </div>
              )}
              {draft.step === 3 && (
                <div className={s.fields}>
                  <p>
                    Lock {draft.amount} {asset?.token.symbol}, offer{' '}
                    {draft.incomeShare}% of allocated income for{' '}
                    {draft.durationDays} days and receive {draft.price}{' '}
                    {manifest.paymentToken.symbol} when purchased.
                  </p>
                  <Checkbox
                    label="I understand backing is locked until cancellation or expiry and safe accounting. Income can be zero."
                    checked={draft.acknowledged}
                    onChange={(e) =>
                      setDraft((old) => ({
                        ...old,
                        acknowledged: e.target.checked,
                      }))
                    }
                  />
                  {draft.showErrors && (
                    <p role="alert">
                      Review the terms and acknowledge before continuing.
                    </p>
                  )}
                </div>
              )}
              {draft.step < 4 && (
                <div className={s.formActions}>
                  {draft.step > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setDraft((old) => ({ ...old, step: old.step - 1 }))
                      }
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={assets.loading || balances.loading}
                  >
                    Continue
                  </Button>
                </div>
              )}
              {draft.step === 4 && (
                <p className={s.quiet}>
                  Review the terms below before confirming. After submission,
                  follow the receipt in Recent transactions and open your
                  position.
                </p>
              )}
            </form>
            <aside className={s.summary}>
              <p className={s.eyebrow}>YOUR OFFER</p>
              <h2>{asset ? company(asset.token.symbol) : 'Choose an asset'}</h2>
              <dl className={s.summaryDetails}>
                <div>
                  <dt>Backing</dt>
                  <dd>
                    {draft.amount || '—'} {asset?.token.symbol}
                  </dd>
                </div>
                <div>
                  <dt>Income share</dt>
                  <dd>{draft.incomeShare}%</dd>
                </div>
                <div>
                  <dt>Term at purchase</dt>
                  <dd>{draft.durationDays} days</dd>
                </div>
                <div>
                  <dt>Fixed price</dt>
                  <dd>
                    {draft.price || '—'} {manifest.paymentToken.symbol}
                  </dd>
                </div>
              </dl>
              <p className={s.quiet}>
                Principal ownership stays yours. Backing release requires safe
                event accounting.
              </p>
            </aside>
          </div>
          {draft.step === 4 && asset && (
            <TransactionPanel
              label="Create listing"
              buildRequest={async () => {
                if (
                  !access.wallet ||
                  !validation.amountAtomic ||
                  !validation.priceAtomic ||
                  Object.keys(errors).length
                )
                  throw new Error('Review your amount and balance again.');
                const snapshot = await access.wallet.reader.snapshot('latest');
                const fresh = await access.wallet.reader.asset(
                  asset.assetId,
                  snapshot,
                );
                if (fresh.currentMultiplier === null)
                  throw new Error('Token conversion is unavailable.');
                const min =
                  (BigInt(validation.amountAtomic) *
                    BigInt(fresh.multiplierScale)) /
                  BigInt(fresh.currentMultiplier);
                if (min <= 0n)
                  throw new Error(
                    'Amount is too small to receive backing shares.',
                  );
                return {
                  action: 'CREATE_PRIMARY_LISTING',
                  assetKey: fresh.assetKey,
                  depositTokenAmountAtomic: validation.amountAtomic,
                  minReceivedShares: min.toString(),
                  incomeBps: draft.incomeShare * 100,
                  durationSeconds: draft.durationDays * 86400,
                  priceAtomic: validation.priceAtomic,
                  listingExpiresAt: snapshot.blockTimestamp + 7 * 86400,
                };
              }}
            />
          )}
          <WalletActivity />
        </>
      )}
    </div>
  );
}
