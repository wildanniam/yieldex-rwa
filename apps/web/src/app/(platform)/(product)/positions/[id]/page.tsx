import { routeKey } from '@/features/marketplace/data';
export const metadata = { title: 'Income position' };
import { notFound } from 'next/navigation';
import { marketContext } from '@/server/market/context';
import { PositionDetail } from '@/features/marketplace/position-detail';
export default async function PositionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = routeKey((await params).id);
  const context = await marketContext().catch(() => null);
  if (!context) return null;
  const m = context.reader.manifest;
  if (!id || !id.startsWith(`eip155:${m.chainId}:${m.market}:`)) notFound();
  return <PositionDetail key={id} positionKey={id} />;
}
