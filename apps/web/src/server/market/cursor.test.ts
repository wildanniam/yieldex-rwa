import { expect, it } from 'vitest';
import { Cursors, queryHash } from './cursor';
import { RequestBudget, boundedJson, apiError, ApiFailure } from '../http';
it('signed cursor binds filter and snapshot, rejects tampering, and expires exactly', () => {
  let now = 1000;
  const c = new Cursors('a'.repeat(32), () => now),
    hash = queryHash(['PRICE_ASC', '100']);
  const p = {
    v: 1 as const,
    queryHash: hash,
    blockNumber: '123',
    blockHash: '0x' + 'ab'.repeat(32),
    key: ['2', '10'],
    id: '10',
    expiresAt: 1300,
  };
  const token = c.encode(p);
  expect(c.decode(token, hash)).toEqual(p);
  expect(() => c.decode(token + 'x', hash)).toThrow();
  expect(() => c.decode(token, queryHash(['NEWEST']))).toThrow();
  expect(() => new Cursors('b'.repeat(32)).decode(token, hash)).toThrow();
  now = 1300;
  expect(() => c.decode(token, hash)).toThrow('kedaluwarsa');
});
it('bounded JSON rejects oversized, non-JSON, malformed and execution-shaped input stays for strict schema rejection', async () => {
  await expect(
    boundedJson(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'x'.repeat(65537),
      }),
    ),
  ).rejects.toThrow('besar');
  await expect(
    boundedJson(
      new Request('http://localhost', { method: 'POST', body: '{}' }),
    ),
  ).rejects.toThrow('JSON');
  await expect(
    boundedJson(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
    ),
  ).rejects.toThrow('valid');
});
it('request budget holds repeated callers and errors never expose raw exception content', async () => {
  let now = 0;
  const b = new RequestBudget(2, () => now);
  b.take('A');
  b.take('A');
  expect(() => b.take('A')).toThrow();
  b.take('B');
  now = 60000;
  expect(() => b.take('A')).not.toThrow();
  expect(
    JSON.stringify(await apiError(new Error('secret-key database-url')).json()),
  ).not.toContain('secret-key');
  expect(
    apiError(new ApiFailure(429, 'RATE_LIMITED', 'Wait', 60)).headers.get(
      'retry-after',
    ),
  ).toBe('60');
});
