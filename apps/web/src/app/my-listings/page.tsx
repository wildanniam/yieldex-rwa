import { Metadata } from 'next';
import { MyListingsClient } from './MyListingsClient';

export const metadata: Metadata = {
  title: 'My Listings | Yieldex',
  description: 'Manage your RWA income right listings.',
};

export default function MyListingsPage() {
  return <MyListingsClient />;
}
