## ADDED Requirements

### Requirement: TX-001 Wallet owns transaction authority
Only explicit user interaction followed by wallet confirmation SHALL submit marketplace transactions. AI tools SHALL prepare read-only previews; chat rendering, tool completion, retries and hydration SHALL NOT sign or submit transactions.

#### Scenario: Assistant prepares purchase
- **WHEN** preparePurchase returns a purchase card
- **THEN** no wallet request SHALL occur until the user explicitly selects its action and reviews the preview.

#### Scenario: Card is restored after reload
- **WHEN** a persisted purchase card is rendered again
- **THEN** the app SHALL display its current/expired state without reopening a wallet or replaying a transaction.

#### Scenario: External swap recommendation
- **WHEN** the user selects a quote card
- **THEN** no token approval, swap, bridge, signature or external trade SHALL be initiated by the application.

### Requirement: TX-002 Allowlisted deterministic transaction construction
Preparation SHALL construct calldata from the shared ABI and validated typed action. Chain, target, spender, native value, signer and allowed function SHALL be checked against deployment manifest and verified wallet context; arbitrary model-provided calldata/recipient SHALL be rejected.

#### Scenario: Model supplies malicious target
- **WHEN** input contains a transaction address, calldata, recipient override or unknown field
- **THEN** schema validation SHALL reject it before wallet preparation.

#### Scenario: Correct user on wrong chain
- **WHEN** the user is connected to a chain other than the marketplace deployment
- **THEN** UI SHALL request an explicit chain change or block preparation; mainnet quote results SHALL NOT change the marketplace target.

#### Scenario: Prepared preview reused by another wallet
- **WHEN** the signing wallet differs from the verified preview wallet
- **THEN** the preview SHALL be invalidated and SHALL not be sent.

### Requirement: TX-003 Latest state and guarded purchase parameters
Purchase preparation SHALL re-read latest pinned contract state, validate availability, terms and metadata synchronization, and set expectedTermsHash, expectedAssetHeadHash, maxPriceAtomic, deadline and maxEvents according to the contract interface.

#### Scenario: Cached open listing was sold
- **WHEN** another buyer fills a listing between discovery and preparation
- **THEN** preparation SHALL fail as LISTING_UNAVAILABLE with latest status; the app SHALL not buy another listing automatically.

#### Scenario: Metadata changes after preview
- **WHEN** asset head/fingerprint changes before the prepared buy is included
- **THEN** contract guards SHALL reject the outdated buy and UI SHALL require a fresh preview without claiming the user lost a completed purchase.

#### Scenario: Seller cancels and relists
- **WHEN** the original listing ID is cancelled and a new ID has different price
- **THEN** the old preview SHALL not authorize the new listing even if it concerns the same position.

### Requirement: TX-004 Approval is separate from purchase
When allowance is insufficient, the app SHALL request only the exact required allowance for the configured token and market. After approval confirmation it SHALL prepare and simulate the action again. Approval success SHALL NOT be presented as purchase success.

#### Scenario: Buyer needs payment allowance
- **WHEN** Bob has sufficient DemoUSD but allowance is insufficient
- **THEN** the preview SHALL be NEEDS_APPROVAL with an exact token/market allowance step and no ready purchase step.

#### Scenario: Listing sells during approval
- **WHEN** allowance approval succeeds but another buyer has purchased the listing
- **THEN** re-preparation SHALL stop with unavailable status; approval itself SHALL not debit the purchase price.

#### Scenario: Quote provider returns spender
- **WHEN** an external quote provider response contains allowanceTarget or transaction data
- **THEN** those fields SHALL not become an approval step or wallet action.

### Requirement: TX-005 Preflight simulation and reviewable preview
The application SHALL simulate ready marketplace actions from the actual signer against a pinned latest block, map errors, and show terms before wallet confirmation. Simulation SHALL be labelled a check rather than a guarantee of inclusion or success.

#### Scenario: Contract rejects unsafe accounting
- **WHEN** the simulated action reverts due to stale metadata, backlog, safety state or insufficient coverage
- **THEN** the preview SHALL be BLOCKED with no executable action step and an actionable typed reason.

#### Scenario: Approval prevents simulation
- **WHEN** allowance blocks the final action
- **THEN** state SHALL be APPROVAL_REQUIRED, not a claim that full purchase simulation already passed.

#### Scenario: Preview discloses rights economics
- **WHEN** a purchase preview is ready
- **THEN** it SHALL show fixed upfront price, recipient, asset, income percentage, initial/remaining term, payout token, chain, deadline and transaction-cost estimate if available.

### Requirement: TX-006 Preparation is bounded and idempotent
Stored preparation SHALL bind user, wallet, normalized request, deployment and idempotency key. Replayed preparation SHALL not produce new actions silently, extend expiry, reserve a listing or mutate onchain state.

