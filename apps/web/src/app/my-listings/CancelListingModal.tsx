'use client';

import * as React from 'react';
import { Icon } from '@/components/ui/icon';

export interface ListingData {
  id: string;
  asset: string;
  backingAmount: number;
  vaultName: string;
}

interface CancelListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listing: ListingData | null;
}

export function CancelListingModal({
  isOpen,
  onClose,
  onConfirm,
  listing,
}: CancelListingModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="relative flex w-full max-w-[640px] flex-col overflow-hidden rounded-[32px] border border-[#29312F] bg-card px-8 py-10 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2
            id="modal-title"
            className="text-[24px] font-medium text-[#E1E4E5]"
          >
            Cancel listing {listing.id}?
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#9AA1A4] transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <Icon name="x" size={24} inheritColor />
          </button>
        </div>

        {/* Description */}
        <p className="mt-6 text-[18px] leading-[1.5] text-[#D5D9DA]">
          Your {listing.backingAmount} {listing.asset} backing will be released
          back to your vault. Nothing is paid or received.
        </p>

        {/* Info Panel */}
        <div className="mt-8 flex min-h-[100px] flex-col justify-center rounded-[24px] bg-raised px-6 py-6">
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 text-text-1">
              <Icon name="unlock" size={28} inheritColor />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[18px] font-medium text-text-1">
                {listing.backingAmount} {listing.asset} &rarr;{' '}
                {listing.vaultName}&apos;s vault
              </p>
              <p className="mt-1 text-[14px] text-[#9DA5A8]">
                The asset remains yours. This is not a loan repayment.
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8 flex flex-col space-y-3">
          <p className="text-[14px] text-[#9DA5A8]">
            Only listings that have not been purchased can be cancelled.
          </p>
          <p className="text-[13px] text-[#9DA5A8]">
            Network fee about 0.0007 ETH (simulated)
          </p>
          <p className="text-[13px] text-[#9DA5A8]">
            &ldquo;Nothing is paid or received&rdquo; refers to the sale price
            only.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <button
            onClick={onClose}
            className="flex h-[48px] w-full sm:w-[180px] items-center justify-center rounded-full border border-[#515958] bg-transparent text-[16px] font-medium text-[#E0E3E5] transition-colors hover:bg-white/5"
          >
            Keep listing
          </button>
          <button
            onClick={onConfirm}
            className="flex h-[48px] w-full sm:w-[200px] items-center justify-center rounded-full bg-danger text-[16px] font-medium text-black transition-colors hover:opacity-90"
          >
            Cancel listing
          </button>
        </div>
      </div>
    </div>
  );
}
