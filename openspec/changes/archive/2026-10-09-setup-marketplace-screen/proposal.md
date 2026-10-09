## Why

The `/marketplace` route is currently only a placeholder, so the shared navigation has no representative product screen to exercise. The design requires a responsive listing discovery surface with primary/resale filters, search and sorting controls, reusable asset cards, and pagination.

## What Changes

- Build the main `/marketplace` page using the global `AppSidebar` and `AppTopBar` shell, with Marketplace active.
- Add reusable `AssetCard` presentation under `apps/web/src/components/marketplace/asset-card.tsx`.
- Render six mock listings split between primary offers and resales, with the required asset, seller, income, term, payout, price, disclaimer, and CTA content.
- Add toolbar controls for offer type, search, sort, grid/list view, and pagination using existing UI primitives and icons.
- Define the implementation API boundary against the root `schemas/api.schema.json` and `schemas/domain.schema.json` contracts so mock data can later be replaced by validated `ListingsPage` responses.
- Keep all displayed financial values explicitly simulated presentation data; no transaction, quote, or live market behavior is introduced.

## Capabilities

### New Capabilities
- `marketplace-screen`: Presentational listing discovery screen and reusable asset card.

### Modified Capabilities
None.

## Impact

- `apps/web/src/app/marketplace/page.tsx` becomes the marketplace screen.
- New `apps/web/src/components/marketplace/asset-card.tsx` component and focused UI tests.
- Existing navigation, shared `Button`, `SearchField`, `Select`, and `Icon` components are reused.
- The future read implementation uses `GET /api/v1/chains/{chainId}/markets/{marketAddress}/listings`, normalized as `SearchListingsQuery`, and validates the response as `ListingsPage` containing `ListingDetail` items.
- No wallet, contract, schema, accounting, or generated artifact changes.
