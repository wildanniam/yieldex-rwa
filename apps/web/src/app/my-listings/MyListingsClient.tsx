'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { CancelListingModal, type ListingData } from './CancelListingModal';
import { SoldListingDrawer, type SoldListingData } from './SoldListingDrawer';

const MOCK_LISTINGS_ACTIVE = [
  {
    id: 'L-0142',
    asset: 'dAAPL',
    backingAmount: 100,
    incomeShare: '50%',
    period: '6m',
    price: '90 DemoUSD',
    status: 'Listed',
    vaultName: 'Alice',
  },
  {
    id: 'L-0143',
    asset: 'dNVDA',
    backingAmount: 40,
    incomeShare: '25%',
    period: '3m',
    price: '38 DemoUSD',
    status: 'Listed',
    vaultName: 'Alice',
  },
];

const MOCK_LISTINGS_SOLD = [
  {
    id: 'L-0142',
    asset: 'dAAPL',
    backingAmount: 100,
    incomeShare: '50%',
    period: '6m',
    price: '90 DemoUSD',
    status: 'Active',
    vaultName: 'Alice',
  },
];

const MOCK_LISTINGS_CANCELLED = [
  {
    id: 'L-0142',
    asset: 'dAAPL',
    backingAmount: 100,
    incomeShare: '50%',
    period: '6m',
    price: '90 DemoUSD',
    status: 'Cancelled',
    vaultName: 'Alice',
  },
];

