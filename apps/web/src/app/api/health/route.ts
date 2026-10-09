import { getWebHealth } from '../../../server/health';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(getWebHealth(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
