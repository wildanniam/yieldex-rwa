import { Metadata } from 'next';
import { MyPositionsClient } from './MyPositionsClient';

export const metadata: Metadata = {
  title: 'My Positions | Yieldex',
  description: 'Manage your RWA income right positions.',
};

export default function MyPositionsPage() {
  return <MyPositionsClient />;
}
