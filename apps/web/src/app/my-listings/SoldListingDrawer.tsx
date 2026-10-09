'use client';

import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

export interface SoldListingData {
  id: string;
  asset: string;
  backingAmount: number;
  vaultName: string;
  incomeShare: string;
  period: string;
  price: string;
}

interface SoldListingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  listing: SoldListingData | null;
}

export function SoldListingDrawer({
  isOpen,
  onClose,
  listing,
}: SoldListingDrawerProps) {
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-[110] w-full max-w-[540px] overflow-y-auto border-l border-border bg-card p-6 shadow-2xl transition-transform sm:p-10"
        role="dialog"
        aria-label="Sold Listing Details"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[28px] font-semibold text-text-1">
            Listing {listing.id} &middot; Sold
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-3 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon name="x" size={24} inheritColor />
          </button>
        </div>
        <p className="text-[16px] leading-[1.6] text-text-2 mb-8">
          Primary sale completed. The buyer&apos;s income rights are active;
          this offer is no longer for sale.
        </p>

        {/* Summary Rows */}
        <div className="space-y-4 mb-8 border-b border-border pb-8">
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-text-2">Income share</span>
            <span className="text-text-1 font-medium">
              {listing.incomeShare}
            </span>
          </div>
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-text-2">Payout token</span>
            <span className="text-text-1 font-medium">
              {listing.asset} &middot; simulated
            </span>
          </div>
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-text-2">Period</span>
            <span className="text-text-1 font-medium">
              08 Oct 2026 &rarr; 08 Apr 2027
            </span>
          </div>
        </div>

        {/* Price & Buyer */}
        <div className="mb-8">
          <p className="text-[14px] text-text-2 mb-1">Price received</p>
          <p className="text-[32px] font-medium text-text-1 mb-6">
            {listing.price}
          </p>

          <p className="text-[15px] font-medium text-text-1 mb-3">Buyer</p>
          <div className="inline-flex items-center gap-3 rounded-full bg-raised px-4 py-2 text-[14px] text-text-1 border border-input-border">
            <span>0x41B8...e07D (Bob Santoso)</span>
            <button className="text-text-3 hover:text-white transition-colors">
              <Icon name="copy" size={16} inheritColor />
            </button>
            <button className="text-text-3 hover:text-white transition-colors">
              <Icon name="external-link" size={16} inheritColor />
            </button>
          </div>

          <div className="mt-5 flex items-start sm:items-center gap-3">
            <span className="rounded px-2 py-1 text-[12px] font-medium text-green-2 bg-green-1/10 whitespace-nowrap">
              Active
            </span>
            <p className="text-[14px] text-text-2">
              Active refers to income rights, not an offer for sale.
            </p>
          </div>
        </div>

        {/* Purchase Receipt */}
        <div className="rounded-[24px] bg-raised p-6 mb-6">
          <h3 className="text-[20px] font-medium text-text-1 mb-5">
            Purchase receipt
          </h3>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-[15px] text-text-1">0x9f3a...b21c</span>
            <button className="text-text-3 hover:text-white transition-colors">
              <Icon name="copy" size={16} inheritColor />
            </button>
            <button className="text-text-3 hover:text-white transition-colors">
              <Icon name="external-link" size={16} inheritColor />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-text-2">Purchased</span>
              <span className="text-text-1">
                08 Oct 2026 &middot; 11:03 UTC
              </span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-text-2">Block</span>
              <span className="text-text-1">7,204,118</span>
            </div>
          </div>

          <p className="text-[13px] text-text-3">
            sepolia.etherscan.io &middot; simulated purchase
          </p>
        </div>

        {/* Locked Backing */}
        <div className="rounded-[24px] bg-tint border border-input-border p-6 mb-10">
          <div className="flex gap-4">
            <div className="text-text-1 shrink-0 mt-1">
              <Icon name="lock" size={24} inheritColor />
            </div>
            <div>
              <h3 className="text-[18px] font-medium text-text-1 mb-2">
                {listing.backingAmount} {listing.asset} remains locked
              </h3>
              <p className="text-[14px] text-text-2 leading-relaxed">
                Principal remains {listing.vaultName}&apos;s. Backing cannot be
                released while the income rights are active.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full text-[18px] h-[56px] bg-gradient-to-r from-[#8BE39A] to-[#55B963] !text-black !rounded-full border-none transition-opacity hover:opacity-90"
          >
            View position
          </Button>
          <p className="text-center text-[13px] text-text-2">
            #P0087 &middot; Bob Santoso&apos;s buyer position &middot; read-only
            for {listing.vaultName}
          </p>
          <p className="text-center text-[12px] text-text-3 leading-relaxed mt-2">
            Income depends on allocation events, not a guaranteed return.
            Allocated claims remain claimable after the deadline.
          </p>
        </div>
      </div>
    </>
  );
}
