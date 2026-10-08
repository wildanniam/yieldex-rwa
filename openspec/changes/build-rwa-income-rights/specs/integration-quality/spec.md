## ADDED Requirements

### Requirement: INT-001 Shared interface precedes independent modules
All modules SHALL use the same versioned schema, identifiers, monetary units and planned contract interface; a breaking change MUST update affected specs, consumers and fixtures together.

#### Scenario: Field rename proposed by one module
- **GIVEN** frontend and AI consume the same Position contract
- **WHEN** an implementer proposes a different owner field
- **THEN** the change is resolved in the shared contract and affected consumers together, rather than silently adding a competing DTO.

### Requirement: INT-002 Demo and provider evidence are distinct
The product SHALL label simulated Sepolia assets, official-token fork evidence, and live mainnet quote data separately. Mock tokens MUST NOT imply real stock backing.

#### Scenario: Live quote beside demo marketplace
- **WHEN** a user views a mainnet ETH/USDC quote and a DemoUSD-denominated Sepolia listing
- **THEN** the UI shows their chain/environment and does not treat the mainnet output as available demo settlement funds.

### Requirement: INT-003 Complete economic journey is verified
Release readiness MUST include ordinary and failure/recovery journeys from backing through primary sale, dividend, resale, second dividend, expiry, claim and principal release with contract state and balance evidence.

#### Scenario: Unclaimed old owner's payout after resale
- **GIVEN** Bob has accrued shares before Carol buys his whole position
- **WHEN** a later event is allocated and both recipients claim
- **THEN** evidence verifies Bob retains his earlier shares and their growth, Carol receives only her eligible income, expiry is unchanged and reserve conservation holds.

### Requirement: INT-004 Failures do not masquerade as completed actions
UI, API and tests SHALL distinguish sent, confirmed and finalized transactions, rejected signatures, reverted/replaced transactions, stale data and unavailable providers. Cache or model output MUST NOT fabricate chain completion.

#### Scenario: Browser reload during purchase
- **WHEN** the user reloads after broadcasting a purchase but before the receipt is known
- **THEN** the interface resumes receipt/state tracking without signing a second transaction and reconciles actual ownership before showing success.

### Requirement: INT-005 Spec status and implementation status remain separate
The team SHALL keep unimplemented requirements in the active OpenSpec change and implementation task checkboxes unchecked until their acceptance evidence exists.

#### Scenario: Documentation validation passes
- **WHEN** the OpenSpec and fixture validators pass before product code exists
- **THEN** the report describes spec/fixture validity only and does not archive the change or claim lifecycle functionality.

### Requirement: INT-006 User design choices preserve required semantics
Visual components SHALL preserve required fields, source/freshness labels, action confirmation and accessibility semantics regardless of the designer's layout/style.

#### Scenario: Designer rearranges quote card
- **WHEN** the visual layout changes
- **THEN** amount, token/chain identity, included/excluded fees, timestamp and recommendation limitations remain readable and no execution-swap action is introduced.

### Requirement: INT-007 Verification is reproducible and risk based
Each release candidate SHALL record source revision, environment, provider/mock boundary and passed/failed/blocked/not-tested outcomes for accounting, authorization, concurrency, ordinary UI and recovery cases.

#### Scenario: Fork unavailable during review
- **WHEN** pinned-chain RPC is unavailable but local mock tests pass
- **THEN** fork compatibility remains blocked, local successes are reported separately, and no production-provider compatibility claim is made.
