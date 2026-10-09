import { describe, expect, it } from 'vitest';
import { databaseOptions as web } from '../../apps/web/src/server/database';
import { databaseOptions as worker } from '../../apps/worker/src/database';

for (const [name, options] of [
  ['web', web],
  ['worker', worker],
] as const) {
  describe(name + ' database TLS boundary', () => {
    it('requires a CA for a remote pool and never disables verification', () => {
      const url = 'postgresql://user:fixture@pool.example.test:6543/postgres';
      expect(() => options(url, '')).toThrow('Hosted database CA');
      expect(options(url, 'fixture-public-ca').ssl).toEqual({
        rejectUnauthorized: true,
        ca: 'fixture-public-ca',
      });
      expect(options(url, 'fixture-public-ca').prepare).toBe(false);
    });
    it('keeps isolated local tests available and rejects malformed URLs', () => {
      expect(
        options('postgresql://postgres:fixture@127.0.0.1:54322/postgres', '')
          .ssl,
      ).toBe(false);
      expect(() => options('invalid', '')).toThrow();
    });
  });
}
