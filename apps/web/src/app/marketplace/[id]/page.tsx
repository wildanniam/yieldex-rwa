import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { getListingDetail } from '@/components/marketplace/listing-detail-adapter';
import { BuyModal } from '@/components/marketplace/buy-modal';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

const terms = [
  ['Backing locked', 'backing', 'backingNote'],
  ['Income sold', 'incomeSold', 'incomeSoldNote'],
  ['Period', 'period', 'periodNote'],
  ['Payout form', 'payout', 'payoutNote'],
  ['Fixed price', 'price', 'priceNote'],
  ['Deadline', 'deadline', null],
] as const;

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const { id } = await params;
  const result = getListingDetail(id);

  if (result.status === 'unavailable') {
    notFound();
  }

  const listing = result.view;

  return (
    <div className="min-w-0">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-3 text-sm"
      >
        <Link className="text-text-3 hover:text-text-1" href="/marketplace">
          Marketplace
        </Link>
        <Icon alt="" name="chevron-right" size={16} />
        <span className="text-text-1">{listing.id}</span>
      </nav>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-3xl bg-linear-to-r from-purple-3 via-purple-2 to-purple-1 p-6 text-white">
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[#10162B]">
                <Icon alt="" name="layers" size={26} />
              </span>
              <div className="min-w-0">
                <h2 className="text-3xl font-semibold">{listing.title}</h2>
                <p className="mt-1 text-sm text-white/80">
                  Listing {listing.id} · {listing.status}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-white/80">
              <span>Demo contract · example address</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#3840A2] px-3 py-2 text-white">
                {listing.contractAddress}
                <button aria-label="Copy contract address" type="button">
                  <Icon alt="" name="copy" size={16} />
                </button>
                <button aria-label="Open contract address" type="button">
                  <Icon alt="" name="external-link" size={16} />
                </button>
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-[#50555566] bg-card p-6">
            <h2 className="text-xl font-medium">Contract terms</h2>
            <dl className="mt-4 grid grid-cols-3 gap-x-8 gap-y-5">
              {terms.map(([label, valueKey, noteKey], index) => (
                <div key={label} className="contents">
                  <div className="pb-4">
                    <dt className="text-xs text-text-2">{label}</dt>
                    <dd className="mt-1 text-base text-text-1">
                      {listing[valueKey]}
                    </dd>
                    {noteKey && (
                      <p className="mt-1 text-xs text-text-2">
                        {listing[noteKey]}
                      </p>
                    )}
                  </div>
                  {index === 2 && (
                    <div
                      aria-hidden="true"
                      className="col-span-3 border border-[#50555566]"
                    />
                  )}
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-[#50555566] bg-card p-6">
            <h2 className="text-xl font-medium">How income is calculated</h2>
            <div className="mt-5 grid gap-4 border-b border-[#50555566] pb-5 sm:grid-cols-4">
              {(
                [
                  ['Purchase', 'wallet'],
                  ['Income events allocated', 'coins'],
                  ['Deadline', 'clock'],
                  ['Settlement', 'check-circle'],
                ] satisfies [string, IconName][]
              ).map(([step, iconName]) => (
                <div
                  key={step}
                  className="flex items-center gap-2 text-sm text-text-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tint text-green-text">
                    <Icon alt="" inheritColor name={iconName} size={18} />
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-text-2">
              <li>Events inside the period are split 50/50.</li>
              <li>
                Price rises, direct transfers and splits are never counted as
                dividends.
              </li>
              <li>Allocated claims stay claimable after the deadline.</li>
            </ul>
            <p className="mt-4 text-xs text-text-2">
              Settlement does not refund principal or automatically pay claims.
              Claiming is a separate action.
            </p>
          </section>

          <section className="rounded-2xl border border-[#50555566] bg-card p-6">
            <h2 className="text-xl font-medium">
              Illustrative income scenarios
            </h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-raised text-xs text-text-2">
                  <tr>
                    <th className="p-4 font-normal">Total income</th>
                    <th className="p-4 font-normal">Buyer value · 50%</th>
                    <th className="p-4 font-normal">Result after price</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['$200', '$100', '+$10 (+11.11%)', 'text-green-1'],
                    ['$100', '$50', '-$40 (-44.44%)', 'text-danger'],
                    ['$0', '$0', '-$90 (-100%)', 'text-danger'],
                  ].map(([total, buyer, resultText, color]) => (
                    <tr key={total} className="border-t border-border">
                      <td className="p-4">{total}</td>
                      <td className="p-4">{buyer}</td>
                      <td className={`p-4 ${color}`}>{resultText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-green-1/40 bg-card p-6 xl:sticky xl:top-24">
          <h2 className="text-xl font-medium">Buy this offer</h2>
          <p className="mt-5 text-xs text-text-2">Price</p>
          <p className="mt-1 text-3xl text-text-1">{listing.price}</p>
          <p className="mt-2 text-xs text-text-2">
            Fixed upfront payment · not an income estimate
          </p>
          <div className="my-5 border-t border-[#50555566] pt-4">
            <p className="text-sm text-text-1">Estimated income</p>
            <p className="mt-2 text-2xl text-purple-1">{listing.estimate}</p>
            <p className="mt-2 text-xs text-text-2">
              Estimate · about $100 illustrative equivalent
            </p>
            <p className="mt-2 text-xs text-text-2">{listing.snapshotLabel}</p>
          </div>
          <div className="border-y border-[#50555566] py-4">
            <p className="text-sm text-text-2">Network fee</p>
            <p className="mt-2 text-lg">{listing.networkFee}</p>
            <p className="mt-1 text-xs text-text-2">
              Paid separately in ETH · simulated fee
            </p>
          </div>
          <div className="mt-5 rounded-xl border border-border p-1">
            <div className="flex gap-1 text-xs">
              <button
                className="flex-1 rounded-full bg-tint px-3 py-2 text-green-text"
                type="button"
              >
                Pay with DemoUSD
              </button>
              <button className="flex-1 px-2 py-2 text-text-2" type="button">
                Swap from another token
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm">Your balance 1,000 DemoUSD</p>
          <p className="mt-2 text-xs leading-5 text-text-2">
            Direct DemoUSD payment: no swap fee. Alternative token swap only:
            0.30% swap fee, separate from network gas.
          </p>
          <BuyModal listingId={listing.id} seller={listing.seller} />
          <Button className="mt-2 w-full" disabled size="lg" variant="outline">
            Ask AI to explain
          </Button>
        </aside>
      </div>
    </div>
  );
}
