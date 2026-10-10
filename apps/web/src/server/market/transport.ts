import { http } from 'viem';

/** Bounded retry for transient read failures; invalid RPC requests still fail. */
export function marketTransport(url: string, fetchFn: typeof fetch = fetch) {
  return http(url, {
    batch: { batchSize: 20, wait: 20 },
    retryCount: 2,
    retryDelay: 500,
    timeout: 8000,
    fetchFn,
  });
}
