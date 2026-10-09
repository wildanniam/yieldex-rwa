'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

type BuyStep = 'review' | 'pay' | 'confirm' | 'done';

interface BuyModalProps {
  listingId: string;
  seller: string;
  onClose?: () => void;
}

const steps: Array<{ id: BuyStep; label: string }> = [
  { id: 'review', label: 'Review' },
  { id: 'pay', label: 'Pay' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'done', label: 'Done' },
];

const stepTitles: Record<BuyStep, string> = {
  review: 'Review and buy',
  pay: 'Pay with swap quote',
  confirm: 'Confirm in wallet',
  done: 'Purchase complete',
};

export function BuyModal({ listingId, seller }: BuyModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<BuyStep>('review');
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setStep('review');
        setUnderstood(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setStep('review');
    setUnderstood(false);
  };

  const stepIndex = steps.findIndex((item) => item.id === step);
  const currentStepLabel = steps[stepIndex]?.label ?? 'Review';
  const currentStepTitle = stepTitles[step];

  return (
    <>
      <Button
        className="mt-5 w-full"
        onClick={() => setOpen(true)}
        size="lg"
        variant="primary"
      >
        Buy income rights
      </Button>
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            aria-labelledby="buy-modal-title"
            aria-modal="true"
            className="max-h-[calc(100vh-2rem)] w-full max-w-130 overflow-y-auto rounded-3xl border border-[#1A2322] bg-card p-6 text-text-1"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold" id="buy-modal-title">
                  {currentStepTitle}
                </h2>
                {/*<div*/}
                {/*  className="mt-6 flex items-center gap-1"*/}
                {/*  aria-label="Purchase progress"*/}
                {/*>*/}
                {/*  {steps.map((item, index) => (*/}
                {/*    <div className="flex flex-1 flex-col gap-2" key={item.id}>*/}
                {/*      <div*/}
                {/*        className={`h-1 flex-1 rounded-full ${*/}
                {/*          index <= stepIndex ? 'bg-purple-1' : 'bg-[#1A2322]'*/}
                {/*        }`}*/}
                {/*      />*/}
                {/*      <div className="flex flex-col">*/}
                {/*        <div*/}
                {/*          className={`rounded-full w-full h-1 ${index < stepIndex + 1 ? 'bg-purple-1' : 'bg-raised'}`}*/}
                {/*        />*/}
                {/*        <span*/}
                {/*          className={`text-sm ${*/}
                {/*            item.id === step*/}
                {/*              ? 'text-text-1'*/}
                {/*              : index < stepIndex*/}
                {/*                ? 'text-purple-1'*/}
                {/*                : 'text-text-3'*/}
                {/*          }`}*/}
                {/*        >*/}
                {/*          {item.label}*/}
                {/*        </span>*/}
                {/*      </div>*/}
                {/*    </div>*/}
                {/*  ))}*/}
                {/*</div>*/}
                <p className="sr-only">{currentStepLabel}</p>
              </div>
              <button
                aria-label="Close purchase dialog"
                className="rounded-full p-1 text-text-3 hover:text-text-1"
                onClick={close}
                type="button"
              >
                <Icon alt="" name="x" size={20} />
              </button>
            </div>
            <div
              className="mt-6 flex items-center gap-1"
              aria-label="Purchase progress"
            >
              {steps.map((item, index) => (
                <div className="flex flex-1 flex-col gap-2" key={item.id}>
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      index <= stepIndex ? 'bg-purple-1' : 'bg-[#1A2322]'
                    }`}
                  />
                  <div className="flex flex-col">
                    <div
                      className={`rounded-full w-full h-1 ${index < stepIndex + 1 ? 'bg-purple-1' : 'bg-raised'}`}
                    />
                    <span
                      className={`text-sm ${
                        item.id === step
                          ? 'text-text-1'
                          : index < stepIndex
                            ? 'text-purple-1'
                            : 'text-text-3'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {step === 'review' && (
              <div className="mt-6">
                <p className="mt-2 text-sm text-text-3 mb-4">
                  {listingId} · {seller} · 07 Oct preview / 08 Oct purchase
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-2">Asset</span>
                    <span className="text-text-1">dAAPL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-2">Income sold</span>
                    <span className="text-text-1">50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-2">Period</span>
                    <span className="text-text-1">6 months from purchase</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-2">Payout</span>
                    <span className="text-text-1">dAAPL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-2">Price · fixed upfront</span>
                    <span className="text-text-1 text-2xl">90 DemoUSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-1">Estimated income</span>
                    <span className="text-green-1 text-2xl">
                      about 1.00 dAAPL
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-green-1">
                  ✓ Listing still available · checked 10:44 UTC
                </p>
                <label className="mt-5 flex cursor-pointer gap-3 text-sm text-text-2">
                  <input
                    checked={understood}
                    className="mt-1 accent-green-1"
                    onChange={(event) => setUnderstood(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    I understand income may be lower than estimated or zero.
                  </span>
                </label>
                <Button
                  className="mt-6 w-full"
                  disabled={!understood}
                  onClick={() => setStep('pay')}
                  size="lg"
                  variant="primary"
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 'pay' && (
              <div className="mt-6">
                <select
                  aria-label="Payment token"
                  className="mt-5 h-11 w-full rounded-xl border border-input-border bg-[#0C1415] px-3 text-text-1"
                  defaultValue="ETH"
                >
                  <option value="ETH">Pay with ETH</option>
                </select>
                <div className="mt-4 space-y-3 rounded-xl border border-[#50555566] bg-[#0C1415] p-4 text-sm">
                  <p className="text-yellow">Quote expires in 0:28</p>
                  <p className="flex justify-between">
                    <span className="text-text-2">You pay</span>
                    <span className="text-text-1">0.04540 ETH</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-text-2">You receive at least</span>
                    <span className="text-green-1">90.07 DemoUSD</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-text-2">Rate</span>
                    <span className="text-text-1">1 ETH = 2,000 DemoUSD</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-text-2">Swap fee 0.30%</span>
                    <span className="text-text-1">0.27240 DemoUSD</span>
                  </p>
                </div>
                <div className="my-1">
                  <span>Slippage tolerance</span>
                </div>
                <div className="flex rounded-full border border-input-border p-1 text-xs mb-4">
                  {['0.1%', '0.5%', '1%'].map((value) => (
                    <button
                      className={`flex-1 rounded-full px-3 py-2 ${value === '0.5%' ? 'bg-tint text-green-text' : 'text-text-3'}`}
                      key={value}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="text-sm border border-input-border p-4 flex flex-col gap-2 rounded-xl">
                  <span className="text-text-1">Compare total cost</span>
                  <span className="flex justify-between">
                    <span className="text-text-2">Route A · total</span>
                    <span className="text-green-1">0.04610 ETH</span>
                  </span>
                  <span className="flex justify-between text-text-3">
                    <span className="text-text-2">Route B · total</span>
                    <span className="text-text-1">0.04620 ETH</span>
                  </span>
                </div>
                <span className="text-text-2 text-xs">
                  Illustrative quote, not live pricing. Only 90 DemoUSD is used
                  to buy; excess stays in your wallet. Listing is re-checked
                  after the swap.
                </span>
                <Button
                  className="mt-2 w-full"
                  onClick={() => setStep('confirm')}
                  size="lg"
                  variant="primary"
                >
                  Continue with Route A
                </Button>
              </div>
            )}

            {step === 'confirm' && (
              <div className="mt-6">
                <div className="mt-5 rounded-3xl border border-[#50555566] bg-[#0C1415] px-6 py-8">
                  <div className="flex items-center justify-center gap-6">
                    <span className="grid size-16 place-items-center rounded-full border-2 border-green-3 text-green-1">
                      <Icon alt="" inheritColor name="lock" size={20} />
                    </span>
                    <span className="grid size-20 place-items-center rounded-full bg-linear-to-b from-green-1 via-green-2 to-green-3 text-canvas">
                      <Icon alt="" inheritColor name="wallet" size={40} />
                    </span>
                    <span className="grid size-16 place-items-center rounded-full border-2 border-green-3 text-green-1">
                      <Icon alt="" inheritColor name="shield-check" size={20} />
                    </span>
                  </div>
                  <p className="mt-10 text-center text-xs text-text-3">
                    Bob Santoso · 0x41B8...e07D
                  </p>
                </div>
                <div>
                  <span className="text-2xl">
                    Confirm the purchase in your wallet
                  </span>
                </div>
                <div className="flex flex-col gap-2 mt-4 rounded-xl border border-border p-4 text-sm">
                  <span className="text-text-2">Purchase summary</span>
                  <span className="text-lg">
                    Pay 90 DemoUSD · Receive position
                  </span>
                  <span className="text-text-3">
                    L-0142 · 50% dAAPL income · 6 months from purchase
                  </span>
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <span className="text-sm text-text-3">
                    Alice keeps the 100 dAAPL principal. You receive
                    time-limited income rights, not the backing tokens.
                  </span>
                  <span className="text-sm text-text-3">
                    Review the transaction in your wallet. No ownership is
                    confirmed until the purchase receives a confirmation.
                  </span>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setStep('done')}
                  size="lg"
                  variant="primary"
                >
                  Open Wallet
                </Button>
              </div>
            )}

            {step === 'done' && (
              <div className="mt-14">
                <div className="flex flex-col items-center">
                  <span className="grid place-items-center">
                    <Image
                      alt=""
                      height={124}
                      src="/images/flowbite_badge-check-solid.svg"
                      width={124}
                    />
                  </span>
                  <h3 className="mt-14 self-start text-2xl font-bold text-text-1">
                    You own position #P-0087
                  </h3>
                </div>
                <div className="mt-10 rounded-3xl border border-border bg-[#0C1415] p-4 flex flex-col gap-2">
                  <p className="text-sm text-text-2">Purchase receipt</p>
                  <p className="text-lg">90 DemoUSD paid to Alice</p>
                  <p className="text-sm text-text-2">
                    Active until 08 Apr 2027
                  </p>
                </div>
                <dl className="mt-8 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-6">
                    <dt className="text-text-2">Buyer</dt>
                    <dd className="text-right text-text-1">
                      Bob Santoso · 0x41B8...e07D
                    </dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-text-2">Income share</dt>
                    <dd className="text-right text-green-1">
                      50% dAAPL income
                    </dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-text-2">Start</dt>
                    <dd className="text-right text-text-1">08 Oct 2026</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-text-2">End</dt>
                    <dd className="text-right text-text-1">08 Apr 2027</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm leading-7 text-text-2">
                  You own income rights for this period. Alice retains the 100
                  dAAPL principal; no income has accrued at purchase.
                </p>
                <p className="mt-8 text-xs text-text-2">
                  Confirmed demo receipt · 08 Oct 2026 11:03 UTC · 0x9f3a...b21c
                  · Block 7,204,118
                </p>
                <p className="sr-only">
                  Demo-only confirmation; no wallet transaction is sent.
                </p>
                <Link className="mt-10 block" href="/positions" onClick={close}>
                  <Button className="w-full" size="lg" variant="primary">
                    View position
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
