import { randomUUID } from 'node:crypto';
import { validateData } from '@rwa/shared/validation';
import { authContext } from '../../../../../server/auth/context';
import {
  ApiFailure,
  apiError,
  boundedJson,
  clientBucket,
  RequestBudget,
} from '../../../../../server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(10);
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    budget.take(clientBucket(request));
    const { service, store } = await authContext();
    service.assertOrigin(request.headers.get('origin'));
    const input = validateData(
      'api.AuthChallengeRequest',
      await boundedJson(request),
    );
    if (!input.success)
      throw new ApiFailure(
        400,
        'VALIDATION_ERROR',
        'Alamat wallet tidak valid.',
      );
    const data = await service.challenge(input.data.walletAddress);
    store.set('rwa_auth_challenge', data.challengeId, {
      httpOnly: true,
      secure: service.config.origin.startsWith('https:'),
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 300,
    });
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId,
          observedAt: Math.floor(Date.now() / 1000),
        },
        data,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e, requestId);
  }
}
