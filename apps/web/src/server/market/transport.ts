import { fallback, http } from 'viem';

/** Only transport failures may switch providers; contract errors remain authoritative. */
function transient(error: unknown): boolean {
  let current = error;
  for (let i = 0; i < 6 && current && typeof current === 'object'; i++) {
    const e = current as {
      status?: number;
      code?: number;
      name?: string;
      cause?: unknown;
    };
    if (
      e.status === 429 ||
      e.status === 408 ||
      (e.status !== undefined && e.status >= 500) ||
      e.code === -32005 ||
      e.name === 'TimeoutError'
    )
      return true;
    current = e.cause;
  }
  return false;
}

/** Bounded retry for transient reads, with an optional same-chain backup. */
export function marketTransport(
  url: string,
  fetchFn: typeof fetch = fetch,
  backupUrl?: string,
) {
  const provider = (endpoint: string, retryCount: number) =>
    http(endpoint, {
      batch: { batchSize: 20, wait: 20 },
      retryCount,
      retryDelay: 500,
      timeout: 8000,
      fetchFn,
    });
  if (!backupUrl || backupUrl === url) return provider(url, 2);
  return fallback([provider(url, 0), provider(backupUrl, 1)], {
    rank: false,
    retryCount: 0,
    shouldThrow: (error) => !transient(error),
  });
}
