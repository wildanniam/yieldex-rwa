import { marketContext } from '@/server/market/context';
import { MarketLab } from '@/features/marketplace/lab';
export const dynamic = 'force-dynamic';
export default async function LabPage() {
  const context = await marketContext().catch(() => null);
  if (!context)
    return (
      <main>
        <h1>Marketplace lab belum dikonfigurasi</h1>
        <p>
          Jalankan deployment lokal dan konfigurasi backend sesuai
          docs/local-core.md.
        </p>
      </main>
    );
  return <MarketLab manifest={context.reader.manifest} />;
}
