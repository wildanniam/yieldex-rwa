# marketplace-screen Specification

## Purpose
TBD - created by archiving change setup-marketplace-screen. Update Purpose after archive.
## Requirements
### Requirement: Marketplace discovery header

The marketplace screen MUST render primary/resale offer controls, the featured disclosure, search field, newest sort control, and grid/list view controls within the global navigation shell.

#### Scenario: Render marketplace toolbar

- **WHEN** a user opens `/marketplace`
- **THEN** Marketplace is the active sidebar destination
- **AND** the page renders Primary offers with count 12 and Resale with count 4
- **AND** it renders “Featured across primary and resale”
- **AND** it renders “Featured 6 of 16 · Sellers keep principal · No promised returns”
- **AND** it renders a search field with the “Search assets or listing IDs” label/placeholder and `⌘K` shortcut
- **AND** it renders a Newest select and grid/list view controls

### Requirement: Reusable asset listing card

The `AssetCard` component MUST render the specified listing anatomy using typed presentation data and support an optional highlighted treatment.

#### Scenario: Render a standard primary listing

- **WHEN** an asset card receives a primary listing
- **THEN** it renders the asset logo, symbol, seller, listing code, backing, income share, period, payout token, fixed price, `DemoUSD` value, `View offer` CTA, and simulated estimate/disclaimer metadata
- **AND** the card uses the dark card surface, 1px border, `rounded-[16px]`, and `p-5`

#### Scenario: Render a highlighted listing

- **WHEN** an asset card receives `highlighted=true`
- **THEN** it applies the specified subtle bottom green-to-transparent accent
- **AND** the base card content and financial labels remain unchanged

### Requirement: Mock listing grid and pagination

The marketplace screen MUST render six mock listings in a responsive grid and expose the requested pagination controls.

#### Scenario: Render primary and resale listings

- **WHEN** the marketplace page loads
- **THEN** the grid contains three primary offers and three resale offers
- **AND** the grid uses one column by default, two columns at medium width, and three columns at large width with a 20px gap

#### Scenario: Render pagination

- **WHEN** the marketplace page loads
- **THEN** it renders Previous, page 1 as the active circular item, pages 2 and 3, and Next
- **AND** the controls do not claim to fetch or mutate live listing data

### Requirement: Simulated financial disclosure

The marketplace screen MUST identify mock financial values as simulated and must not promise returns or principal loss protection.

#### Scenario: Display boundaries

- **WHEN** a card or marketplace disclosure shows price, payout, backing, or income estimate
- **THEN** the values use explicit token units and `DemoUSD` where applicable
- **AND** the screen retains simulated issuer-feed language and the no-promised-returns disclosure

### Requirement: Canonical marketplace read API boundary

The marketplace implementation MUST define its listing data boundary using the canonical root schemas and endpoint contract, without inventing a parallel screen DTO for API responses.

#### Scenario: Normalize a listings request

- **WHEN** the marketplace adapter requests listings
- **THEN** it targets `GET /api/v1/chains/{chainId}/markets/{marketAddress}/listings`
- **AND** it normalizes filters according to `schemas/api.schema.json#/$defs/SearchListingsQuery`
- **AND** `market` uses only `PRIMARY`, `SECONDARY`, or `ANY`
- **AND** `sort` uses only `PRICE_ASC`, `DURATION_ASC`, or `NEWEST`
- **AND** `limit` is no greater than 20 and `cursor` is nullable

#### Scenario: Consume a validated listings response

- **WHEN** the API returns a successful listing page
- **THEN** the response validates as `schemas/api.schema.json#/$defs/ListingsPage`
- **AND** every item validates as `schemas/domain.schema.json#/$defs/ListingDetail`
- **AND** the adapter preserves `meta`, `pagination`, and `snapshot` state for loading, stale, and pagination behavior
- **AND** atomic monetary and integer values remain strings until explicitly formatted for display

#### Scenario: Surface API failure

- **WHEN** the listing API returns a typed error or schema-invalid payload
- **THEN** the marketplace exposes an explicit unavailable/error state
- **AND** it does not silently display fabricated listings as live data