#### Scenario: Same request retried
- **WHEN** the client repeats the same key and request after a network timeout
- **THEN** the service SHALL return the same intent identity/terms without submitting anything.

#### Scenario: Conflicting key reuse
- **WHEN** the same idempotency key is reused with another listing, wallet or amount
- **THEN** the service SHALL return IDEMPOTENCY_CONFLICT.

#### Scenario: Old preview expires
- **WHEN** its deadline or 120-second maximum lifetime passes
- **THEN** the API/UI SHALL expose EXPIRED with no executable steps; a new preview requires a new key and state read.

### Requirement: TX-007 User rejection and duplicate clicks are safe
The application SHALL distinguish user rejection from contract failure and SHALL prevent concurrent submission of the same pending UI action. Rejection, refresh or connection loss SHALL not automatically retry an onchain transaction.

#### Scenario: User rejects signature
- **WHEN** the wallet reports a rejected transaction request
- **THEN** UI SHALL return to a reviewable state with USER_REJECTED and no success claim or automatic retry.

#### Scenario: Double click while wallet pending
- **WHEN** the user clicks confirm repeatedly
- **THEN** a single wallet request SHALL remain active for that step.

#### Scenario: Refresh after broadcast
- **WHEN** the page reloads after a transaction hash was obtained
- **THEN** the app SHALL resume tracking the existing hash and SHALL not broadcast another transaction automatically.

### Requirement: TX-008 Receipt evidence determines progress
Submitted hashes SHALL be validated against RPC transaction identity. Status SHALL distinguish pending, successful receipt, finalized receipt, revert, replacement, cancellation, unknown and reorg. Database intent state alone SHALL never prove purchase success.

#### Scenario: Forged submitted hash
- **WHEN** a client associates an unrelated transaction hash with an intent
- **THEN** the service SHALL reject it or hold verification until from/to/data/chain match, and SHALL not mark the action successful.

#### Scenario: Receipt reverts
- **WHEN** transaction receipt status is reverted
- **THEN** UI SHALL show REVERTED; purchased rights, payment and claim balances SHALL reflect contract state rather than optimistic success.

#### Scenario: Wallet wraps the submitted action
- **GIVEN** the wallet returned the original submitted hash and its canonical receipt matches the sender and known nonce
- **WHEN** wallet-added execution wrapping changes the outer target or calldata and the receipt reverts
- **THEN** UI SHALL show REVERTED rather than cancellation, including after revalidating a persisted journal from an older client.
- **AND** a successful receipt whose action identity cannot be verified SHALL remain UNKNOWN without optimistic state or automatic resubmission.

#### Scenario: Gas repricing replaces transaction
- **WHEN** the wallet replaces a pending transaction with the same action and nonce at a higher fee
- **THEN** tracking SHALL follow the replacement hash and verify its calldata before reporting success.

#### Scenario: Original transaction disappears after gas repricing
- **GIVEN** the service verified and persisted an original transaction and its nonce from RPC
- **WHEN** an otherwise matching replacement is submitted after the original hash is evicted
- **THEN** the service SHALL validate against the stored nonce and preview identity, persist the replacement hash, and derive status from its receipt without requiring the old hash to remain queryable.

#### Scenario: Legacy submission has no verified nonce
- **GIVEN** a pre-migration intent stores an original hash but no verified nonce
- **WHEN** a different hash is submitted
- **THEN** the service SHALL recover and validate the original identity from RPC when available, or return an explicit verification conflict without accepting a caller-supplied nonce or overwriting the original hash.

#### Scenario: User cancels pending transaction
- **WHEN** the same nonce is mined with a cancellation or different action
- **THEN** the original purchase SHALL be reported cancelled/replaced, not completed.

#### Scenario: Receipt is confirmed but not finalized
- **WHEN** a successful receipt is available before chain finality
- **THEN** UI SHALL label it CONFIRMED and show direct-read ownership, upgrading to FINALIZED only after canonical finality verification.

### Requirement: TX-009 Multiple frontends cannot bypass financial guards
The contract SHALL remain authoritative when buyers race, users open multiple tabs, the backend is unavailable or clients call contracts directly. API protections SHALL supplement rather than replace onchain terms/accounting checks.

#### Scenario: Two buyers race
- **WHEN** Bob and Carol submit valid buys for the same open listing
- **THEN** at most one SHALL pay and acquire the right; the other SHALL revert without a partial payment.

#### Scenario: Claims from two tabs
- **WHEN** the same account attempts to claim the same shares concurrently
- **THEN** contract state SHALL prevent overclaim while both UIs reconcile final balances.

#### Scenario: Session service unavailable
- **WHEN** Supabase or chat is down but the chain and wallet remain available
- **THEN** the standard wallet flow/direct contract path SHALL preserve its onchain permissions and SHALL not depend on a database success flag.
