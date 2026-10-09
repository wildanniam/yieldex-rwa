## ADDED Requirements

### Requirement: MKT-001 Ledger positions and immutable economic terms
The market SHALL represent income rights as onchain ledger positions with immutable principal owner, asset, incomeBps, and duration; primary activation SHALL set startAt/endAt once. It SHALL NOT mint an NFT, permit direct gifts/transfers, split secondary rights, or allow active economic terms to be changed unilaterally. Shares deposited for a position SHALL remain locked until valid cancellation/settlement release.

#### Scenario: Attempt to change active terms
- **GIVEN** Bob bought a 50% income right for 180 days
- **WHEN** Alice or an admin wants a shorter duration, different asset, or different income percentage
- **THEN** no v1 mutation function allows that change, and the original terms remain authoritative.

### Requirement: MKT-002 Atomic backing deposit and primary listing
Creating a primary listing SHALL atomically secure the measured backing and create an OFFERED position and fixed-price listing. The caller SHALL select incomeBps, durationSeconds, priceAtomic, and listingExpiresAt within documented bounds. Only the requested backing SHALL be locked; no right SHALL be activated before successful purchase.

#### Scenario: Deposit fails or receives less than minimum
- **GIVEN** Alice approves insufficient backing or received shares fall below minReceivedShares
- **WHEN** createPrimaryListing executes
- **THEN** the complete transaction reverts with no partially funded position or live listing.

### Requirement: MKT-003 Independent listing deadline and rights duration
Listing expiry SHALL be separate from the income-right duration. A listing SHALL be purchasable only while now<expiresAt. Primary duration SHALL begin at successful purchase block timestamp; secondary purchases SHALL retain original endAt. Timestamp passage SHALL NOT itself send tokens or mutate stored state.

#### Scenario: Primary listing exists for six days before sale
- **GIVEN** Alice created a seven-day listing for a 180-day right
- **WHEN** Bob buys on listing day six
- **THEN** his 180-day period starts at that successful purchase, not at listing creation.

#### Scenario: Exact listing expiry
- **GIVEN** listingExpiresAt equals the current transaction timestamp
- **WHEN** a buyer attempts purchase
- **THEN** purchase is rejected and backing remains under the position's existing custody rules.

### Requirement: MKT-004 Cancellation and relisting are explicit transactions
The seller SHALL be able to cancel the position's current unfilled listing even after its deadline. Primary cancellation SHALL close the never-activated position and record cancelledAt without transferring backing; secondary cancellation SHALL close only the listing. An expired but uncancelled OFFERED primary position MAY be relisted with a new ID and price/deadline. Cancelling a superseded historical listing SHALL be rejected and SHALL NOT cancel a newer listing/position. There SHALL be no direct edit of a live listing; changes to cancelled primary positions require a new position/deposit after safe release.

#### Scenario: Alice changes a live primary price
- **GIVEN** Alice has an unfilled primary listing at 90 DemoUSD
- **WHEN** she wants a different price
- **THEN** she cancels the listing, safely releases its backing, and creates a new position/listing; the old ID cannot later be bought at either price.

#### Scenario: Bob cancels a resale listing
- **GIVEN** Bob has an active income right with a secondary listing
- **WHEN** he cancels that listing
- **THEN** Bob still owns the same right, retains claims, and may later create a new secondary listing before expiry.

### Requirement: MKT-005 Atomic fixed-price primary purchase
A valid primary purchase SHALL checkpoint pre-activation income for principal owner, transfer the exact fixed settlement-token price from buyer to seller, and activate the right for msg.sender in one atomic transaction. Failed allowance/balance/transfer/state validation SHALL leave all payment and rights state unchanged. Demo platform fee SHALL be zero and the purchase price SHALL NOT become a maturity refund liability.

#### Scenario: Successful primary purchase
- **GIVEN** a synchronized valid listing, current preview hashes, enough DemoUSD balance/allowance, and complete accounting
- **WHEN** Bob buys
- **THEN** Alice receives the exact listing price, Bob becomes rightsOwner, startAt/endAt are recorded, and the listing becomes FILLED in the same transaction.

#### Scenario: Payment token transfer fails
- **GIVEN** all listing checks pass but the payment transfer reverts
- **WHEN** purchase executes
- **THEN** Bob receives no right, Alice receives no partial payment, and the listing remains unfilled.

### Requirement: MKT-006 Full-position atomic resale
Only the current rights owner SHALL create a secondary listing, for the entire remaining right and with deadline no later than endAt. Secondary purchase SHALL checkpoint all recognized past events for the previous owner, transfer exact payment to that owner, and replace rightsOwner atomically. It SHALL preserve principal owner, percentage, original dates, and old beneficiaries' accrued claims.

