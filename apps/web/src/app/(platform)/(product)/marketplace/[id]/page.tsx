import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingDetail } from '@/components/marketplace/listing-detail';
import { getPreviewListing } from '@/components/marketplace/preview-data';

export const metadata: Metadata = { title: 'Income rights — Yieldex' };

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getPreviewListing(id);
  if (!listing) notFound();
  return <ListingDetail listing={listing} />;
}
