## ADDED Requirements

### Requirement: ACC-001 Share-denominated isolated ledgers
The market SHALL account for principal per position and allocated claims per `(assetId,beneficiary)` in integer internal share units. It SHALL maintain total principal and claim shares per asset and SHALL preserve `totalPrincipalShares + totalClaimShares <= sharesOf(market)` for that asset. It SHALL NOT mix settlement currency, displayed token amounts, and share units.

#### Scenario: Two assets with similar ticker names
- **GIVEN** positions use two separately registered token addresses
- **WHEN** income is allocated and claimed for one asset
- **THEN** no principal/claim balance of the other asset changes, even if display names are similar.

#### Scenario: Unsolicited transfer to vault
- **GIVEN** an external address sends shares directly to the market
- **WHEN** vault balance increases without a recognized deposit or corporate-action allocation
- **THEN** the excess stays unallocated and produces no user dividend, principal, or admin withdrawable balance.

### Requirement: ACC-002 Measured deposits and baseline ownership
Deposits SHALL record actual positive received shares, enforce the caller's minimum received shares, and begin at a synchronized current event cursor. The deposit transaction SHALL fail atomically on unsupported transfer effects or snapshot drift. The same deposited shares SHALL NOT back multiple positions.

#### Scenario: Deposit conversion rounds down
- **GIVEN** the nominal token deposit converts to a fractional number of share units
- **WHEN** the ERC-20 transfer results in a lower integer share delta
- **THEN** the position records only the actual delta if it satisfies minReceivedShares; otherwise the whole deposit/listing transaction reverts.

### Requirement: ACC-003 Deterministic dividend allocation and rounding
For a valid positive dividend from M0 to M1 on S principal shares, the market SHALL retain `ceil(S*M0/M1)` principal shares and allocate the difference as income. Eligible buyer shares SHALL be `floor(incomeShares*incomeBps/10000)`; the remainder SHALL belong to principal owner. Full-precision multiplication/division SHALL prevent intermediate-overflow errors. Zero rounded income SHALL still advance the cursor.

#### Scenario: Small rounding fixture
- **GIVEN** S=3, M0=100, M1=200, incomeBps=5000, and buyer is eligible
- **WHEN** the event is checkpointed
- **THEN** principal becomes 2 shares, buyer receives 0, principal owner receives 1, and total accounted shares remains 3.

#### Scenario: Full income percentage
- **GIVEN** incomeBps=10000 and an eligible positive dividend creates I income shares
- **WHEN** it is allocated
- **THEN** buyer receives exactly I shares, principal owner receives 0 income shares, and retained principal is unchanged by the percentage choice.

### Requirement: ACC-004 Effective-time and cursor eligibility
Income eligibility SHALL use `[startAt,endAt)` and `event.sequence > activationEventCursor`, not announcement/detection/claim time. Every ownership-changing transaction SHALL checkpoint all recognized current events under the previous owner first. Same-timestamp event order SHALL be resolved by the event cursor and actual chain ordering, and SHALL NOT reset the original expiry.

#### Scenario: Same-second event already processed at activation
- **GIVEN** event N is effective and checkpointed before the primary purchase, and both timestamps equal T
- **WHEN** purchase records startAt=T and activationEventCursor=N
- **THEN** event N belongs entirely to principal owner, while a genuinely later effective event with a higher sequence at T may belong to the new buyer.

#### Scenario: Exact expiry boundary
- **GIVEN** a position ends at T
- **WHEN** events effective at T-1 and T are processed after T
- **THEN** the first is eligible for the period's rights owner and the second allocates all income to principal owner.

### Requirement: ACC-005 Final claims retain ownership and growth
Already allocated claim shares SHALL remain the beneficiary's property across resale, expiry, settlement, and principal release. Their later multiplier growth SHALL remain with that beneficiary and SHALL NOT be divided again as principal-generated income. Multiple positions SHALL aggregate into the beneficiary's per-asset claim ledger without erasing position-level audit events.

#### Scenario: Bob resells between two dividends
- **GIVEN** the first +2% dividend on 100 token backing at 50% creates claims for Alice and Bob, and Bob sells the whole right to Carol
- **WHEN** a second +2% dividend occurs
- **THEN** the integer fixture in docs/spec/accounting-and-finality.md is matched: Bob retains 980392156862745098 claim shares, Carol receives 961168781237985390, and total shares remain 100000000000000000000.

#### Scenario: Alice later reacquires the right
- **GIVEN** Alice is principal owner and buys the right from a different current owner
- **WHEN** an eligible dividend is allocated
- **THEN** both economic portions credit Alice's single claim ledger once in aggregate without doubling the total liability.

### Requirement: ACC-006 Splits and unsupported actions
Supported split/reverse-split events SHALL preserve all principal and claim share quantities and SHALL NOT create income. Unsupported corporate actions and unmodeled fee changes SHALL stop relevant accounting-dependent transitions rather than charge negative dividends or silently guarantee nominal principal.

