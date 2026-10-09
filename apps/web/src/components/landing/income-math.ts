// Illustrative valuation only. Never used for an onchain amount or a live quote.
export const SCENARIO_CENTS = [20000n, 10000n, 0n] as const;
export const PURCHASE_CENTS = 9000n;
export function incomeScenario(incomeCents: bigint, shareBps: bigint) {
  if (incomeCents < 0n || shareBps < 0n || shareBps > 10000n)
    throw new RangeError('Invalid illustrative income or share');
  const buyerCents = (incomeCents * shareBps) / 10000n;
  const sellerCents = incomeCents - buyerCents;
  const netCents = buyerCents - PURCHASE_CENTS;
  const returnBps = (netCents * 10000n) / PURCHASE_CENTS;
  return { buyerCents, sellerCents, netCents, returnBps };
}
export function fixedHundredths(value: bigint) {
  const abs = value < 0n ? -value : value;
  return `${value < 0n ? '−' : ''}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`;
}
