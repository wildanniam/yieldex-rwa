import { Metadata } from 'next';

import { ClaimsClient } from './ClaimsClient';

export const metadata: Metadata = {
  title: 'Claims | Yieldex',
  description: 'Claim your yields and dividends from RWA assets.',
};

export default function ClaimsPage() {
  return <ClaimsClient />;
}
