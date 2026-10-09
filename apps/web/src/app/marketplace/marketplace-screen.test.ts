import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');
const cardSource = readFileSync(
  resolve(__dirname, '../../components/marketplace/asset-card.tsx'),
  'utf8',
);
const paginationSource = readFileSync(
  resolve(__dirname, '../../components/marketplace/marketplace-pagination.tsx'),
  'utf8',
);
const typesSource = readFileSync(
  resolve(__dirname, '../../components/marketplace/types.ts'),
  'utf8',
);
const adapterSource = readFileSync(
  resolve(__dirname, '../../components/marketplace/marketplace-adapter.ts'),
  'utf8',
);

describe('marketplace screen contracts', () => {
  it('renders the toolbar and six mock listing composition', () => {
    expect(routeSource).toContain('Primary offers');
    expect(routeSource).toContain('Resale');
    expect(routeSource).toContain('Search assets or listing IDs');
    expect(routeSource).toContain('Featured 6 of 16');
    expect(routeSource.match(/kind: '(?:PRIMARY|SECONDARY)'/g)).toHaveLength(
      12,
    );
    expect(routeSource).toContain('const listingsPerPage = 6');
    expect(routeSource).toContain(
      'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3',
    );
    expect(routeSource).toContain('MarketplacePagination');
    expect(routeSource).toContain('currentPage');
    expect(routeSource).toContain('totalPages');
    expect(routeSource).toContain('pageListings');
    expect(paginationSource).toContain('onPageChange');
    expect(paginationSource).toContain('Array.from({ length: totalPages }');
    expect(routeSource).toContain('leadingIcon="layout-grid"');
    expect(routeSource).toContain('leadingIcon="list"');
  });

  it('keeps asset card anatomy and simulated financial boundaries', () => {
    expect(cardSource).toContain('rounded-2xl');
    expect(cardSource).toContain('border-[#50555566]');
    expect(cardSource).toContain('bg-card');
    expect(cardSource).toContain('View offer');
    expect(cardSource).toContain('href={`/marketplace/${listing.id}`}');
    expect(cardSource).toContain('Simulated issuer feed');
    expect(cardSource).toContain('listing.kind &&');
    expect(cardSource).toContain('text-purple-1');
    expect(typesSource).toContain("kind: 'PRIMARY' | 'SECONDARY' | null");
    expect(typesSource).toContain('price: string');
    expect(typesSource).toContain('incomeShare: string');
    expect(paginationSource).toContain('Previous');
    expect(paginationSource).toContain('Next');
  });

  it('references the canonical generated API types', () => {
    expect(typesSource).toContain("from '@rwa/shared'");
    expect(typesSource).toContain('SearchListingsQuery');
    expect(typesSource).toContain('ListingsPage');
    expect(typesSource).toContain('ListingDetail');
    expect(adapterSource).toContain('normalizeListingsQuery');
    expect(adapterSource).toContain('Math.min(20');
    expect(adapterSource).toContain("status: 'unavailable'");
    expect(adapterSource).toContain('page: null');
  });
});