#### Scenario: Reverse split after expiry with unclaimed payout
- **GIVEN** expired positions have remaining principal and Bob still owns unclaimed shares
- **WHEN** a verified reverse split changes the multiplier
- **THEN** displayed token quantities change for both principal and claims, share ownership remains identical, and no new income allocation is created.

### Requirement: ACC-007 Permissionless bounded checkpointing
Any account SHALL be able to checkpoint a position using 1–32 final events per call while the asset safety state is NORMAL; an unsynchronized newer head SHALL NOT prevent processing an already-final known prefix. Explicit quarantine SHALL block further checkpoint allocation, including when a conflict in a final event has been discovered. The cursor SHALL advance only for successfully processed events and SHALL prevent replay. Separate checkpoint calls SHALL persist bounded progress. If a buy/settle/release internal checkpoint cannot finish within its bound, the entire enclosing transaction SHALL revert with CheckpointRequired and SHALL NOT claim partial progress survived that revert.

#### Scenario: Backlog of 70 events before purchase
- **GIVEN** a position has 70 unprocessed final events and maxEvents=32
- **WHEN** a purchase is attempted directly
- **THEN** it reverts without payment/owner/cursor changes; separate checkpoints of 32, 32, and 6 can persist progress before a successful purchase.

#### Scenario: Retry after completed checkpoint
- **GIVEN** a cursor already equals the current final event count
- **WHEN** any caller checkpoints again
- **THEN** no income is allocated twice and completion is reported.

#### Scenario: Explicit conflict quarantine after partial allocation
- **GIVEN** some positions processed a final event before a later issuer correction exposed a conflict
- **WHEN** the asset is accounting-quarantined and another position requests checkpoint
- **THEN** new allocation is blocked; already allocated claim shares are preserved under the separate claim-transfer rules.

### Requirement: ACC-008 Claims transfer exact owned shares
A beneficiary SHALL be able to claim a positive number up to their allocated share balance to their own address. The market SHALL debit the same number of shares as leaves custody and reaches the recipient, preserve other claims/principal, and revert all changes if the token transfer or delta checks fail. Claiming allocated shares SHALL NOT require unrelated pending event metadata to finalize when transfer remains safe.

#### Scenario: Double claim or issuer transfer failure
- **GIVEN** a beneficiary owns X shares
- **WHEN** they claim X successfully and try again, or the issuer rejects the first transfer
- **THEN** the second claim is rejected after a successful first claim; on a failed first transfer the full claim balance remains intact.

#### Scenario: Partial claim during a metadata delay
- **GIVEN** Bob owns 100 finalized claim shares and an unrelated new event is awaiting classification
- **WHEN** he claims 40 and share transfer remains safe
- **THEN** 40 shares move to Bob, 60 remain claimable, and no new unclassified income is paid.

### Requirement: ACC-009 Settlement requires completeness coverage
Expiry alone SHALL NOT release principal. Settlement SHALL require current synchronized state, all known events checkpointed, and finalizedThrough at least endAt. It SHALL preserve old claims and invalidate open resale availability. Events effective before expiry but recognized afterwards SHALL be included before settlement; no new buyer income SHALL accrue from events effective at/after expiry.

#### Scenario: Metadata arrives after expiry
- **GIVEN** a pre-expiry dividend is not yet recognized and the position has expired
- **WHEN** Alice attempts settlement or release
- **THEN** synchronization/coverage blocks it; after finalization and checkpoint the correct old owner claim is reserved before settlement succeeds.

### Requirement: ACC-010 Principal release preserves all claim reserves
Only principal owner SHALL release principal from a SETTLED position or a cancelled never-activated position. Release SHALL checkpoint current recognized events, require synchronized safe state, and require coverage through endAt or cancelledAt respectively. It SHALL transfer only current principal shares, set them to zero, mark RELEASED, and leave all allocated claims available indefinitely subject to token transfer availability.

#### Scenario: Release with outstanding Bob and Alice claims
- **GIVEN** a settled position has principal shares and both Alice/Bob unclaimed balances
- **WHEN** Alice releases principal
- **THEN** only principal shares transfer, liabilities for Alice/Bob remain fully backed, and each may later claim independently.

#### Scenario: Primary cancellation while data is stale
- **GIVEN** an unpurchased primary listing is cancelled during an unresolved event
- **WHEN** Alice requests principal release
- **THEN** cancellation stays recorded but release waits for synchronized accounting and coverage through cancelledAt; no nonexistent endAt is used.

### Requirement: ACC-011 Verification and failure disclosure
The implementation SHALL include independent integer differential tests, stateful conservation/replay invariants, late-event/boundary tests, token-transfer failure tests, and a full primary→dividend→resale→dividend→expiry→claim→release journey. Reports SHALL distinguish mathematical simulation, mocked token behavior, native source-state fork evidence, and synthetic fork manipulations.

#### Scenario: Arithmetic experiment passes before contract tests exist
- **GIVEN** a Python formula experiment passed but product contracts are not yet built
- **WHEN** readiness is reported
- **THEN** the result is labeled arithmetic evidence and contract/fork/UI validation remain explicitly not tested.
