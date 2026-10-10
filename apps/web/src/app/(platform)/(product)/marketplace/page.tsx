import type { Metadata } from 'next';
import { Marketplace } from '@/components/marketplace/marketplace';

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Explore time-limited income rights on Yieldex.',
};

export default function MarketplacePage() {
  return <Marketplace />;
}
