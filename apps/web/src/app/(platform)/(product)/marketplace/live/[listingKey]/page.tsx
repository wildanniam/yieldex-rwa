import { redirect, notFound } from 'next/navigation';
import { listingHref, routeKey } from '@/features/marketplace/data';
export default async function LegacyLiveListingPage({
  params,
}: {
  params: Promise<{ listingKey: string }>;
}) {
  const { listingKey } = await params;
  const key = routeKey(listingKey);
  if (!key) notFound();
  redirect(listingHref(key));
}
