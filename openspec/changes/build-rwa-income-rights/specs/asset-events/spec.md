## ADDED Requirements

### Requirement: EVT-001 Asset registration and immutable custody identity
The registry SHALL allow only an authorized admin to register supported token/adapter pairs, SHALL assign `assetId = keccak256(abi.encode(chainId,token))`, and SHALL prohibit duplicate token registration or changing an active asset's token/adapter identity. Registration SHALL capture the current resolved multiplier, issuer nonce, effective history index, and observation timestamp as baseline. It SHALL NOT create claims for events before custody.

#### Scenario: Register three compatible demo assets independently
- **GIVEN** three distinctly addressed supported demo tokens with zero issuer fee
- **WHEN** the admin registers each token
- **THEN** each has a distinct assetId and separate event/custody ledger, and later configuration of one asset cannot overwrite another.

#### Scenario: Existing multiplier history precedes the first deposit
- **GIVEN** a token has past effective dividends before registration
- **WHEN** a user deposits after the current baseline is registered and synchronized
- **THEN** their position starts at the current event cursor and receives no income from pre-deposit events.

### Requirement: EVT-002 Finalized event identity and ordered continuity
The registry SHALL record immutable per-asset finalized events with monotonic local sequence, stable occurrence identity, effective time, supported kind, exact integer multipliers, source revision, issuer nonce, history index, and evidence hash. The next sequence SHALL equal previous+1; multiplierBefore SHALL equal the previous head multiplier; issuerNonceAfter SHALL increase but SHALL NOT be assumed to increase by exactly one. It SHALL reject duplicate occurrence/history identities and events at or before closed coverage.

#### Scenario: A source correction is received before final commitment
- **GIVEN** an issuer occurrence has preliminary revision 1 and corrected revision 2, neither committed
- **WHEN** the finalizer verifies revision 2
- **THEN** it may commit revision 2 once under the same occurrence eventId; it does not commit both revisions as two dividends.

#### Scenario: Retry and nonce gap
- **GIVEN** a final event has issuer nonce 4 and the next verified effective event has nonce 7
- **WHEN** the finalizer commits the next contiguous history event and later retries it
- **THEN** the nonce gap does not itself invalidate the first commit, and the duplicate retry is rejected without a second allocation opportunity.

### Requirement: EVT-003 Effective event classification
Only final DIVIDEND events with multiplierAfter greater than multiplierBefore SHALL generate new income. SPLIT, REVERSE_SPLIT, and proven identical-multiplier NO_INCOME SHALL generate no income. A pending schedule, stock price change, unsolicited transfer, or unknown corporate action SHALL NOT be interpreted as dividend. The adapter SHALL verify effective history data while classification remains the explicitly trusted finalizer's responsibility.

#### Scenario: Positive multiplier caused by split
- **GIVEN** a verified 2:1 split doubles the multiplier
- **WHEN** it is committed and checkpointed
- **THEN** principal and claim share ownership remain unchanged and no dividend shares are allocated.

#### Scenario: Unsupported merger or issuer fee change
- **GIVEN** the issuer reports a merger, or fee/config changes outside the supported zero-fee mechanism
- **WHEN** the finalizer/adapter detects it
- **THEN** the affected asset is quarantined for accounting-dependent operations and no invented dividend record is submitted.

### Requirement: EVT-004 Scheduled actions and overrides
Future scheduled events SHALL NOT become claimable before actual effectiveness and final recognition. The adapter/finalizer SHALL reconcile replacement of pending schedules and SHALL NOT process an overridden occurrence. Snapshot normalization SHALL distinguish effective state from future pending state and ordinary token storage housekeeping.

#### Scenario: Future event is overridden before activation
- **GIVEN** a dividend multiplier is scheduled for tomorrow and replaced today
- **WHEN** the worker reconciles history and later commits the actual effective update
- **THEN** only the actual effective update can enter the final event sequence; the replaced schedule produces no income.

#### Scenario: A known pending event becomes effective without a new transaction
- **GIVEN** the registry has acknowledged a future pending schedule
- **WHEN** the activation timestamp arrives and the token's resolved multiplier changes
- **THEN** the asset becomes unsynchronized until the actual effective event is finalized and the new snapshot acknowledged.

### Requirement: EVT-005 Complete synchronized head before economic transitions
Deposit, primary relisting, secondary listing creation, purchases, settlement, and principal release SHALL require the complete recognized event head to match the adapter's current snapshot and every effective post-baseline history entry to be represented. Snapshot checks SHALL include multiplier, issuer nonce, pending state, history identity, observable fee/config, and token runtime code identity. A matching multiplier alone SHALL NOT establish synchronization.

#### Scenario: Unrecognized dividend before resale
- **GIVEN** a dividend becomes effective at 10:00, metadata arrives at 10:05, and Bob is still the current owner
- **WHEN** Bob or a direct contract caller attempts resale at 10:03
- **THEN** the contract rejects the transaction as unsynchronized; after reconciliation the dividend is checkpointed for Bob before any transfer to Carol.

