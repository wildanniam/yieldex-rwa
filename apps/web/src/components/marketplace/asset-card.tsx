import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { MarketplaceListingCard } from './types';

interface AssetCardProps {
  listing: MarketplaceListingCard;
}

export function AssetCard({ listing }: AssetCardProps) {
  return (
    <article
      className="relative flex min-h-97.5 flex-col overflow-hidden rounded-2xl border border-[#50555566] bg-card bg-linear-to-t from-green-1/20 via-[#070D0E] to-[#070D0E] p-5"
      data-kind={listing.kind ?? undefined}
      data-listing-id={listing.id}
    >
      <div className="relative z-10 flex flex-1 flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-tint">
              <Icon
                alt=""
                className="text-green-1"
                inheritColor
                name="layers"
                size={21}
              />
            </span>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-1">{listing.symbol}</p>
            </div>
          </div>
        </header>

        <div className="mt-5 flex items-center justify-between gap-3 mb-3">
          <p className="flex min-w-0 flex-col text-xs text-text-2">
            <span>{listing.listingCode}</span>
            <span>Backing: {listing.backing}</span>
          </p>
          <div className="flex items-center gap-4 bg-raised rounded-full px-4 py-2">
            {listing.kind && (
              <span className="text-xs text-purple-1 font-medium">
                {listing.kind === 'SECONDARY' ? 'Resale' : 'Primary'}
              </span>
            )}
            <span className="shrink-0 text-right text-xs text-text-1">
              {listing.seller}
            </span>
          </div>
        </div>
        <div className="border-b border-[#50555566] pb-5 mb-5">
          <div className="flex justify-between">
            <span className="text-text-2 text-[14px]">Income share</span>
            <span className="text-text-1 text-[14px]">
              {listing.incomeShare}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-2 text-[14px]">Period</span>
            <span className="text-text-1 text-[14px]">{listing.period}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-2 text-[14px]">Payout in</span>
            <span className="text-text-1 text-[14px]">
              {listing.payoutToken}
            </span>
          </div>
        </div>

        <div className="flex flex-col font-bold text-[24px]">
          <span className="text-text-2 text-[12px] leading-4">Fixed price</span>
          <span>{listing.price}</span>
        </div>

        <div className="mt-auto pt-5">
          <Link
            aria-label={`View offer ${listing.id}`}
            className="block w-full"
            href={`/marketplace/${listing.id}`}
          >
            <Button className="w-full" size="md" variant="primary">
              View offer
            </Button>
          </Link>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-4 text-text-3">
            <Icon alt="" name="info" size={14} />
            <span>{listing.estimate} · Simulated issuer feed</span>
          </p>
        </div>
      </div>
    </article>
  );
}