#### Scenario: Carol buys Bob's remaining right
- **GIVEN** Bob has accrued unclaimed income and a valid full-position secondary listing
- **WHEN** Carol buys
- **THEN** Bob receives the fixed secondary price and retains old claims; Carol receives only future eligible income until the original endAt.

#### Scenario: Partial secondary sale requested
- **GIVEN** a user owns one right
- **WHEN** the UI/AI requests selling only half of that position
- **THEN** the application explains that v1 sells the entire right, and no contract function accepts a partial amount or mints a child position.

### Requirement: MKT-007 Current-owner and race protection
The market SHALL allow at most one live listing per position and SHALL reject stale-owner, self-purchase, filled/cancelled/expired listing, and expired-position purchases. Concurrent buyers SHALL not both acquire the same listing. A principal owner MAY buy a secondary right from a different seller using the ordinary purchase path.

#### Scenario: Two buyers race
- **GIVEN** Carol and Dave submit transactions for the same open listing
- **WHEN** Carol's transaction executes successfully first
- **THEN** Dave's transaction reverts with no payment, and only Carol becomes rightsOwner.

#### Scenario: Old listing belongs to a previous owner
- **GIVEN** an old secondary listing names Bob but Carol now owns the right
- **WHEN** a caller tries to buy the old listing directly
- **THEN** the owner/state validation rejects it regardless of stale frontend/indexer data.

### Requirement: MKT-008 Purchase intent integrity
Purchase calls SHALL include expected immutable listing terms hash, expected asset head hash, maximum accepted price, intent deadline, and bounded checkpoint limit. The contract SHALL validate these values against authoritative onchain state. User approval of a chat card SHALL NOT by itself execute a transaction or permit arbitrary target/calldata.

#### Scenario: Asset event arrives after preview
- **GIVEN** the user previewed a listing under asset head H1
- **WHEN** a new event is finalized/acknowledged creating H2 before purchase inclusion
- **THEN** the purchase rejects the stale expected head and the application refreshes the preview before requesting a new wallet confirmation.

#### Scenario: Only finality coverage advances
- **GIVEN** terms and acknowledged event snapshot do not change
- **WHEN** the finalizer merely extends no-event completeness coverage
- **THEN** assetHeadHash remains unchanged and a still-valid purchase preview is not rejected solely for that update.

### Requirement: MKT-009 Principal and claim permissions
Only principal owner SHALL release principal after the accounting/finality conditions are satisfied. Only a beneficiary SHALL withdraw their claim shares, always to their own caller address. Neither seller, buyer, admin, finalizer, AI, nor indexer SHALL redirect another user's payout or bypass locked active obligations.

#### Scenario: Admin or buyer tries to release Alice's backing
- **GIVEN** Alice is principal owner and Bob owns the active income right
- **WHEN** Bob, admin, or any unrelated address calls releasePrincipal
- **THEN** authorization/state checks reject the call and custody remains unchanged.

### Requirement: MKT-010 No swap execution and clear currency identity
Marketplace rights purchases SHALL use available DemoUSD in the wallet and ordinary market payment approval. The application SHALL NOT execute external token swaps/bridges, request swap approval/signatures, or treat a read-only mainnet quote as Sepolia settlement funds. Users who obtain payment assets externally SHALL have balance/listing revalidated on return.

#### Scenario: User returns after comparing external quotes
- **GIVEN** the AI showed mainnet ETH→USDC recommendations and a Sepolia income-right listing
- **WHEN** the user returns to purchase the right
- **THEN** the app checks actual Sepolia DemoUSD and current listing state; a mainnet USDC quote cannot count as payment balance or reserve the listing.

### Requirement: MKT-011 Observable state and recoverable failures
All successful custody, listing, ownership, allocation, claim, and release mutations SHALL emit the documented audit events. Expiry SHALL be derived from time; failed transactions SHALL not be indexed as completed. Frontend/API SHALL use shared generated ABI/error mappings and re-read chain state after receipt, replacement, reload, or stale-data failure.

#### Scenario: Wallet rejects a signature
- **GIVEN** the application prepared a valid purchase
- **WHEN** the user rejects the wallet request
- **THEN** the listing remains available according to chain state, no success card is shown, and the same preparation cannot silently retry sending.

#### Scenario: Settled principal is released before claims
- **GIVEN** principal release succeeds while historical claims remain
- **WHEN** the user reloads the position page
- **THEN** the position is shown RELEASED with zero remaining principal while unclaimed asset balances remain visible and withdrawable to their owners.
