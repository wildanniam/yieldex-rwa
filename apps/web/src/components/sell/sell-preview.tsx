'use client';

import Link from 'next/link';
import { useEffect, useReducer, useRef, type FormEvent } from 'react';
import { AssetMark } from '@/components/landing/asset-mark';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { TextInput } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Slider } from '@/components/ui/slider';
import {
  durationOptions,
  initialSellDraft,
  sellAssets,
  sellDraftReducer,
  sellSteps,
  validateSellDraft,
} from './sell-draft';
import s from './sell.module.css';

const stepTitles = [
  'Choose your asset.',
  'Set aside your backing.',
  'Make it your offer.',
  'One last look.',
  'Your terms are ready.',
];
const stepDescriptions = [
  'Start with the token whose income you want to offer.',
  'Choose how much will back the offer. Ownership stays yours.',
  'Set the income share, upfront price and time period.',
  'Review what the buyer receives and what stays with you.',
  'This is a draft preview. No approval, deposit or transaction was sent.',
];

/** Adapts the teammate's five-step sell slice; this view never creates an intent. */
export function SellPreview() {
  const [draft, dispatch] = useReducer(sellDraftReducer, initialSellDraft);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const asset = sellAssets.find((entry) => entry.symbol === draft.symbol)!;
  const { errors } = validateSellDraft(draft);
  const ready = draft.step === 4;
  const edit = (
    values: Parameters<typeof sellDraftReducer>[1] & { type: 'edit' },
  ) => dispatch(values);

  useEffect(() => {
    if (draft.step > 0) heading.current?.focus();
  }, [draft.step]);

  useEffect(() => {
    if (draft.showErrors) {
      form.current
        ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
        ?.focus();
    }
  }, [draft.showErrors]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: 'advance' });
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>YOUR ASSET. YOUR TERMS.</p>
          <h1>Sell income rights</h1>
          <p>Keep the asset. Open up its income.</p>
        </div>
        <span className={s.previewLabel}>Presentation preview</span>
      </header>

      <nav className={s.steps} aria-label="Listing creation steps">
        {sellSteps.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={index === draft.step ? 'step' : undefined}
            disabled={index > draft.step}
            onClick={() => dispatch({ type: 'back', step: index })}
          >
            <span className={index <= draft.step ? s.stepReached : ''}>
              {index < draft.step ? (
                <Icon name="check" size={14} alt="" inheritColor />
              ) : (
                index + 1
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>

      <div className={s.columns}>
        <form ref={form} className={s.form} onSubmit={submit} noValidate>
          <div className={s.stepHeading}>
            <h2 ref={heading} tabIndex={-1}>
              {stepTitles[draft.step]}
            </h2>
            <p>{stepDescriptions[draft.step]}</p>
          </div>

          {draft.step === 0 && (
            <fieldset className={s.assets}>
              <legend className="sr-only">Backing asset</legend>
              {sellAssets.map((option) => (
                <label className={s.asset} key={option.symbol}>
                  <input
                    type="radio"
                    name="backing-asset"
                    value={option.symbol}
                    checked={draft.symbol === option.symbol}
                    onChange={() =>
                      edit({ type: 'edit', values: { symbol: option.symbol } })
                    }
                  />
                  <span className={s.assetBody}>
                    <span className={s.assetLogo}>
                      <AssetMark symbol={option.symbol} />
                    </span>
                    <span className={s.assetName}>
                      <strong>{option.name}</strong>
                      <small>{option.symbol}</small>
                    </span>
                    <span className={s.assetBalance}>
                      {option.balance}
                      <small>Example balance</small>
                    </span>
                    <span className={s.radioDot} />
                  </span>
                </label>
              ))}
              <p className={s.quiet}>
                Sepolia tokens · example balances, not your wallet.
              </p>
            </fieldset>
          )}

          {draft.step === 1 && (
            <div className={s.fields}>
              <div className={s.amountTitle}>
                <span className={s.assetLogo}>
                  <AssetMark symbol={asset.symbol} />
                </span>
                <div>
                  <strong>{asset.name}</strong>
                  <p>{asset.symbol}</p>
                </div>
              </div>
              <TextInput
                label="Amount to back the offer"
                inputMode="decimal"
                autoComplete="off"
                value={draft.amount}
                onChange={(event) =>
                  edit({ type: 'edit', values: { amount: event.target.value } })
                }
                error={draft.showErrors ? (errors.amount ?? '') : ''}
                endAdornment={
                  <span className={s.inputSuffix}>{asset.symbol}</span>
                }
              />
              <div className={s.balanceRow}>
                <span>
                  Example balance: {asset.balance} {asset.symbol}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    edit({ type: 'edit', values: { amount: asset.balance } })
                  }
                >
                  Use max
                </button>
              </div>
              <div className={s.explanation}>
                <Icon name="vault" alt="" size={20} inheritColor />
                <div>
                  <strong>Reserved for this offer</strong>
                  <p>
                    In the wallet flow, the backing is locked when the listing
                    is created. This preview does not move any tokens.
                  </p>
                </div>
              </div>
            </div>
          )}

          {draft.step === 2 && (
            <div className={s.fields}>
              <Slider
                label="Income share offered to the buyer"
                min={1}
                max={100}
                value={draft.incomeShare}
                onChange={(event) =>
                  edit({
                    type: 'edit',
                    values: { incomeShare: Number(event.target.value) },
                  })
                }
                helperText={`You keep ${100 - draft.incomeShare}% of the income during the term.`}
                error={draft.showErrors ? (errors.incomeShare ?? '') : ''}
              />
              <TextInput
                label="Fixed upfront price"
                inputMode="decimal"
                autoComplete="off"
                value={draft.price}
                onChange={(event) =>
                  edit({ type: 'edit', values: { price: event.target.value } })
                }
                endAdornment={<span className={s.inputSuffix}>DemoUSD</span>}
                error={draft.showErrors ? (errors.price ?? '') : ''}
                helperText="Paid to you once a buyer accepts."
              />
              <SegmentedControl
                label="Income-right period"
                options={durationOptions.map((days) => ({
                  label: `${days} days`,
                  value: String(days),
                }))}
                value={String(draft.durationDays)}
                onChange={(value) =>
                  edit({
                    type: 'edit',
                    values: { durationDays: Number(value) },
                  })
                }
                helperText="The period begins at purchase. The offer stays open for 7 days."
                error={draft.showErrors ? (errors.durationDays ?? '') : ''}
              />
            </div>
          )}

          {draft.step === 3 && (
            <div className={s.fields}>
              <dl className={s.review}>
                <div>
                  <dt>Backing to lock</dt>
                  <dd>
                    {draft.amount} {asset.symbol}
                  </dd>
                </div>
                <div>
                  <dt>Income for the buyer</dt>
                  <dd>{draft.incomeShare}%</dd>
                </div>
                <div>
                  <dt>Income you retain</dt>
                  <dd>{100 - draft.incomeShare}%</dd>
                </div>
                <div>
                  <dt>Rights period</dt>
                  <dd>{draft.durationDays} days from purchase</dd>
                </div>
                <div>
                  <dt>Offer availability</dt>
                  <dd>7 days from listing</dd>
                </div>
                <div>
                  <dt>Income paid in</dt>
                  <dd>{asset.symbol}</dd>
                </div>
              </dl>
              <div className={s.explanation}>
                <Icon name="info" alt="" size={20} inheritColor />
                <p>
                  You can cancel an unfilled offer. Releasing backing requires
                  safe accounting. After purchase, the backing stays locked for
                  the obligation.
                </p>
              </div>
              <Checkbox
                checked={draft.acknowledged}
                onChange={(event) =>
                  dispatch({ type: 'acknowledge', value: event.target.checked })
                }
                label="I understand income can be lower than expected or zero."
                description="The buyer's upfront payment is not refunded at expiry."
                error={
                  draft.showErrors && !draft.acknowledged
                    ? 'Please acknowledge this before completing the preview.'
                    : ''
                }
              />
            </div>
          )}

          {ready && (
            <div className={s.ready}>
              <span className={s.readyIcon}>
                <Icon name="receipt" size={30} alt="" inheritColor />
              </span>
              <h3>A clear offer. A deliberate next step.</h3>
              <p>
                Your draft offers {draft.incomeShare}% of the income from{' '}
                {draft.amount} {asset.symbol} for {draft.durationDays} days, at{' '}
                {draft.price} DemoUSD.
              </p>
              <div className={s.explanation}>
                <Icon name="wallet" size={20} alt="" inheritColor />
                <p>
                  To create an onchain listing, open the wallet flow and enter
                  your terms there. This draft is not transferred or published.
                </p>
              </div>
              <Link href="/lab" className={buttonVariants({ size: 'lg' })}>
                Open wallet flow{' '}
                <Icon name="arrow-up-right" alt="" size={18} inheritColor />
              </Link>
              <Button
                variant="ghost"
                onClick={() => dispatch({ type: 'reset' })}
              >
                Start another draft
              </Button>
            </div>
          )}

          {draft.showErrors && (
            <p role="alert" className={s.errorSummary}>
              Check the highlighted field to continue.
            </p>
          )}

          {!ready && (
            <div className={s.formActions}>
              {draft.step > 0 ? (
                <Button
                  variant="ghost"
                  leadingIcon="arrow-left"
                  onClick={() =>
                    dispatch({ type: 'back', step: draft.step - 1 })
                  }
                >
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" trailingIcon="arrow-right">
                {draft.step === 3 ? 'Finish preview' : 'Continue'}
              </Button>
            </div>
          )}
        </form>

        <aside className={s.summary} aria-label="Draft offer summary">
          <div className={s.summaryTop}>
            <span>Your offer</span>
            <span className={s.draftTag}>Unpublished</span>
          </div>
          <div className={s.summaryAsset}>
            <span className={s.assetLogo}>
              <AssetMark symbol={asset.symbol} />
            </span>
            <div>
              <h2>{asset.name}</h2>
              <p>{asset.symbol}</p>
            </div>
          </div>
          <div className={s.price}>
            <span>Fixed upfront price</span>
            <strong>
              {errors.price ? '—' : draft.price}
              <small>DemoUSD</small>
            </strong>
          </div>
          <dl className={s.summaryDetails}>
            <div>
              <dt>Backing</dt>
              <dd>
                {errors.amount ? '—' : draft.amount} {asset.symbol}
              </dd>
            </div>
            <div>
              <dt>Buyer income share</dt>
              <dd>{draft.incomeShare}%</dd>
            </div>
            <div>
              <dt>Period at purchase</dt>
              <dd>{draft.durationDays} days</dd>
            </div>
          </dl>
          <div className={s.ownership}>
            <Icon name="lock" size={16} alt="" inheritColor />
            <span>The principal stays yours.</span>
          </div>
          <p className={s.quiet}>
            Your draft is only kept on this page. No tokens are locked and no
            listing is created.
          </p>
        </aside>
      </div>
    </div>
  );
}
