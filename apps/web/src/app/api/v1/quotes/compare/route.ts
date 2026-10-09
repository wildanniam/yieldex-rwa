import { randomUUID } from 'node:crypto';
import {
  ApiFailure,
  apiError,
  boundedJson,
  clientBucket,
  RequestBudget,
} from '../../../../../server/http';
import {
  QuoteService,
  parseQuoteRequest,
} from '../../../../../server/quotes/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(10);
const service = new QuoteService({ apiKey: process.env.ZEROX_API_KEY });
export async function POST(request: Request) {
  const id = randomUUID();
  try {
    budget.take(clientBucket(request));
    let input;
    try {
      input = parseQuoteRequest(await boundedJson(request));
    } catch (e) {
      if (e instanceof ApiFailure) throw e;
      throw new ApiFailure(
        400,
        'VALIDATION_ERROR',
        'Parameter quote tidak valid.',
      );
    }
    const data = await service.compare(input);
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId: id,
          observedAt: data.observedAt,
        },
        data,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e, id);
  }
}
