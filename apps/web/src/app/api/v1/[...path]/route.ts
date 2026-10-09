import { randomUUID } from 'node:crypto';
import { apiError, clientBucket, RequestBudget } from '../../../../server/http';
import { transactionStatus } from '../../../../server/transactions/status';
import { ApiFailure } from '../../../../server/http';
import { marketContext } from '../../../../server/market/context';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(60);
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const id = randomUUID();
  try {
    budget.take(clientBucket(request));
    const { path } = await context.params;
    const { reads, reader } = await marketContext();
    if (
      path.length === 4 &&
      path[0] === 'chains' &&
      path[2] === 'transactions'
    ) {
      if (path[1] !== String(reader.manifest.chainId))
        throw new ApiFailure(
          400,
          'UNSUPPORTED_DEPLOYMENT',
          'Chain tidak didukung.',
        );
      if (new URL(request.url).search)
        throw new ApiFailure(400, 'VALIDATION_ERROR', 'Query tidak didukung.');
      const data = await transactionStatus(reader, path[3]!);
      return Response.json(
        {
          meta: {
            schemaVersion: '1.0',
            requestId: id,
            observedAt: Math.floor(Date.now() / 1000),
          },
          data,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const result = await reads.read(
      path,
      new URL(request.url).searchParams,
      id,
    );
    return Response.json(result, {
      headers: { 'Cache-Control': 'public, max-age=10' },
    });
  } catch (e) {
    return apiError(e, id);
  }
}
