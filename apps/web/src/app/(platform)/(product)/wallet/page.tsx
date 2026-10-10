import Link from 'next/link';
import { marketContext } from '@/server/market/context';
import { WalletAccess } from '@/features/marketplace/wallet-access';

export const dynamic = 'force-dynamic';
export default async function WalletPage() {
  const context = await marketContext().catch(() => null);
  if (!context)
    return (
      <section>
        <h1>Wallet connection unavailable</h1>
        <p>Konfigurasi jaringan belum dapat diverifikasi. Coba lagi nanti.</p>
        <Link href="/chat">Back to assistant</Link>
      </section>
    );
  return <WalletAccess manifest={context.reader.manifest} />;
}
