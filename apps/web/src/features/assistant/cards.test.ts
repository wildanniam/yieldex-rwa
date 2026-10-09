import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { amount, parseCard } from './cards';
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../../../examples/${name}`, import.meta.url),
      'utf8',
    ),
  );
it('formats atomic amounts exactly and rejects malformed financial cards', () => {
  expect(
    amount('1000000000000000000001', { decimals: 18, symbol: 'ETH' }),
  ).toBe('1000.000000000000000001 ETH');
  expect(amount(null, { decimals: 6, symbol: 'USDC' })).toBe('Belum tersedia');
  expect(parseCard('thread', 'tool', 'not JSON')).toBeNull();
  expect(
    parseCard(
      'thread',
      'tool',
      JSON.stringify({
        kind: 'QUOTE_COMPARISON',
        payload: { routes: [{ price: 5 }] },
      }),
    ),
  ).toBeNull();
  const c = fixture('purchase-card.valid.json');
  const a = parseCard(
    'thread',
    'tool',
    JSON.stringify({ kind: c.kind, payload: c.payload }),
  );
  const b = parseCard(
    'thread',
    'tool',
    JSON.stringify({ kind: c.kind, payload: c.payload }),
  );
  expect(a).not.toBeNull();
  expect(a?.cardId).toBe(b?.cardId);
  const bad = fixture('purchase-card-other-action.invalid.json');
  expect(
    parseCard(
      'thread',
      'tool',
      JSON.stringify({ kind: bad.kind, payload: bad.payload }),
    ),
  ).toBeNull();
});
