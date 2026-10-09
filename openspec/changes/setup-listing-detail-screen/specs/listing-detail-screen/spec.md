## ADDED Requirements

### Requirement: Dynamic listing detail route

The application MUST expose a dynamic detail route at `/marketplace/[id]` and use the route identifier as the selected listing identity.

#### Scenario: Open a known listing

- **WHEN** a user activates `View offer` for listing `L-0142`
- **THEN** the browser navigates to `/marketplace/L-0142`
- **AND** the global sidebar remains visible with Marketplace active
- **AND** the top bar title is `Listing Detail`
- **AND** the content renders a breadcrumb with Marketplace linking to `/marketplace` followed by `L-0142`

#### Scenario: Unknown listing

- **WHEN** a user opens `/marketplace/{id}` for an identifier that is not available
- **THEN** the screen renders an explicit not-found or unavailable state
- **AND** it does not substitute another listing's terms, price, owner, or income estimate

### Requirement: Contract and calculation explanation

The detail screen MUST explain the selected listing's terms and calculation rules using explicit units and product boundaries.

#### Scenario: Render listing terms

- **WHEN** a known listing detail is rendered
- **THEN** it shows the asset title, listing status, listing identifier, contract-address display, backing locked, income sold, period, payout form, fixed price, and deadline
- **AND** the values retain their token units and do not convert accounting integers through JavaScript floating-point arithmetic

#### Scenario: Render calculation guidance

- **WHEN** the detail screen renders the income explanation
- **THEN** it shows the Purchase, Income events allocated, Deadline, and Settlement steps
- **AND** it explains the split, transferability, and separate claim execution
- **AND** illustrative outcomes show `$200` → `$100` → `+$10 (+11.11%)`, `$100` → `$50` → `-$40 (-44.44%)`, and `$0` → `$0` → `-$90 (-100%)`
- **AND** the screen states that examples are illustrative and do not promise returns

### Requirement: Buy-offer action boundary

The buy sidebar MUST present the requested offer summary and payment controls without claiming that a purchase has executed.

#### Scenario: Render buy summary

- **WHEN** a known listing detail is rendered
- **THEN** it shows the fixed upfront price, estimated income, network-fee disclosure, payment-token tabs, balance copy, `Buy income rights`, and `Ask AI to explain`
- **AND** the selected payment token and all financial values have explicit units
- **AND** the screen retains the seller-principal and no-promised-returns boundary

#### Scenario: Purchase remains explicit and safe

- **WHEN** the user activates the purchase CTA before a transaction-intent integration is available
- **THEN** the UI does not sign, send, swap, bridge, or fabricate a successful transaction
- **AND** any unavailable action state is surfaced clearly
- **AND** a future live purchase path MUST use the canonical `BUY_LISTING` transaction-intent contract and verified wallet context

### Requirement: Canonical detail read boundary

The detail implementation MUST use the canonical API/domain contracts rather than inventing a parallel response shape.

#### Scenario: Consume a validated detail response

- **WHEN** the detail adapter receives a successful response
- **THEN** it targets `GET /api/v1/chains/{chainId}/markets/{marketAddress}/listings/{listingId}`
- **AND** it validates the response as `ListingResponse` containing `ListingDetail`
- **AND** it preserves snapshot/finality and typed unavailable/error state
- **AND** it keeps atomic monetary and integer values as strings until display formatting

#### Scenario: Detail API failure

- **WHEN** the detail endpoint returns a typed error or invalid payload
- **THEN** the screen shows an explicit unavailable/error state
- **AND** it does not display the selected listing as if live data were available
