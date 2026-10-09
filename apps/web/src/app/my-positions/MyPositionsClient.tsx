'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';

export function MyPositionsClient() {
  const [activeTab, setActiveTab] = React.useState<
    'Active' | 'Expired' | 'Resold'
  >('Active');
  const [viewMode, setViewMode] = React.useState<'Grid' | 'Table'>('Grid');

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="rounded-[24px] bg-gradient-to-r from-[#5146B9] to-[#7768FF] p-6 text-white shadow-sm flex flex-col justify-between h-[140px]">
            <p className="text-[13px] font-medium opacity-80">
              Total claimable
            </p>
            <div>
              <p className="text-[32px] font-semibold mb-1">0.00 dAAPL</p>
              <p className="text-[14px] opacity-80">No allocated income</p>
            </div>
          </div>

          <div className="rounded-[24px] bg-card border border-border p-6 flex flex-col justify-between h-[140px]">
            <p className="text-[13px] font-medium text-text-2">
              Active positions
            </p>
            <div>
              <p className="text-[32px] font-semibold text-text-1 mb-1">0</p>
              <p className="text-[14px] text-text-2">No income rights yet</p>
            </div>
          </div>

          <div className="rounded-[24px] bg-card border border-border p-6 flex flex-col justify-between h-[140px]">
            <p className="text-[13px] font-medium text-text-2">
              Next income event
            </p>
            <div>
              <p className="text-[32px] font-semibold text-text-1 mb-1">
                &mdash;
              </p>
              <p className="text-[14px] text-text-2">No active position</p>
            </div>
          </div>
        </div>

        {/* Tabs and View Switch */}
        <div className="mb-6 flex items-center justify-between border-b border-border">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('Active')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Active' ? 'border-green-text text-green-text' : 'border-transparent text-text-2 hover:text-text-1'}`}
            >
              Active (0)
            </button>
            <button
              onClick={() => setActiveTab('Expired')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Expired' ? 'border-green-text text-green-text' : 'border-transparent text-text-2 hover:text-text-1'}`}
            >
              Expired (0)
            </button>
            <button
              onClick={() => setActiveTab('Resold')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Resold' ? 'border-green-text text-green-text' : 'border-transparent text-text-2 hover:text-text-1'}`}
            >
              Resold (0)
            </button>
          </div>

          <div className="pb-3 w-[140px]">
            <SegmentedControl
              options={[
                { label: 'Grid', value: 'Grid' },
                { label: 'Table', value: 'Table' },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as 'Grid' | 'Table')}
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="flex h-[327px] w-full flex-col items-center justify-center rounded-[26px] border border-border bg-card px-4 text-center mb-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-raised">
            <Icon
              name="layers"
              size={24}
              className="text-text-3"
              inheritColor
            />
          </div>
          <h2 className="mb-4 text-[25px] font-semibold text-text-1">
            No positions yet
          </h2>
          <p className="mb-8 max-w-lg text-[15px] leading-relaxed text-text-2">
            Buy time-limited income rights to collect allocated income.
            Previously accrued claims stay yours, even after a resale or expiry.
          </p>
          <Button
            variant="primary"
            size="md"
            className="rounded-full px-8 bg-gradient-to-r from-[#8BE39A] to-[#55B963] text-black border-none transition-opacity hover:opacity-90"
          >
            Explore marketplace
          </Button>
        </div>

        {/* Education Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-[24px] border border-border bg-card p-6">
            <h3 className="mb-2 text-[18px] font-medium text-text-1">
              Choose your income rights
            </h3>
            <p className="text-[14px] text-text-2 leading-relaxed">
              Review the asset, income share, fixed upfront price and original
              deadline before buying.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-card p-6">
            <h3 className="mb-2 text-[18px] font-medium text-text-1">
              Income rights, not principal
            </h3>
            <p className="text-[14px] text-text-2 leading-relaxed">
              The seller keeps the backing asset. Income depends on allocation
              events; returns are not guaranteed.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-center gap-4 rounded-[16px] border border-border bg-raised p-5">
          <div className="text-[#6960E9] shrink-0">
            <Icon name="info" size={20} inheritColor />
          </div>
          <p className="text-[14px] text-text-2">
            Allocated income remains claimable after expiry. Reselling does not
            transfer previously accrued claims.
          </p>
        </div>
      </main>
    </div>
  );
}
