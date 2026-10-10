import { describe, expect, it } from 'vitest';
import {
  initialSellDraft,
  sellAssets,
  sellDraftReducer,
  validateSellDraft,
} from './sell-draft';

describe('sell presentation draft boundaries', () => {
  it('uses registered token identities and keeps exact atomic precision', () => {
    expect(sellAssets.map((asset) => asset.symbol)).toEqual([
      'demoAAPL',
      'demoMSFT',
      'demoSPY',
    ]);
    const result = validateSellDraft({
      ...initialSellDraft,
      amount: '0.000000000000000001',
      price: '0.000001',
    });
    expect(result.errors).toEqual({});
    expect(result.amountAtomic).toBe(1n);
    expect(result.priceAtomic).toBe(1n);
  });

  it.each([
    '',
    '0',
    '-1',
    '1e2',
    'NaN',
    'Infinity',
    '1,2',
    '.5',
    '1.',
    '0.0000000000000000001',
    '100.000000000000000001',
  ])('rejects invalid or excessive backing %s without rounding it', (amount) =>
    expect(
      validateSellDraft({ ...initialSellDraft, amount }).errors.amount,
    ).toBeTruthy(),
  );

  it.each(['0', '-0.1', '90 DemoUSD', '0.0000001', '1e30', '9'.repeat(100)])(
    'rejects invalid price %s',
    (price) =>
      expect(
        validateSellDraft({ ...initialSellDraft, price }).errors.price,
      ).toBeTruthy(),
  );

  it('uses the newly selected asset balance instead of the previous asset', () => {
    const microsoft = sellDraftReducer(initialSellDraft, {
      type: 'edit',
      values: { symbol: 'demoMSFT' },
    });
    expect(validateSellDraft(microsoft).errors.amount).toContain('40 demoMSFT');
    expect(validateSellDraft({ ...microsoft, amount: '40' }).errors).toEqual(
      {},
    );
  });

  it('validates period and full income range without inventing calendar months', () => {
    expect(
      validateSellDraft({
        ...initialSellDraft,
        incomeShare: 100,
        durationDays: 365,
      }).errors,
    ).toEqual({});
    expect(
      validateSellDraft({
        ...initialSellDraft,
        incomeShare: 0,
        durationDays: 366,
      }).errors,
    ).toEqual({
      incomeShare: expect.any(String),
      durationDays: expect.any(String),
    });
  });

  it('blocks invalid backing, recovers after edit, and preserves values when returning', () => {
    let draft = { ...initialSellDraft, step: 1, amount: '-10' };
    draft = sellDraftReducer(draft, { type: 'advance' });
    expect(draft.step).toBe(1);
    expect(draft.showErrors).toBe(true);
    draft = sellDraftReducer(draft, {
      type: 'edit',
      values: { amount: '75.25' },
    });
    draft = sellDraftReducer(draft, { type: 'advance' });
    expect(draft.step).toBe(2);
    draft = sellDraftReducer(draft, { type: 'back', step: 1 });
    expect(draft.amount).toBe('75.25');
    expect(draft.showErrors).toBe(false);
  });

  it('requires acknowledgement for review and invalidates it after financial edits', () => {
    let draft = { ...initialSellDraft, step: 3 };
    expect(sellDraftReducer(draft, { type: 'advance' }).step).toBe(3);
    draft = sellDraftReducer(draft, { type: 'acknowledge', value: true });
    expect(sellDraftReducer(draft, { type: 'advance' }).step).toBe(4);
    for (const values of [
      { price: '91' },
      { amount: '99' },
      { incomeShare: 75 },
      { durationDays: 90 },
      { symbol: 'demoSPY' as const },
    ]) {
      expect(
        sellDraftReducer(draft, { type: 'edit', values }).acknowledged,
      ).toBe(false);
    }
  });

  it('caps the preview at ready and prevents skipping forward', () => {
    expect(
      sellDraftReducer(initialSellDraft, { type: 'back', step: 3 }).step,
    ).toBe(0);
    expect(
      sellDraftReducer(initialSellDraft, { type: 'back', step: -1 }).step,
    ).toBe(0);
    const ready = { ...initialSellDraft, step: 4, acknowledged: true };
    expect(sellDraftReducer(ready, { type: 'advance' }).step).toBe(4);
    expect(sellDraftReducer(ready, { type: 'reset' })).toEqual(
      initialSellDraft,
    );
  });
});
