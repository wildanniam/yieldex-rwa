## Why

The Marketplace screen now exposes `View offer` actions, but those actions do not lead to a detailed explanation of the selected income-rights listing. Users need one canonical detail route that explains the listing terms, calculation rules, illustrative outcomes, and the limits of the purchase action before they continue.

## What Changes

- Add a dynamic `/marketplace/[id]` route for listing detail screens inside the existing global navigation shell.
- Update `AssetCard` so its `View offer` action links to the selected listing identifier, such as `/marketplace/L-0142`.
- Render the supplied listing-detail information architecture: breadcrumb, contract banner, terms, calculation timeline, illustrative scenarios, and buy-offer sidebar.
- Define the detail read boundary against the canonical listing detail endpoint and shared `ListingResponse`/`ListingDetail` schemas.
- Keep displayed financial values explicitly illustrative or simulated until validated API data and wallet transaction preparation are available; the screen must not imply guaranteed income or completed purchase.

## Capabilities

### New Capabilities
- `listing-detail-screen`: Dynamic listing detail presentation and purchase-preview boundary.

### Modified Capabilities
- `marketplace-screen`: Asset cards navigate to the dynamic listing detail route.

## Impact

- `apps/web/src/app/marketplace/[id]/page.tsx` becomes the dynamic detail route.
- `apps/web/src/components/marketplace/asset-card.tsx` changes its CTA from a presentation-only button to a route link.
- New detail components/tests may be added under `apps/web/src/components/marketplace/`.
- The implementation reuses `AppSidebar`, `AppTopBar`, `Button`, `Icon`, and canonical generated types.
- No new schema, ABI, contract, wallet signing, swap, or quote execution contract is introduced.
