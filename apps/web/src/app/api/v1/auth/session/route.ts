import { randomUUID } from 'node:crypto';
import { validateData } from '@rwa/shared/validation';
import type { Hex } from 'viem';
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
    const { service, store, client } = await authContext();
    service.assertOrigin(request.headers.get('origin'));
    const input = validateData(
      'api.AuthExchangeRequest',
      await boundedJson(request),
    );
    if (!input.success)
      throw new ApiFailure(400, 'VALIDATION_ERROR', 'Challenge tidak valid.');
    const session = await service.exchange(
      input.data.challengeId,
      input.data.signature as Hex,
      store.get('rwa_auth_challenge')?.value,
    );
    const { error } = await client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (error)
      throw new ApiFailure(
        503,
        'AUTH_UNAVAILABLE',
        'Session belum dapat disimpan; login ulang.',
      );
    store.set('rwa_auth_challenge', '', {
      path: '/api/v1/auth',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'strict',
    });
    const data = await service.verify(session.access_token);
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
