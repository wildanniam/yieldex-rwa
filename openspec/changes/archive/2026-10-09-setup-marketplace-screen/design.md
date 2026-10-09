## Context

The global navigation shell is now available, but `/marketplace` still renders a title-only placeholder. The supplied design calls for a dark Yieldex listing screen with a primary/resale toggle, a discovery toolbar, a three-column card grid, and pagination. The current repository already provides typed `Button`, `SearchField`, `Select`, and `Icon` primitives. The root `schemas/api.schema.json` and `schemas/domain.schema.json` define the API and domain wire contracts that the screen must consume when mock data is replaced.

## Goals / Non-Goals

**Goals:**
- Present a clear primary-offer and resale discovery surface inside the global shell.
- Keep asset cards reusable and data-driven so future API-backed listings can replace the mock array.
- Match the specified card geometry, highlighted treatment, metrics anatomy, CTA, and simulated-data disclaimers.
- Preserve accessible labels, native select semantics, button semantics, and active control states.
- Keep the layout responsive from one column through three columns.

**Non-Goals:**
- Adding live API fetching in the initial mock-only implementation.
- Implementing filtering, sorting, search, pagination state, wallet actions, purchase flows, or quote calculations.
- Claiming real backing, guaranteed returns, issuer completeness, or live yield.
- Changing the global shell, navigation contracts, schemas, contracts, or generated files.

## Decisions

### 1. Use a typed mock listing model

The page will define six explicit mock listing records with a `kind` of primary or resale. Money and financial display values remain strings. The model will include symbol, listing code, backing, seller, income share, period, payout token, price, estimate, and simulated-feed copy.

### 2. Keep the asset card presentational

`AssetCard` receives a listing and optional `highlighted` prop. It renders the dark bordered card with `rounded-[16px] p-5`, a bottom accent for highlighted cards, and a full-width primary `View offer` button. The CTA remains a non-transactional presentation action until a future product flow is implemented.

### 3. Render controls with existing primitives

Offer type tabs use accessible buttons, search uses `SearchField` with the `⌘K` shortcut, sort uses `Select`, and view controls use icon buttons with accessible labels. These controls may visually indicate state but do not need to change the static mock dataset in this change.

### 4. Preserve explicit financial boundaries

Copy must retain `DemoUSD`, simulated issuer-feed language, and the “Sellers keep principal / No promised returns” disclosure. The screen must not infer APY, guaranteed yield, live backing, or transaction success from mock data.

### 5. Define the implementation API boundary from root schemas

The eventual listing adapter MUST use the canonical schemas in the repository root rather than inventing a screen-local DTO:

- Request query normalization follows `schemas/api.schema.json#/$defs/SearchListingsQuery`, with `market` values `PRIMARY`, `SECONDARY`, or `ANY`, `sort` values `PRICE_ASC`, `DURATION_ASC`, or `NEWEST`, `limit` capped at 20, and nullable `cursor`.
- The public endpoint is `GET /api/v1/chains/{chainId}/markets/{marketAddress}/listings`.
- A successful list response follows `schemas/api.schema.json#/$defs/ListingsPage`: `meta`, `items`, `pagination`, and `snapshot`.
- Each item is `schemas/domain.schema.json#/$defs/ListingDetail`, whose nested listing, position, and asset data supplies the card's identity, terms, seller, payment token, price, income share, period/remaining time, and payout display.
- Atomic monetary and integer fields remain decimal strings; the UI adapter formats them only after validating the schema and manifest token decimals. It must not introduce generic `price`, `amount`, or floating-point accounting fields.
- API errors use the shared schema envelope and the UI must surface a typed error state rather than silently falling back to fabricated listings.

The first implementation may keep six static fixtures, but its fixture shape MUST be a view-model adapter boundary that can be populated from validated `ListingDetail` items without changing `AssetCard` props.

## Risks / Trade-offs

- Static controls can appear interactive without changing data. Their state should be represented clearly and documented as presentation-only until API wiring is approved.
- The requested gradient highlight uses a design-specific color treatment; it must remain confined to highlighted cards and not alter global surface tokens.
- Mock cards may not cover all future API edge cases. The typed card boundary should make missing/invalid data explicit rather than silently inventing fallbacks.
