import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marketContext } from '@/server/market/context';
import { LiveListing } from '@/features/marketplace/live-listing';

export const dynamic = 'force-dynamic';
export default async function LiveListingPage({
  params,
}: {
  params: Promise<{ listingKey: string }>;
}) {
  const { listingKey } = await params;
  if (
    !/^eip155:(31337|11155111):0x[0-9a-f]{40}:[1-9][0-9]{0,77}$/.test(
      listingKey,
    )
  )
    notFound();
  const context = await marketContext().catch(() => null);
  if (!context)
    return (
      <section>
        <h1>Marketplace temporarily unavailable</h1>
        <p>Data belum dapat diverifikasi. Tidak ada transaksi yang dibuat.</p>
        <Link href="/chat">Back to assistant</Link>
      </section>
    );
  const m = context.reader.manifest;
  if (!listingKey.startsWith(`eip155:${m.chainId}:${m.market}:`)) notFound();
  return <LiveListing key={listingKey} manifest={m} listingKey={listingKey} />;
}
