import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');
const adapterSource = readFileSync(
  resolve(
    __dirname,
    '../../../components/marketplace/listing-detail-adapter.ts',
  ),
  'utf8',
);
const topBarSource = readFileSync(
  resolve(__dirname, '../../../components/navigation/app-top-bar.tsx'),
  'utf8',
);
const modalSource = readFileSync(
  resolve(__dirname, '../../../components/marketplace/buy-modal.tsx'),
  'utf8',
);

describe('listing detail screen contracts', () => {
  it('renders the requested detail anatomy and disclosures', () => {
    expect(topBarSource).toContain("'Listing Detail'");
    expect(routeSource).toContain('How income is calculated');
    expect(routeSource).toContain('Illustrative income scenarios');
    expect(routeSource).toContain('Buy this offer');
    expect(modalSource).toContain('Buy income rights');
    expect(routeSource).toContain('No promised returns');
    expect(routeSource).toContain('Purchase');
    expect(routeSource).toContain('Settlement');
  });

  it('uses the canonical detail boundary and explicit unavailable state', () => {
    expect(adapterSource).toContain('ListingResponse');
    expect(adapterSource).toContain('ListingDetail');
    expect(adapterSource).toContain("status: 'unavailable'");
    expect(adapterSource).toContain('Listing ${id} is unavailable.');
  });
});
