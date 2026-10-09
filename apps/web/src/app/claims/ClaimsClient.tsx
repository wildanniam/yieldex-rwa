'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ClaimIncomeModal, type ClaimData } from './ClaimIncomeModal';

export function ClaimsClient() {
  const [isClaimModalOpen, setIsClaimModalOpen] = React.useState(false);
  const [selectedClaim, setSelectedClaim] = React.useState<ClaimData | null>(
    null,
  );

  const handleClaimClick = () => {
    setSelectedClaim({
      position: '#P-0087',
      asset: 'dAAPL',
      amount: '0.50 dAAPL',
      walletName: 'Bob Santoso',
      walletAddress: '0x41B8...e07D',
    });
    setIsClaimModalOpen(true);
  };

  const handleConfirmClaim = () => {
    console.log('Claim confirmed for', selectedClaim?.position);
    setIsClaimModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Main Content Area */}
      <main className="flex-1 p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-3">
          <div className="rounded-[24px] bg-gradient-to-r from-[#5146B9] to-[#7768FF] p-6 text-white shadow-sm flex flex-col justify-between h-[131px]">
            <p className="text-[13px] font-medium opacity-90">Claimable now</p>
            <div>
              <p className="text-[32px] font-semibold mb-1">0.50 dAAPL</p>
              <p className="text-[13px] opacity-80">
                Allocated balance &middot; not a forecast
              </p>
            </div>
          </div>

          <div className="rounded-[24px] bg-card border border-border p-6 flex flex-col justify-between h-[131px]">
            <p className="text-[13px] font-medium text-text-2">
              Claimed to date
            </p>
            <div>
              <p className="text-[32px] font-semibold text-text-1 mb-1">
                0.00 dAAPL
              </p>
              <p className="text-[13px] text-text-2">
                Total income collected in dAAPL
              </p>
            </div>
          </div>

          <div className="rounded-[24px] bg-card border border-border p-6 flex flex-col justify-between h-[131px]">
            <p className="text-[13px] font-medium text-text-2">
              Positions with income
            </p>
            <div>
              <p className="text-[32px] font-semibold text-text-1 mb-1">1</p>
              <p className="text-[13px] text-text-2">
                Allocated position &middot; rights remain active
              </p>
            </div>
          </div>
        </div>

        {/* Allocated Income Section */}
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[24px] font-semibold text-text-1">
            Allocated income
          </h2>
          <span className="text-[13px] text-text-2">
            Bob&apos;s share &middot; 1 position
          </span>
        </div>

        <div className="overflow-hidden rounded-[16px] border border-border bg-card">
          <table className="w-full text-left">
            <thead className="bg-raised text-[12px] font-medium text-text-2">
              <tr>
                <th className="px-6 py-4 font-medium">Position</th>
                <th className="px-6 py-4 font-medium">Asset</th>
                <th className="px-6 py-4 font-medium">Allocated</th>
                <th className="px-6 py-4 font-medium">Claimed</th>
                <th className="px-6 py-4 font-medium">Claimable</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-text-1">
              <tr>
                <td className="px-6 py-4">#P-0087</td>
                <td className="px-6 py-4">dAAPL</td>
                <td className="px-6 py-4">0.50 dAAPL</td>
                <td className="px-6 py-4">0.00 dAAPL</td>
                <td className="px-6 py-4 text-green-text">0.50 dAAPL</td>
                <td className="px-6 py-4">
                  <span className="rounded-full px-3 py-1 text-[12px] font-medium text-green-2 border border-green-2 bg-transparent">
                    Claimable
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-full px-6 bg-[#62C86F] hover:bg-[#52B75F]"
                    onClick={handleClaimClick}
                  >
                    Claim
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[12px] text-text-2 mb-6">
          Income event 1 of 2 &middot; total 1.00 dAAPL &middot; Alice 0.50 /
          Bob 0.50
        </p>

        {/* Destination Wallet Panel */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-[16px] border border-border bg-card px-5 py-4 mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[12px] text-text-2 mb-1">Destination wallet</p>
              <p className="text-[14px] font-medium text-text-1">Bob Santoso</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-raised px-3 py-1.5 border border-input-border">
              <span className="text-[13px] text-text-1">0x41B8...e07D</span>
              <button className="text-text-3 hover:text-white transition-colors">
                <Icon name="copy" size={14} inheritColor />
              </button>
              <button className="text-text-3 hover:text-white transition-colors">
                <Icon name="external-link" size={14} inheritColor />
              </button>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[14px] font-medium text-text-1">
              50% income rights &middot; active until 08 Apr 2027
            </p>
            <p className="text-[12px] text-text-2 mt-0.5">
              Claiming does not change ownership or the deadline.
            </p>
          </div>
        </div>

        {/* Claim History Section */}
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[24px] font-semibold text-text-1">
            Claim history
          </h2>
          <span className="text-[13px] text-text-2">0 claims</span>
        </div>

        <div className="overflow-hidden rounded-[16px] border border-border bg-card min-h-[240px]">
          <table className="w-full text-left">
            <thead className="bg-raised text-[12px] font-medium text-text-2">
              <tr>
                <th className="px-6 py-4 font-medium w-1/4">Date</th>
                <th className="px-6 py-4 font-medium w-1/4">Amount</th>
                <th className="px-6 py-4 font-medium w-1/4">Transaction</th>
                <th className="px-6 py-4 font-medium w-1/4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="p-8 align-top h-[180px]">
                  <h3 className="text-[18px] font-medium text-text-1 mb-2">
                    No claims yet
                  </h3>
                  <p className="text-[14px] text-text-2">
                    Your first claim will appear here after you collect
                    allocated income.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <ClaimIncomeModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onConfirm={handleConfirmClaim}
        claimData={selectedClaim}
      />
    </div>
  );
}