#### Scenario: Opposite changes leave the same multiplier
- **GIVEN** two unprocessed changes restore the old multiplier but advance nonce/history
- **WHEN** a purchase is attempted
- **THEN** the mismatch blocks the purchase despite equal start/end multiplier values.

### Requirement: EVT-006 Trusted monotonic completeness coverage
The finalizer SHALL be able to advance `finalizedThrough` only monotonically with nonzero source block/evidence references, synchronized current state, and a source observation timestamp strictly earlier than the coverage transaction timestamp. Coverage SHALL assert all events through that time have been reconciled, including no-event intervals. It SHALL NOT be inferred from an arbitrary 24-hour delay, source revision number, or an unverified block hash.

#### Scenario: No dividend occurs before expiry
- **GIVEN** a position has expired, no new dividend occurred, and current token state is unchanged
- **WHEN** the finalizer verifies the no-event interval and advances coverage through endAt
- **THEN** settlement can proceed without fabricating a zero dividend event.

#### Scenario: Updater proposes backwards or future coverage
- **GIVEN** coverage has reached time T
- **WHEN** a report proposes a time before T or beyond the observed past finalized block timestamp
- **THEN** the registry rejects it and preserves the existing coverage.

### Requirement: EVT-007 Finalized records and late corrections
Committed final events and already allocated ownership SHALL be immutable. An issuer correction conflicting with a final event or closed coverage SHALL trigger an incident/quarantine workflow; it SHALL NOT rewrite balances, claw back externally paid tokens, insert history behind a consumed cursor, or fund compensation from unrelated principal. V1 SHALL expose this finalizer trust limitation and SHALL NOT claim trustless issuer finality.

#### Scenario: Finalized dividend later corrected downward
- **GIVEN** a dividend was finalized and some users already claimed
- **WHEN** issuer metadata later invalidates the allocation
- **THEN** the worker records the conflict and quarantines related accounting; neither admin nor finalizer can rewrite the event or confiscate claims using a v1 function.

### Requirement: EVT-008 Restricted roles and configuration monitoring
Only EVENT_FINALIZER_ROLE SHALL append final events, acknowledge snapshots, or advance coverage. It SHALL NOT choose arbitrary beneficiaries, change position terms, transfer backing, change role membership, or lower quarantine. Proxy implementation identity SHALL be monitored offchain and changes SHALL be treated as compatibility incidents; matching proxy runtime bytecode SHALL NOT be presented as implementation proof.

#### Scenario: Unprivileged account submits an event
- **GIVEN** a user has no finalizer role
- **WHEN** they submit otherwise well-formed final metadata
- **THEN** the registry reverts Unauthorized and changes no event/coverage state.

#### Scenario: Issuer proxy implementation changes
- **GIVEN** the proxy runtime remains unchanged but its implementation slot changes
- **WHEN** the worker detects the difference from the reviewed implementation
- **THEN** it raises compatibility quarantine and preserves evidence instead of silently treating the asset as supported.

### Requirement: EVT-009 Quarantine and failure isolation
The registry SHALL distinguish ACCOUNTING_QUARANTINED from TRANSFER_QUARANTINED. Metadata staleness or classification uncertainty SHALL NOT by itself prevent transfer of already allocated shares whose transfer semantics remain valid. Unsafe share-transfer/configuration changes SHALL block claims as well. Failures SHALL be isolated by asset and SHALL NOT delete ownership or claims.

#### Scenario: Metadata API outage with safe token transfers
- **GIVEN** Bob has finalized allocated claim shares, current metadata is unavailable, and share transfer remains supported
- **WHEN** Bob claims and Alice attempts a new purchase-dependent transition
- **THEN** Bob's existing claim can succeed while the unsynchronized economic transition remains blocked.

#### Scenario: Unsafe token implementation change
- **GIVEN** share transfer semantics are no longer trusted for one asset
- **WHEN** that asset is transfer-quarantined
- **THEN** its claims/release are blocked with an explicit reason and unrelated supported assets remain usable.

### Requirement: EVT-010 Bounded registry updates and integration evidence
Final-event batches SHALL contain at most 32 records and SHALL NOT iterate over every user position. Implementers SHALL verify forward history continuity, snapshot normalization, exact share transfer, and unsupported behavior using deterministic demo fixtures and a separately labeled official-token fork qualification. Read-only historical research SHALL NOT be reported as a successful product fork or deployment.

#### Scenario: Long event backlog
- **GIVEN** more than 32 valid effective events await registration
- **WHEN** the finalizer appends successive bounded prefixes
- **THEN** the registry accepts valid prefixes, keeps the asset unsynchronized until the complete effective head is acknowledged, and never requires processing every position in the update transaction.
