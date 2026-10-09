'use client';

import * as React from 'react';
import { Icon } from '@/components/ui/icon';

export interface ClaimData {
  position: string;
  asset: string;
  amount: string;
  walletName: string;
  walletAddress: string;
}

interface ClaimIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  claimData: ClaimData | null;
}

export function ClaimIncomeModal({
  isOpen,
  onClose,
  onConfirm,
  claimData,
}: ClaimIncomeModalProps) {
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

  if (!isOpen || !claimData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6">
      <div
        className="relative w-full max-w-[540px] overflow-hidden rounded-[24px] border border-border bg-[#080E0E] p-6 sm:p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[24px] font-semibold text-text-1">
            Claim income
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-3 transition-colors hover:bg-raised hover:text-text-1"
            aria-label="Close"
          >
            <Icon name="x" size={20} inheritColor />
          </button>
        </div>

        {/* Income Summary */}
        <div className="mb-6">
          <p className="text-[13px] text-text-2 mb-1">
            Allocated income &middot; {claimData.position}
          </p>
          <p className="text-[36px] font-medium text-[#7ACB85] leading-tight mb-1">
            {claimData.amount}
          </p>
          <p className="text-[12px] text-text-3">
            about $50 &middot; illustrative token value, not a forecast
          </p>
        </div>

        {/* Destination Panel */}
        <div className="rounded-[20px] bg-[#111918] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-text-2">Destination</span>
            <span className="text-[13px] font-medium text-text-1">
              {claimData.walletName}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[13px] font-medium text-text-1">
              {claimData.walletAddress}
            </span>
            <button
              className="text-text-3 hover:text-white transition-colors"
              aria-label="Copy address"
            >
              <Icon name="copy" size={14} inheritColor />
            </button>
            <button
              className="text-text-3 hover:text-white transition-colors"
              aria-label="Open in explorer"
            >
              <Icon name="external-link" size={14} inheritColor />
            </button>
          </div>
          <p className="text-[12px] text-text-3">
            Ethereum Sepolia &middot; 11155111
          </p>
        </div>

        {/* Network Fee */}
        <div className="mb-5">
          <p className="text-[13px] text-text-1 mb-1">
            Network fee &middot; simulated
          </p>
          <p className="text-[16px] font-medium text-text-1 mb-1">
            about 0.0007 ETH
          </p>
          <p className="text-[12px] text-text-2">
            Paid separately in ETH. Your claim remains {claimData.amount}.
          </p>
        </div>

        {/* Information Callout */}
        <div className="flex items-start gap-3 rounded-[16px] border border-[#303735] bg-[#111918] p-4 mb-6">
          <div className="text-[#8570FF] mt-0.5 shrink-0">
            <Icon name="info" size={16} inheritColor />
          </div>
          <p className="text-[13px] leading-relaxed text-text-1">
            Claims are paid in dAAPL. Converting to DemoUSD is a separate swap.
          </p>
        </div>

        {/* Primary Claim Button */}
        <button
          onClick={onConfirm}
          className="w-full rounded-full bg-gradient-to-r from-[#8BE39A] to-[#55B963] h-[48px] text-[16px] font-medium text-black transition-opacity hover:opacity-90 mb-4"
        >
          Claim
        </button>

        {/* Footer Disclaimer */}
        <p className="text-[11px] leading-relaxed text-text-3 text-center">
          Static claim example &middot; no actual wallet transaction is
          performed. Bob&apos;s rights remain active.
        </p>
      </div>
    </div>
  );
}
