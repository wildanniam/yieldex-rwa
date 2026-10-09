'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AmountInput, TextInput } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Slider } from '@/components/ui/slider';

type SellStep = 'asset' | 'deposit' | 'terms' | 'review' | 'confirm';

interface SellAsset {
  id: string;
  balance: string;
  value: string;
}

const assets: [SellAsset, SellAsset, SellAsset] = [
  { id: 'dAAPL', balance: '100 dAAPL', value: '$10,000 illustrative' },
  { id: 'dNVDA', balance: '40 dNVDA', value: '$4,800 illustrative' },
  { id: 'dKO', balance: '250 dKO', value: '$15,000 illustrative' },
];

const steps: [
  { id: SellStep; label: string },
  { id: SellStep; label: string },
  { id: SellStep; label: string },
  { id: SellStep; label: string },
  { id: SellStep; label: string },
] = [
  { id: 'asset', label: 'Asset' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'terms', label: 'Terms' },
  { id: 'review', label: 'Review' },
  { id: 'confirm', label: 'Confirm' },
];

export default function SellPage() {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [step, setStep] = useState<SellStep>('asset');
  const [depositAmount, setDepositAmount] = useState('100');
  const [incomeShare, setIncomeShare] = useState(50);
  const [price, setPrice] = useState('90 DemoUSD');
  const [duration, setDuration] = useState('6m');
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const router = useRouter();
  const stepIndex = steps.findIndex((item) => item.id === step);
  const currentStep = steps[stepIndex]?.label ?? 'Asset';
  const nextStep = steps[stepIndex + 1];
  const canPublish = riskAcknowledged;
  const durationLabel = duration === '6m' ? '6 months' : duration;

  const advanceDraft = () => {
    if (step === 'review' && !canPublish) {
      return;
    }
    if (nextStep) {
      setStep(nextStep.id);
    }
  };

  const createListing = () => {
    if (!riskAcknowledged) {
      return;
    }
    router.push('/listings?created=simulated');
  };

  return (
    <div className="min-w-0">
      <nav
        aria-label="Listing creation steps"
        className="mb-10 grid grid-cols-5 gap-4"
      >
        {steps.map((item, index) => (
          <button
            aria-current={item.id === step ? 'step' : undefined}
            className="text-left"
            key={item.id}
            onClick={() => index <= stepIndex && setStep(item.id)}
            type="button"
          >
            <span
              className={`block h-1 rounded-full ${index <= stepIndex ? 'bg-green-1' : 'bg-tint'}`}
            />
            <span
              className={`mt-2 block text-sm ${item.id === step ? 'text-green-1' : 'text-text-3'}`}
            >
              {index + 1} {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 rounded-3xl border border-[#50555566] bg-card p-6">
          {step === 'confirm' && (
            <Image
              alt=""
              className="mx-auto"
              height={124}
              src="/images/flowbite_badge-check-solid.svg"
              width={124}
            />
          )}
          <h1 className="text-3xl font-semibold text-text-1">
            {step === 'asset'
              ? 'Choose a backing asset'
              : step === 'deposit'
                ? 'Deposit your backing'
                : step === 'terms'
                  ? 'Set your listing terms'
                  : step === 'review'
                    ? 'Review before creating'
                    : step === 'confirm'
                      ? 'Listing created'
                      : `${currentStep} · draft`}
          </h1>
          <p className="mt-3 text-text-2">
            {step === 'asset'
              ? 'Select a registered token from Alice’s wallet. You’re selling its income rights, not the token itself.'
              : step === 'deposit'
                ? 'Move dAAPL to the vault. The principal remains yours and backs only this listing.'
                : step === 'terms'
                  ? 'Choose the income share, fixed price and period offered to the buyer.'
                  : step === 'review'
                    ? 'Check the rights you’re offering. Creating a listing does not sell or transfer your principal.'
                    : step === 'confirm'
                      ? 'All creation steps are confirmed in this simulated completion state.'
                      : 'This step is a draft preview. No token approval, deposit, or listing has been created.'}
          </p>

          {step === 'asset' ? (
            <>
              <div
                className="mt-6 space-y-4"
                role="radiogroup"
                aria-label="Backing asset"
              >
                {assets.map((asset) => {
                  const selected = asset.id === selectedAsset.id;
                  return (
                    <button
                      aria-checked={selected}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left ${selected ? 'border-green-1 bg-tint' : 'border-input-border bg-card hover:border-green-1/60'}`}
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      role="radio"
                      type="button"
                    >
                      <span
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${selected ? 'bg-linear-to-b from-green-1 via-green-2 to-green-3 text-card' : 'bg-[#101817] text-text-2'}`}
                      >
                        <Icon alt="" inheritColor name="layers" size={24} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-medium text-text-1">
                          {asset.id}
                        </span>
                        <span className="mt-1 block text-sm text-text-2">
                          Balance {asset.balance} · {asset.value}
                        </span>
                      </span>
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border ${selected ? 'border-green-1 text-green-1' : 'border-border text-transparent'}`}
                      >
                        <Icon alt="" inheritColor name="check" size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-5 text-sm text-text-1">
                Income is paid in the same token
              </p>
              <div className="mt-5 rounded-2xl border border-[#50555566] bg-raised p-5">
                <p className="text-sm text-text-3">
                  Unregistered token · Disabled
                </p>
                <p className="mt-2 text-xs text-text-2">
                  Not in the asset registry, cannot be deposited.
                </p>
              </div>
            </>
          ) : step === 'deposit' ? (
            <>
              <h2 className="mt-8 text-lg font-medium">Amount to deposit</h2>
              <div className="mt-3">
                <AmountInput
                  aria-label="Amount to deposit"
                  balanceText={`Available for new deposit: ${selectedAsset.balance}`}
                  currency={selectedAsset.id}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  onMax={() => setDepositAmount('100')}
                  simulatedUsd="10,000"
                  value={depositAmount}
                />
              </div>
              <div className="mt-6 flex gap-3 rounded-xl border border-border bg-[#101817] p-4">
                <Icon
                  alt=""
                  className="mt-0.5 text-purple-1"
                  inheritColor
                  name="info"
                  size={20}
                />
                <div className="text-sm">
                  <p className="font-medium text-purple-1">
                    Deposited tokens are locked as backing for this listing.
                  </p>
                  <p className="mt-2 text-text-3">
                    This is a vault deposit, not a transfer of principal to a
                    buyer.
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tint text-green-text">
                    <Icon alt="" inheritColor name="check" size={18} />
                  </span>
                  <div>
                    <p className="font-medium">Approve {selectedAsset.id}</p>
                    <p className="mt-1 text-sm text-text-3">
                      Confirmed · exact allowance {depositAmount}{' '}
                      {selectedAsset.id}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#17152B] text-purple-1">
                    <Icon alt="" inheritColor name="clock" size={18} />
                  </span>
                  <div>
                    <p className="font-medium">Deposit to vault</p>
                    <p className="mt-1 text-sm text-text-3">
                      In-wallet · confirm deposit of {depositAmount}{' '}
                      {selectedAsset.id}
                    </p>
                  </div>
                </div>
              </div>
              <dl className="mt-6 rounded-2xl bg-[#101817] p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-3">Allowance</dt>
                  <dd>
                    Exactly {depositAmount} {selectedAsset.id} · no unlimited
                    approval
                  </dd>
                </div>
                <div className="mt-4 flex justify-between gap-4">
                  <dt className="text-text-3">Destination</dt>
                  <dd>Yieldex Vault · Ethereum Sepolia</dd>
                </div>
                <p className="mt-4 text-xs leading-5 text-text-3">
                  Deposit is not confirmed. Your wallet still has{' '}
                  {depositAmount} {selectedAsset.id} available for a new
                  deposit.
                </p>
              </dl>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-text-3">
                  Deposit awaiting your signature
                </p>
                <Button onClick={() => undefined} size="lg" variant="accent">
                  Open wallet
                </Button>
              </div>
            </>
          ) : step === 'terms' ? (
            <>
              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-text-2">
                    Deposit confirmed · locked for this draft
                  </p>
                  <p className="mt-2 text-sm text-text-3">
                    Available for new deposit: 0 {selectedAsset.id} · This
                    draft&apos;s vault backing is eligible.
                  </p>
                </div>
                <span className="shrink-0 text-text-1">
                  {depositAmount} {selectedAsset.id}
                </span>
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div>
                  <h2 className="text-lg font-medium">Income share</h2>
                  <Slider
                    aria-label="Income share"
                    className="mt-4"
                    max={100}
                    min={10}
                    onChange={(event) =>
                      setIncomeShare(Number(event.target.value))
                    }
                    value={incomeShare}
                  />
                  <p className="mt-3 text-sm text-text-3">
                    You keep {100 - incomeShare}%
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-[#0C1415] p-4 text-sm">
                  <p className="flex justify-between">
                    <span className="text-text-2">
                      Buyer&apos;s income share
                    </span>
                    <span>{incomeShare}%</span>
                  </p>
                  <p className="mt-3 flex justify-between">
                    <span className="text-text-2">You keep</span>
                    <span>{100 - incomeShare}%</span>
                  </p>
                  <p className="mt-4 text-xs leading-5 text-text-2">
                    Only income during the purchased period is split. Principal
                    stays with you.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div>
                  <TextInput
                    aria-label="Price in DemoUSD"
                    label="Price · DemoUSD"
                    onChange={(event) => setPrice(event.target.value)}
                    value={price}
                  />
                  <p className="mt-2 text-xs text-text-3">
                    Fixed price. The period starts when someone buys.
                  </p>
                </div>
                <div>
                  <SegmentedControl
                    label="Duration"
                    onChange={setDuration}
                    options={[
                      { label: '1m', value: '1m' },
                      { label: '3m', value: '3m' },
                      { label: '6m', value: '6m' },
                      { label: '12m', value: '12m' },
                    ]}
                    value={duration}
                  />
                  <p className="mt-2 text-xs text-text-3">
                    1m / 3m / 6m / 12m ·{' '}
                    {duration === '6m'
                      ? '6 months selected'
                      : `${duration} selected`}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-raised p-5">
                <p className="font-medium">Estimated income to buyer</p>
                <p className="mt-2 text-2xl text-[#7B61FF]">
                  about 1.00 {selectedAsset.id}
                </p>
                <p className="mt-3 text-sm text-text-2">
                  Illustrative only · not guaranteed; may be zero.
                </p>
                <p className="mt-2 text-xs text-text-2">
                  Source: Simulated issuer feed
                </p>
                <p className="mt-2 text-xs text-text-2">
                  Updated 07 Oct 2026 10:42 UTC
                </p>
              </div>
            </>
          ) : step === 'review' ? (
            <>
              <div className="mt-6 rounded-2xl bg-raised p-5">
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-2">Backing</dt>
                    <dd className="text-right">
                      Locked {depositAmount} {selectedAsset.id}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-2">Retained rights</dt>
                    <dd className="text-right text-text-1">
                      You keep {100 - incomeShare}% of income
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-2">Buyer income share</dt>
                    <dd className="text-right text-text-1">{incomeShare}%</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-2">Duration</dt>
                    <dd className="text-right text-text-1">
                      Period starts at purchase, ends after {durationLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-2">Income token</dt>
                    <dd className="text-right text-text-1">
                      Payout in {selectedAsset.id}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-2">Upfront payment</dt>
                    <dd className="text-right text-text-1">Price {price}</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-5 rounded-xl border border-border p-4">
                <div className="flex flex-col justify-between gap-2">
                  <p className="font-medium text-sm">Network fee</p>
                  <div className="flex justify-between gap-2">
                    <p className="text-sm text-text-2">
                      Paid separately in ETH
                    </p>
                    <p className="text-right text-sm">
                      about 0.0007 ETH (simulated)
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#50555566] bg-raised p-4">
                <Icon
                  alt=""
                  className="mt-0.5 shrink-0 text-purple-1"
                  inheritColor
                  name="info"
                  size={20}
                />
                <div className="text-sm">
                  <p className="font-medium text-purple-1">
                    You can cancel until it is sold; cancelling releases your
                    backing.
                  </p>
                  <p className="mt-2 text-text-2">
                    After purchase, backing stays locked for the income-rights
                    obligation. The buyer receives income rights only.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium">Risk acknowledgement</h2>
                <div className="mt-3">
                  <Checkbox
                    checked={riskAcknowledged}
                    label="I understand income may be lower than estimated or zero."
                    onChange={(event) =>
                      setRiskAcknowledged(event.target.checked)
                    }
                  />
                  <p className="mt-2 text-sm text-text-3">
                    {riskAcknowledged
                      ? 'Checked · required before creating the listing.'
                      : 'Required before creating the listing.'}
                  </p>
                </div>
              </div>
            </>
          ) : step === 'confirm' ? (
            <>
              <div className="mt-10 rounded-2xl border border-border p-5 flex flex-col gap-6">
                {[
                  ['Approve', `Confirmed · exact allowance ${depositAmount} ${selectedAsset.id}`],
                  ['Deposit to vault', `Confirmed · ${depositAmount} ${selectedAsset.id} locked as backing`],
                  ['Create listing', 'Confirmed · L-0142 published'],
                ].map(([title, description]) => (
                  <div className="flex items-start gap-2" key={title}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-tint text-green-text">
                      <Icon alt="" inheritColor name="check" size={18} />
                    </span>
                    <div className="flex flex-col gap-2">
                      <p className="font-medium text-text-1">{title}</p>
                      <p className="text-sm font-medium text-text-2">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <h2 className="mt-10 text-2xl font-medium text-text-1">
                Listing L-0142 is live
              </h2>
              <p className="mt-4 text-text-2">
                Your offer is now listed in the demo marketplace. No buyer owns
                the income rights yet; the {durationLabel} period starts only
                at purchase.
              </p>
              <dl className="mt-5 rounded-2xl bg-raised p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-text-2">Seller</dt>
                  <dd className="text-right font-bold text-text-1">Alice Hartono · 0x7a3F...9c2E</dd>
                </div>
                <div className="mt-4 flex justify-between gap-4">
                  <dt className="font-bold text-text-2">Backing retained by seller</dt>
                  <dd className="text-right font-bold text-text-1">{depositAmount} {selectedAsset.id} · locked</dd>
                </div>
                <div className="mt-4 flex justify-between gap-4">
                  <dt className="font-bold text-text-2">Income offered</dt>
                  <dd className="text-right font-bold text-text-1">{incomeShare}% · {durationLabel} · payout {selectedAsset.id}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-border bg-[#101817] p-5">
              <p className="font-medium text-text-1">
                Draft step: {currentStep}
              </p>
              <p className="mt-2 text-sm text-text-3">
                Future terms and confirmation will use the canonical
                CREATE_PRIMARY_LISTING intent after wallet and chain validation.
              </p>
            </div>
          )}
        </section>

        <aside className="h-fit xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-text-1">Your listing</h2>
            <span
              className={
                step === 'confirm'
                  ? 'font-bold text-purple-1'
                  : 'text-xs text-text-2'
              }
            >
              {step === 'review'
                ? 'Ready to publish'
                : step === 'confirm'
                  ? 'Listed'
                  : 'Draft preview'}
            </span>
          </div>
          <div className="mt-4 rounded-3xl border border-[#7BC88259] bg-card p-6">
            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tint text-green-1">
                  <Icon alt="" inheritColor name="layers" size={24} />
                </span>
                <div>
                  <p className="text-xl font-semibold">{selectedAsset.id}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <p className="text-text-2">
                  {step === 'review'
                    ? 'Ready to publish'
                    : step === 'confirm'
                      ? 'Ready to create'
                      : 'Draft · not published'}
                </p>
                <span className="ml-auto rounded-full bg-raised px-3 py-2 text-text-1">
                  Alice Hartono
                </span>
              </div>
            </div>
            <dl className="flex flex-col mt-8 text-sm gap-2">
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Backing</dt>
                <dd className="text-text-1">{selectedAsset.balance}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Income share</dt>
                <dd className="text-text-1">
                  {incomeShare}%
                  {step === 'asset' || step === 'deposit' ? ' · draft' : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Term at purchase</dt>
                <dd className="text-text-1">
                  {durationLabel}
                  {step === 'asset' || step === 'deposit' ? ' · draft' : ''}
                </dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-sm text-text-2">Price / fixed upfront</p>
              <p className="mt-2 text-2xl font-medium">
                {price}
                {step === 'asset' || step === 'deposit' ? ' · draft' : ''}
              </p>
            </div>
            <p className="mt-6 text-xs text-text-2">
              {step === 'deposit'
                ? 'Backing pending deposit'
                : step === 'terms' || step === 'review' || step === 'confirm'
                  ? 'Backing locked for this listing'
                  : 'Backing not deposited'}{' '}
              · Payout in {selectedAsset.id} · period starts at purchase.
              Principal remains with Alice.
            </p>
          </div>
          {(step === 'terms' || step === 'review' || step === 'confirm') && (
            <div className="mt-4 rounded-2xl border border-[#50555566] bg-card p-5">
              <p className="font-medium text-text-1">
                Estimated income to buyer
              </p>
              <p className="mt-2 text-2xl text-purple-1">
                about 1.00 {selectedAsset.id}
              </p>
              <p className="mt-3 text-sm text-text-2">
                Illustrative only · not guaranteed; may be zero.
              </p>
              <p className="mt-2 text-xs text-text-2">
                Source: Simulated issuer feed
              </p>
              <p className="mt-2 text-xs text-text-2">
                Updated 07 Oct 2026 10:42 UTC
              </p>
            </div>
          )}
          <div className="mt-4 rounded-2xl bg-card p-5 text-sm leading-6 flex flex-col gap-2">
            <p className="text-green-1">Sell income. Keep your principal.</p>
            <p className="text-text-2">
              Only time-limited income rights are sold. The buyer pays upfront
              and may resell those rights. This is not a loan.
            </p>
            <p className="text-xs text-text-3">
              Future terms shown are draft defaults, not a live offer.
            </p>
          </div>
          {step === 'review' ? (
            <Button
              className="mt-5 w-full"
              disabled={!canPublish}
              onClick={advanceDraft}
              size="lg"
              variant="primary"
            >
              Create listing
            </Button>
          ) : step === 'confirm' ? (
            <>
              <Button
                className="mt-5 w-full"
                disabled={!riskAcknowledged}
                onClick={createListing}
                size="lg"
                variant="primary"
              >
                View listing
              </Button>
              <Button
                className="mt-4 w-full"
                onClick={() => setStep('asset')}
                size="lg"
                variant="outline"
              >
                Create another
              </Button>
            </>
          ) : (
            <Button
              className="mt-5 w-full"
              onClick={advanceDraft}
              size="lg"
              variant="primary"
            >
              Continue
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}
