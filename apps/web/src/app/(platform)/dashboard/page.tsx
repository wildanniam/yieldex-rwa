import type { Metadata } from 'next';
import { PortfolioDashboard } from '@/components/dashboard/dashboard';

export const metadata: Metadata = {
  title: 'My Portfolio',
  description:
    'Yieldex portfolio dashboard preview: income rights, backing and claims.',
};
export default function DashboardPage() {
  return <PortfolioDashboard />;
}
