'use client';

import { useSearchParams } from 'next/navigation';
import { PlaceholderPage } from '../../components/PlaceholderPage';

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const created = searchParams.get('created') === 'simulated';

  return (
    <>
      {created && (
        <div
          aria-live="polite"
          className="mb-6 rounded-xl border border-green-1/40 bg-tint p-4 text-green-1"
          role="status"
        >
          Simulated listing created. No on-chain transaction was submitted.
        </div>
      )}
      <PlaceholderPage title="My Listings" />
    </>
  );
}