export function MyListingsClient() {
  const [activeTab, setActiveTab] = React.useState<
    'Active' | 'Sold' | 'Cancelled'
  >('Active');

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [selectedListing, setSelectedListing] =
    React.useState<ListingData | null>(null);

  // Sold Drawer State
  const [isSoldDrawerOpen, setIsSoldDrawerOpen] = React.useState(false);
  const [selectedSoldListing, setSelectedSoldListing] =
    React.useState<SoldListingData | null>(null);

  const handleCancelClick = (listing: Record<string, unknown>) => {
    setSelectedListing({
      id: listing.id as string,
      asset: listing.asset as string,
      backingAmount: listing.backingAmount as string,
      vaultName: listing.vaultName as string,
    });
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    console.log(`Cancelling listing ${selectedListing?.id}...`);
    setIsCancelModalOpen(false);
    setSelectedListing(null);
  };

  const handleViewSoldClick = (listing: Record<string, unknown>) => {
    setSelectedSoldListing({
      id: listing.id as string,
      asset: listing.asset as string,
      backingAmount: listing.backingAmount as string,
      vaultName: listing.vaultName as string,
      incomeShare: listing.incomeShare as string,
      period: listing.period as string,
      price: listing.price as string,
    });
    setIsSoldDrawerOpen(true);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-canvas">
        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {/* Tabs and Actions */}
          <div className="mb-6 flex items-center justify-between border-b border-border">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('Active')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Active' ? 'border-green-text text-green-text' : 'border-transparent text-text-2 hover:text-text-1'}`}
              >
                Active (2)
              </button>
              <button
                onClick={() => setActiveTab('Sold')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Sold' ? 'border-green-text text-green-text' : 'border-transparent text-text-2 hover:text-text-1'}`}
              >
                Sold (1)
              </button>
              <button
                onClick={() => setActiveTab('Cancelled')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Cancelled' ? 'border-green-text text-green-text' : 'border-transparent text-text-2 hover:text-text-1'}`}
              >
                Cancelled (1)
              </button>
            </div>
            <div className="pb-3">
              <Button variant="primary" size="md">
                Create listing
              </Button>
            </div>
          </div>

          {activeTab === 'Active' && (
            <>
              {/* Table */}
              <div className="overflow-hidden rounded-[16px] border border-border bg-card">
                <table className="w-full text-left">
                  <thead className="bg-raised text-[12px] font-medium text-text-2">
                    <tr>
                      <th className="px-6 py-4 font-medium">Listing</th>
                      <th className="px-6 py-4 font-medium">Asset</th>
                      <th className="px-6 py-4 font-medium">Backing</th>
                      <th className="px-6 py-4 font-medium">Income share</th>
                      <th className="px-6 py-4 font-medium">Period</th>
                      <th className="px-6 py-4 font-medium">Price</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-text-1">
                    {MOCK_LISTINGS_ACTIVE.map((listing, idx) => (
                      <tr
                        key={listing.id}
                        className={idx > 0 ? 'border-t border-border' : ''}
                      >
                        <td className="px-6 py-4">{listing.id}</td>
                        <td className="px-6 py-4">{listing.asset}</td>
                        <td className="px-6 py-4">
                          {listing.backingAmount} {listing.asset}
                        </td>
                        <td className="px-6 py-4">{listing.incomeShare}</td>
                        <td className="px-6 py-4">{listing.period}</td>
                        <td className="px-6 py-4">{listing.price}</td>
                        <td className="px-6 py-4">
                          <span className="rounded px-2 py-1 text-[12px] font-medium text-purple-2 bg-[#231A3C]">
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(listing)}
                          >
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Text */}
              <p className="mt-3 text-[12px] text-text-2">
                2 active listings &middot; Terms start at purchase &middot;
                Backing remains yours
              </p>

              {/* Info Cards */}
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-[24px] border border-border bg-card p-6">
                  <h3 className="mb-2 text-lg font-medium text-text-1">
                    Before a purchase
                  </h3>
                  <p className="mb-6 text-sm text-text-2 leading-relaxed">
                    Cancel a listed offer to release its backing to your vault.
                    No sale price is paid or received.
                  </p>
                  <p className="text-[12px] text-text-3">
                    A network fee is separate from the sale price.
                  </p>
                </div>
                <div className="rounded-[24px] border border-border bg-card p-6">
                  <h3 className="mb-2 text-lg font-medium text-text-1">
                    After a sale
                  </h3>
                  <p className="mb-6 text-sm text-text-2 leading-relaxed">
                    The buyer owns the income rights for the agreed term. Your
                    principal stays yours and backing remains locked while
                    rights are active.
                  </p>
                  <p className="text-[12px] text-text-3">
                    Sold offers cannot be cancelled during the active term.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Sold' && (
            <>
              {/* Sold Table */}
              <div className="overflow-hidden rounded-[16px] border border-border bg-card">
                <table className="w-full text-left">
                  <thead className="bg-raised text-[12px] font-medium text-text-2">
                    <tr>
                      <th className="px-6 py-4 font-medium">Listing</th>
                      <th className="px-6 py-4 font-medium">Asset</th>
                      <th className="px-6 py-4 font-medium">Backing</th>
                      <th className="px-6 py-4 font-medium">Income share</th>
                      <th className="px-6 py-4 font-medium">Period</th>
                      <th className="px-6 py-4 font-medium">Price</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-text-1">
                    {MOCK_LISTINGS_SOLD.map((listing, idx) => (
                      <tr
                        key={listing.id}
                        className={idx > 0 ? 'border-t border-border' : ''}
                      >
                        <td className="px-6 py-4">{listing.id}</td>
                        <td className="px-6 py-4">{listing.asset}</td>
                        <td className="px-6 py-4">
                          {listing.backingAmount} {listing.asset}
                        </td>
                        <td className="px-6 py-4">{listing.incomeShare}</td>
                        <td className="px-6 py-4">{listing.period}</td>
                        <td className="px-6 py-4">{listing.price}</td>
                        <td className="px-6 py-4">
                          <span className="rounded px-2 py-1 text-[12px] font-medium text-green-2 bg-green-1/10">
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSoldClick(listing)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-text-3 opacity-60 hover:text-text-3 hover:bg-transparent cursor-not-allowed border-border"
                          >
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Text */}
              <p className="mt-3 text-[12px] text-text-2">
                Selected sold listing &middot; other historical sale not shown
              </p>

              {/* Sold Detail Card */}
              <div className="mt-8 rounded-[24px] border border-border bg-card p-6 w-full max-w-[640px]">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-[20px] font-medium text-text-1">
                    L-0142 &middot; Sold to Bob
                  </h2>
                  <span className="rounded px-2 py-1 text-[12px] font-medium text-green-2 bg-green-1/10">
                    Active
                  </span>
                </div>

                <p className="mb-6 text-[14px] text-text-2 leading-relaxed">
                  Bob Santoso - 0x41B8...e07D owns the 50% income rights. 100
                  dAAPL backing remains locked. Alice keeps the principal.
                </p>

                <div className="flex space-x-3 mb-6">
                  <Button
                    variant="accent"
                    size="sm"
                    className="rounded-full px-6"
                    onClick={() => handleViewSoldClick(MOCK_LISTINGS_SOLD[0])}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-6 text-text-3 opacity-60 border-border cursor-not-allowed hover:text-text-3"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="rounded-[16px] border border-input-border bg-canvas-deep px-5 py-4">
                  <p className="text-[13px] text-text-2">
                    Sold listings cannot be cancelled while rights are active.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Cancelled' && (
            <>
              {/* Cancelled Table */}
              <div className="overflow-hidden rounded-[16px] border border-border bg-card">
                <table className="w-full text-left">
                  <thead className="bg-raised text-[12px] font-medium text-text-2">
                    <tr>
                      <th className="px-6 py-4 font-medium">Listing</th>
                      <th className="px-6 py-4 font-medium">Asset</th>
                      <th className="px-6 py-4 font-medium">Backing</th>
                      <th className="px-6 py-4 font-medium">Income share</th>
                      <th className="px-6 py-4 font-medium">Period</th>
                      <th className="px-6 py-4 font-medium">Price</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-text-1">
                    {MOCK_LISTINGS_CANCELLED.map((listing, idx) => (
                      <tr
                        key={listing.id}
                        className={idx > 0 ? 'border-t border-border' : ''}
                      >
                        <td className="px-6 py-4">{listing.id}</td>
                        <td className="px-6 py-4">{listing.asset}</td>
                        <td className="px-6 py-4">
                          {listing.backingAmount} {listing.asset}
                        </td>
                        <td className="px-6 py-4">{listing.incomeShare}</td>
                        <td className="px-6 py-4">{listing.period}</td>
                        <td className="px-6 py-4">{listing.price}</td>
                        <td className="px-6 py-4">
                          <span className="rounded px-2 py-1 text-[12px] font-medium text-text-3 bg-raised border border-border">
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Text */}
              <p className="mt-3 text-[12px] text-text-2">
                L-0142 is cancelled &middot; 100 dAAPL released to Alice&apos;s
                vault
              </p>

              {/* Cancellation Receipt */}
              <div className="mt-8 rounded-[24px] border border-[#31553A] bg-card p-6 w-full max-w-4xl">
                <h2 className="text-[20px] font-medium text-text-1 mb-6">
                  Example cancellation receipt
                </h2>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-8">
                  {/* Status Box */}
                  <div className="flex items-center gap-4 rounded-[16px] bg-[#111F17] border border-[#1A3022] px-4 py-3 min-w-[320px]">
                    <div className="text-green-2">
                      <Icon name="check-circle" size={20} inheritColor />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-text-1">
                        Listing cancelled &middot; backing released
                      </p>
                      <p className="text-[13px] text-text-2">
                        Simulated cancellation &middot; L-0142
                      </p>
                    </div>
                    <button className="text-text-3 hover:text-white transition-colors">
                      <Icon name="x" size={16} inheritColor />
                    </button>
                  </div>

                  {/* Hash Box */}
                  <div className="flex items-center gap-3 rounded-full bg-raised px-4 py-3 border border-border">
                    <span className="text-[14px] text-text-1">
                      0xc8d2...4f71
                    </span>
                    <button className="text-text-3 hover:text-white transition-colors">
                      <Icon name="copy" size={16} inheritColor />
                    </button>
                    <button className="text-text-3 hover:text-white transition-colors">
                      <Icon name="external-link" size={16} inheritColor />
                    </button>
                  </div>

                  {/* Note */}
                  <p className="text-[12px] text-text-3 flex-1">
                    Illustrative cancellation hash only. Not verified network
                    proof.
                  </p>
                </div>

                {/* Backing Released Info */}
                <div className="flex items-center gap-4 mb-10">
                  <div className="text-text-3 mt-1">
                    <Icon name="unlock" size={24} inheritColor />
                  </div>
                  <div>
                    <h3 className="text-[24px] font-medium text-text-1">
                      100 dAAPL
                    </h3>
                    <p className="text-[14px] text-text-2 mt-1">
                      Released to Alice Hartono&apos;s vault &middot;
                      0x7a3F...9c2E
                    </p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-text-2">
                      Sale price paid / received
                    </span>
                    <span className="text-text-1 font-medium">None</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-text-2">Principal owner</span>
                    <span className="text-text-1 font-medium">
                      Alice Hartono
                    </span>
                  </div>
                </div>

                <p className="text-[12px] text-text-3">
                  No income was earned from this cancellation. The release is
                  not a loan repayment. Network fees are separate.
                </p>
              </div>

              {/* Still Active */}
              <div className="mt-6 flex items-center justify-between rounded-[16px] bg-raised px-5 py-4 w-full max-w-4xl border border-input-border">
                <div className="flex items-center gap-4">
                  <span className="text-[14px] text-text-2">Still active</span>
                  <span className="text-[14px] font-medium text-text-1">
                    L-0143 &middot; 40 dNVDA &middot; 25% &middot; 3m
                  </span>
                  <span className="text-[13px] font-medium text-purple-2">
                    Listed
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelClick(MOCK_LISTINGS_ACTIVE[1])}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </main>
      </div>

      <CancelListingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        listing={selectedListing}
      />

      <SoldListingDrawer
        isOpen={isSoldDrawerOpen}
        onClose={() => setIsSoldDrawerOpen(false)}
        listing={selectedSoldListing}
      />
    </>
  );
}
