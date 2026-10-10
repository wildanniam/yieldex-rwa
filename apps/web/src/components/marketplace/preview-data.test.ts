import { describe, expect, it } from 'vitest';
import {
  filterPreviewListings,
  formatAtomic,
  getPreviewListing,
  incomePercent,
  paginatePreviewListings,
  previewListings,
  termLabel,
} from './preview-data';

describe('marketplace preview data and controls', () => {
  it('keeps every card and detail tied to one offer, using supported simulated assets', () => {
    expect(new Set(previewListings.map((item) => item.id)).size).toBe(
      previewListings.length,
    );
    for (const item of previewListings) {
      expect(getPreviewListing(item.id)).toBe(item);
      expect(['demoAAPL', 'demoMSFT', 'demoSPY']).toContain(item.symbol);
      expect(BigInt(item.priceAtomic)).toBeGreaterThan(0n);
      expect(item.incomeBps).toBeGreaterThan(0);
      expect(item.incomeBps).toBeLessThanOrEqual(10000);
    }
    expect(getPreviewListing('unknown')).toBeUndefined();
    expect(getPreviewListing('__proto__')).toBeUndefined();
    expect(getPreviewListing('L-0142/anything')).toBeUndefined();
  });

  it('combines case-insensitive search with market filtering and returns an honest empty result', () => {
    expect(
      filterPreviewListings({
        search: '  microsoft ',
        market: 'SECONDARY',
      }).map((item) => item.id),
    ).toEqual(['L-0212']);
    expect(
      filterPreviewListings({ search: 'l-0144' }).map((item) => item.symbol),
    ).toEqual(['demoSPY']);
    expect(
      filterPreviewListings({ search: 'Alice' }).map((item) => item.id),
    ).toEqual(['L-0142']);
    expect(filterPreviewListings({ search: 'NVDA' })).toEqual([]);
    expect(filterPreviewListings({ market: 'PRIMARY' })).toHaveLength(5);
    expect(filterPreviewListings({ market: 'SECONDARY' })).toHaveLength(3);
  });

  it('orders actual prices and terms without mutating the source data', () => {
    const before = previewListings.map((item) => item.id);
    const priced = filterPreviewListings({ sort: 'PRICE_ASC' });
    expect(priced.map((item) => item.id)).toEqual([
      'L-0211',
      'L-0213',
      'L-0214',
      'L-0142',
      'L-0212',
      'L-0215',
      'L-0144',
      'L-0143',
    ]);
    expect(filterPreviewListings({ sort: 'DURATION_ASC' })[0]?.id).toBe(
      'L-0211',
    );
    expect(
      filterPreviewListings({ sort: 'DURATION_ASC' }).map(
        (item) => item.termDays,
      ),
    ).toEqual([42, 67, 90, 90, 95, 180, 180, 180]);
    expect(previewListings.map((item) => item.id)).toEqual(before);
    expect(filterPreviewListings()[0]?.id).toBe('L-0142');
  });

  it('clamps pages after a filter narrows the result and preserves complete pagination', () => {
    const all = filterPreviewListings();
    const first = paginatePreviewListings(all, 1);
    const second = paginatePreviewListings(all, 2);
    expect([...first.items, ...second.items]).toEqual(all);
    expect(first.items).toHaveLength(6);
    expect(second.items).toHaveLength(2);
    expect(
      paginatePreviewListings(filterPreviewListings({ market: 'SECONDARY' }), 2)
        .currentPage,
    ).toBe(1);
    expect(paginatePreviewListings([], 5)).toEqual({
      currentPage: 1,
      totalPages: 1,
      items: [],
    });
  });

  it('formats token amounts exactly beyond JavaScript safe integers and labels resale terms', () => {
    expect(formatAtomic('9007199254740993123456', 6)).toBe(
      '9,007,199,254,740,993.12',
    );
    expect(formatAtomic('100000000000000000000', 18, 0)).toBe('100');
    expect(formatAtomic('1', 6, 6)).toBe('0.000001');
    expect(incomePercent(5025)).toBe('50.25');
    expect(incomePercent(5000)).toBe('50');
    expect(termLabel(getPreviewListing('L-0142')!)).toBe('180 days');
    expect(termLabel(getPreviewListing('L-0211')!)).toBe('42 days left');
  });
});
