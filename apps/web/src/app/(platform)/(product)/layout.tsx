import Link from 'next/link';
import { PlatformShell } from '@/components/platform/shell';
import { PlatformProvider } from '@/features/marketplace/platform-provider';
import { marketContext } from '@/server/market/context';
export const dynamic = 'force-dynamic';

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await marketContext().catch(() => null);
  if (!context)
    return (
      <PlatformShell>
        <section role="alert">
          <h1>Connection unavailable</h1>
          <p>
            The marketplace configuration could not be verified. Reload to try
            again.
          </p>
          <Link href="/">Back to Yieldex</Link>
        </section>
      </PlatformShell>
    );
  return (
    <PlatformProvider manifest={context.reader.manifest}>
      <PlatformShell>{children}</PlatformShell>
    </PlatformProvider>
  );
}
