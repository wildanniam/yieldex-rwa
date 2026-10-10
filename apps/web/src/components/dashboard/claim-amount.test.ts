import { expect, it } from 'vitest';
import { claimAmount } from './claim-amount';
it('rounds display with explicit approximation without floating-point arithmetic', () => {
  expect(claimAmount('4999999999999999', 18)).toBe('≈ 0.005');
  expect(claimAmount('5000000000000000', 18)).toBe('0.005');
  expect(claimAmount('999999999999999999999999999', 18)).toBe('≈ 1000000000');
});
it('preserves zero, unavailable, tiny positives and low-decimal assets', () => {
  expect(claimAmount(null, 18)).toBe('Unavailable');
  expect(claimAmount('0', 18)).toBe('0');
  expect(claimAmount('1', 18)).toBe('< 0.000001');
  expect(claimAmount('1234567', 6)).toBe('1.234567');
});
