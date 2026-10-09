import { randomUUID } from 'node:crypto';
import type { ErrorEnvelope } from '@rwa/shared';
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
  }
}
export function apiError(error: unknown, requestId = randomUUID()) {
  const e =
    error instanceof ApiFailure
      ? error
      : new ApiFailure(
          503,
          'SERVICE_UNAVAILABLE',
          'Layanan belum tersedia. Coba lagi.',
        );
  const body: ErrorEnvelope = {
    schemaVersion: '1.0',
    requestId,
    error: {
      code: e.code,
      message: e.message,
      retryable: e.status === 429 || e.status >= 500,
      retryAfterSeconds: e.retryAfterSeconds,
      details: [],
    },
  };
  return Response.json(body, {
    status: e.status,
    headers: {
      'Cache-Control': 'no-store',
      ...(e.retryAfterSeconds !== null
        ? { 'Retry-After': String(e.retryAfterSeconds) }
        : {}),
    },
  });
}
export async function boundedJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new ApiFailure(400, 'VALIDATION_ERROR', 'Gunakan JSON.');
  const body = request.body?.getReader();
  if (!body) throw new ApiFailure(400, 'VALIDATION_ERROR', 'Body kosong.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await body.read();
    if (done) break;
    length += value.length;
    if (length > 65536) {
      await body.cancel();
      throw new ApiFailure(413, 'VALIDATION_ERROR', 'Body terlalu besar.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiFailure(400, 'VALIDATION_ERROR', 'JSON tidak valid.');
  }
}
/** Single-process hackathon budget. Untrusted proxy headers cannot create new buckets.
 * Enable trusted header only behind an edge that overwrites it; multi-instance needs shared storage.
 */
export class RequestBudget {
  private buckets = new Map<string, { start: number; count: number }>();
  constructor(
    readonly limit: number,
    readonly now = () => Date.now(),
  ) {}
  take(key: string) {
    const now = this.now();
    let b = this.buckets.get(key);
    if (!b || now - b.start >= 60000) {
      if (this.buckets.size >= 5000) this.buckets.clear();
      b = { start: now, count: 0 };
      this.buckets.set(key, b);
    }
    if (++b.count > this.limit)
      throw new ApiFailure(
        429,
        'RATE_LIMITED',
        'Terlalu banyak permintaan.',
        Math.max(1, Math.ceil((b.start + 60000 - now) / 1000)),
      );
  }
}
export function clientBucket(request: Request) {
  return process.env.TRUST_PROXY_IP_HEADER === '1'
    ? (request.headers.get('x-real-ip') ?? 'anonymous')
    : 'shared-local';
}
