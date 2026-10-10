import { describe, expect, it } from 'vitest';
import { initialSellDraft, validateSellDraft } from './sell-draft';
const context = {
  decimals: 18,
  paymentDecimals: 6,
  balance: '2000000000000000000',
};
const draft = {
  ...initialSellDraft,
  amount: '1.000000000000000001',
  price: '0.000001',
};
describe('canonical sell validation', () => {
  it('starts without fabricated balances, amounts or prices', () => {
    expect(initialSellDraft.amount).toBe('');
    expect(initialSellDraft.price).toBe('');
    expect(
      validateSellDraft(initialSellDraft, context).errors.amount,
    ).toBeTruthy();
  });
  it('preserves atomic precision and allows exact available balance', () => {
    expect(validateSellDraft(draft, context)).toMatchObject({
      amountAtomic: '1000000000000000001',
      priceAtomic: '1',
      errors: {},
    });
    expect(
      validateSellDraft({ ...draft, amount: '2' }, context).errors,
    ).toEqual({});
    expect(
      validateSellDraft({ ...draft, amount: '2.000000000000000001' }, context)
        .errors.amount,
    ).toContain('exceeds');
  });
  it('does not round or assume zero when the balance is unavailable', () => {
    expect(
      validateSellDraft(draft, { ...context, balance: null }).errors.amount,
    ).toContain('unavailable');
    for (const amount of [
      '0',
      '-1',
      '1e2',
      '0.0000000000000000001',
      '1.1.1',
      ' ',
    ])
      expect(
        validateSellDraft({ ...draft, amount }, context).errors.amount,
      ).toBeTruthy();
    expect(
      validateSellDraft({ ...draft, price: '0.0000001' }, context).errors.price,
    ).toBeTruthy();
  });
  it('rejects unsupported period and fractional/out-of-range percent', () => {
    for (const incomeShare of [0, 101, 1.01])
      expect(
        validateSellDraft({ ...draft, incomeShare }, context).errors
          .incomeShare,
      ).toBeTruthy();
    expect(
      validateSellDraft({ ...draft, durationDays: 2 }, context).errors
        .durationDays,
    ).toBeTruthy();
  });
});
