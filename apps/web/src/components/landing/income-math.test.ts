import { describe, expect, it } from 'vitest';
import { fixedHundredths, incomeScenario } from './income-math';

describe('illustrative income valuation', () => {
  it.each([
    [20000n, 10000n, 1000n, 1111n],
    [10000n, 5000n, -4000n, -4444n],
    [0n, 0n, -9000n, -10000n],
  ])(
    'values income %s at 50% without refunding the price',
    (income, buyer, net, roi) => {
      expect(incomeScenario(income, 5000n)).toEqual({
        buyerCents: buyer,
        sellerCents: income - buyer,
        netCents: net,
        returnBps: roi,
      });
    },
  );
  it('keeps the full purchase loss at zero income for every slider step', () => {
    for (let share = 1000n; share <= 9000n; share += 1000n) {
      const value = incomeScenario(0n, share);
      expect(value.buyerCents).toBe(0n);
      expect(value.netCents).toBe(-9000n);
      expect(value.returnBps).toBe(-10000n);
    }
  });
  it('handles break-even and share endpoints', () => {
    expect(incomeScenario(10000n, 9000n).netCents).toBe(0n);
    expect(incomeScenario(20000n, 1000n).buyerCents).toBe(2000n);
    expect(incomeScenario(20000n, 9000n).netCents).toBe(9000n);
  });
  it('conserves cents and keeps precision above Number.MAX_SAFE_INTEGER', () => {
    for (const income of [1n, 101n, 90071992547409931n]) {
      const value = incomeScenario(income, 3333n);
      expect(value.buyerCents + value.sellerCents).toBe(income);
      expect(value.buyerCents * 10000n).toBeLessThanOrEqual(income * 3333n);
      expect((value.buyerCents + 1n) * 10000n).toBeGreaterThan(income * 3333n);
    }
  });
  it('rejects invalid shares and negative income', () => {
    for (const [income, share] of [
      [-1n, 5000n],
      [10000n, -1n],
      [10000n, 10001n],
    ])
      expect(() => incomeScenario(income!, share!)).toThrow(RangeError);
  });
  it('formats cents and signed basis points without floating-point rounding', () => {
    expect(fixedHundredths(0n)).toBe('0.00');
    expect(fixedHundredths(1111n)).toBe('11.11');
    expect(fixedHundredths(-4444n)).toBe('−44.44');
    expect(fixedHundredths(-1n)).toBe('−0.01');
  });
});
