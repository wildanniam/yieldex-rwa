import { describe, expect, it } from 'vitest';
import { Web3Sessions } from './service';

// Construction must reject unsupported origins before any database/provider work.
const database = (() => {
  throw new Error('Unexpected database call');
}) as unknown as ConstructorParameters<typeof Web3Sessions>[0];
const create = (origin: string) =>
  new Web3Sessions(database, {
    url: 'http://localhost:54321',
    key: 'test-only',
    chainId: 11155111,
    origin,
  });

describe('SIWE application origin', () => {
  it.each(['http://127.0.0.1:3017', 'https://127.0.0.1', 'https://[::1]'])(
    'rejects IP domain %s before asking for a signature',
    (origin) => {
      expect(() => create(origin)).toThrow(
        expect.objectContaining({ status: 503, code: 'AUTH_UNAVAILABLE' }),
      );
    },
  );
  it('accepts localhost previews and HTTPS named deployments with strict origin binding', () => {
    for (const origin of ['http://localhost:3017', 'https://yieldex.example']) {
      const service = create(origin);
      expect(() => service.assertOrigin(origin)).not.toThrow();
      expect(() => service.assertOrigin('https://other.example')).toThrow();
    }
    expect(() => create('http://yieldex.example')).toThrow();
    expect(() => create('https://yieldex.example/path')).toThrow();
  });
});
