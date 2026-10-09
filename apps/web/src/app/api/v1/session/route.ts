import { randomUUID } from 'node:crypto';
import { authContext } from '../../../../server/auth/context';
import { apiError } from '../../../../server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const id = randomUUID();
  try {
    const { session } = await authContext(),
      { verified } = await session();
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId: id,
          observedAt: Math.floor(Date.now() / 1000),
        },
        data: verified,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e, id);
  }
}
export async function DELETE(request: Request) {
  const id = randomUUID();
  try {
    const { service, client, session } = await authContext();
    service.assertOrigin(request.headers.get('origin'));
    const { accessToken } = await session();
    await service.revoke(accessToken);
    await client.auth.signOut({ scope: 'local' });
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return apiError(e, id);
  }
}
