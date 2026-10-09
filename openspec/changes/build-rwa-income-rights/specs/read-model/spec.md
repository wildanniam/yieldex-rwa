## ADDED Requirements

### Requirement: IDX-001 Canonical money and identity representations
All producers and consumers SHALL use the versioned schemas in `schemas/` and conventions in `docs/spec/data-contracts.md`; money, shares, multipliers, block numbers and local onchain IDs SHALL be canonical bounded decimal strings. Chain IDs, timestamps in UTC seconds, and basis points SHALL be safe bounded integers.

#### Scenario: Large quantity survives API and UI
- **WHEN** a valid uint256 amount larger than JavaScript's safe integer limit passes through RPC decoding, storage, API, and a card
- **THEN** its exact integer digits SHALL be preserved without Number conversion or floating-point arithmetic.

#### Scenario: Invalid units are rejected
- **WHEN** a client supplies a money number, exponent, negative value, leading zero, overflow, or millisecond timestamp outside configured bounds
- **THEN** validation SHALL reject the payload before RPC encoding and SHALL identify the invalid field.

#### Scenario: Composite identity conflicts
- **WHEN** a listingKey chain/contract/id differs from its DTO or requested deployment
- **THEN** the response or request SHALL fail semantic validation rather than select either identity silently.

### Requirement: IDX-002 Finalized canonical index with immediate receipt visibility
The indexer SHALL project canonical logs through the RPC finalized tag. Public responses SHALL include pinned block number/hash/time, observation time, finality, and indexer health. A user's confirmed transaction SHALL become visible through a direct read overlay without waiting for finalized indexing.

#### Scenario: Newly created listing precedes index
- **WHEN** Alice receives a successful create-listing receipt and the finalized index is still behind
- **THEN** her UI SHALL show the returned listing/position from a direct pinned read labelled CONFIRMED and SHALL explain that public indexing is catching up.

#### Scenario: Index delay does not permit stale purchase
- **WHEN** a finalized cached listing appears open but has already been filled at latest
- **THEN** transaction preparation SHALL read latest state and reject the purchase as unavailable.

#### Scenario: Finalized RPC unavailable
- **WHEN** a provider cannot supply a reliable finalized head
- **THEN** the service SHALL report degraded/stale availability and SHALL NOT relabel latest as finalized.

#### Scenario: Token schedule activates without market event
- **WHEN** a token's scheduled multiplier becomes effective but the scanned batch contains no market or registry log
- **THEN** the indexer SHALL still read the adapter snapshot for every registered asset at the batch block and derive token display amounts and sync status from that snapshot, without changing claim share ownership.

#### Scenario: One adapter reverts while other assets remain supported
- **GIVEN** one registered adapter deterministically reverts or returns unusable contract data and registry/market reads remain valid at a canonical block
- **WHEN** the indexer hydrates all assets and their positions, listings and claims
- **THEN** the affected asset is ADAPTER_UNAVAILABLE with null live multiplier/nonce and null displayed token conversions, its actual shares/owners remain visible, and healthy assets advance at that same block; a later successful adapter read restores live values.

#### Scenario: Provider failure is not an isolated asset failure
- **GIVEN** a transport failure, registry read failure, manifest mismatch or canonical block conflict
- **WHEN** hydration is attempted
- **THEN** the snapshot/cursor transaction fails rather than publishing invented per-asset data or skipping canonical validation.


### Requirement: IDX-003 Deterministic replay and atomic cursor advancement
Indexer batches SHALL order logs by block number, transaction index and log index, deduplicate canonical event identity, and commit projections with cursor advancement atomically.

#### Scenario: Worker crashes before commit
- **WHEN** a worker restarts after fetching and reducing logs but before database commit
- **THEN** replay SHALL yield the same balances and listings with no duplicated allocation or skipped event.

#### Scenario: Same log arrives twice
- **WHEN** duplicate RPC logs or repeated batches are ingested
- **THEN** the unique identity and reducer SHALL apply each canonical log once.

#### Scenario: Database commit succeeded before crash
- **WHEN** cursor and projections were committed but the worker did not acknowledge completion
- **THEN** restart SHALL resume the persisted cursor without replaying financial effects twice.

### Requirement: IDX-004 Chain conflict and reorganization recovery
The service SHALL verify stored block hashes/ancestry and SHALL stop trusting affected projections when canonical history conflicts. Rebuild SHALL start from a verified common ancestor or deployment baseline.

#### Scenario: Persisted finalized hash changes
- **WHEN** restart detects a different hash for an indexed block
- **THEN** the worker SHALL mark affected projections REBUILDING, hold state-dependent API preparation, preserve incident evidence, and require verified ancestry before replay.

#### Scenario: Receipt overlay is orphaned
- **WHEN** a transaction receipt used by a CONFIRMED overlay disappears from canonical history
- **THEN** UI SHALL replace the success assumption with REORGED/PENDING state and reconcile the new canonical transaction instead of persisting ownership locally.

### Requirement: IDX-005 Chain and issuer finality are separate
The read model SHALL expose metadata coverage and asset sync/safety independently from blockchain finality. The database SHALL NOT infer claimability from issuer API status, elapsed wall time, or final chain receipts alone.

#### Scenario: Chain final but issuer classification missing
- **WHEN** a multiplier change is chain-finalized but its event classification is unresolved
- **THEN** the asset SHALL display the appropriate data hold and SHALL NOT expose unallocated estimated income as claimable.

#### Scenario: Metadata service unavailable
- **WHEN** issuer retrieval fails
- **THEN** the last verified coverage SHALL remain unchanged; independent read-only quote access and safe already-final claims SHALL not be blocked merely because the web index is late.

### Requirement: IDX-006 Derived lifecycle and immutable historical ownership
DTO display states SHALL be derived from stored contract state and pinned chain time. Claim balances SHALL remain owned by account/asset independently of current position owner.

#### Scenario: Active rights reach expiry
- **WHEN** an ACTIVE position has snapshot block time at or after endAt
- **THEN** displayState SHALL be SETTLING until settlement, without mutating storedState based only on a UI timer.

#### Scenario: Bob sells to Carol
- **WHEN** canonical resale changes rightsOwner to Carol
- **THEN** Bob's prior unclaimed account/asset shares SHALL remain available in his claim view and SHALL NOT become part of Carol's purchased position.

#### Scenario: Listing expires without transaction
- **WHEN** an OPEN listing's expiry is reached
- **THEN** displayStatus SHALL become EXPIRED while storedStatus remains OPEN until an applicable contract transaction.

### Requirement: IDX-007 Snapshot-stable paginated discovery
Listing discovery SHALL apply typed filters, compare only the configured payment currency, and use deterministic keyset pagination pinned to one snapshot. Cursor identity SHALL bind query, sort and deployment.

#### Scenario: Filter changes during paging
- **WHEN** a client reuses a cursor after changing chain, market, filters or sorting
- **THEN** the API SHALL reject that cursor and request a new first page.

#### Scenario: Market updates between pages
- **WHEN** new listings arrive after page one
- **THEN** page two SHALL continue the original snapshot without duplicate or omitted entries caused by insertion order.

#### Scenario: Incomparable duration filter
- **WHEN** duration filters are applied to primary and secondary listings
- **THEN** primary SHALL use offered duration and secondary SHALL use remaining original term at the shared snapshot.

### Requirement: IDX-008 Verified wallet sessions and private isolation
Private chat and intent persistence SHALL require verified Supabase Web3 sessions and wallet identity mapping. Wallet connection, user-editable metadata and a supplied address SHALL NOT authenticate a user.

#### Scenario: Wrong domain or expired sign-in
- **WHEN** SIWE signature/message has an invalid domain, URI, expiry or signature
- **THEN** no valid session SHALL be granted and the application SHALL not fall back to trusting wallet address text.

#### Scenario: Replayed authentication
- **WHEN** the same sign-in challenge/signature is replayed outside its permitted session initiation semantics
- **THEN** the configured auth implementation SHALL reject the replay; this SHALL be tested against the chosen runtime before authentication is considered complete.

#### Scenario: Native provider token bypass
- **WHEN** a caller obtains a provider token by bypassing the application challenge, replaying a native sign-in, or signing for a different chain
- **THEN** private APIs and database RLS SHALL deny access unless that provider session was admitted through a single-use application challenge bound to the configured chain and verified wallet; native provider acceptance alone SHALL NOT authenticate an application session.

#### Scenario: Account switch
- **WHEN** the connected wallet changes from Alice to Bob
- **THEN** Alice's private active context and previews SHALL be invalidated before private actions for Bob; Alice's history SHALL remain isolated.

### Requirement: IDX-009 RLS and least privilege protect nonchain data
Exposed database tables SHALL use explicit grants and RLS. Private rows SHALL bind auth.uid to owner; chain projections and verified wallet identities SHALL be writable only by authorized server workers. Service-role and updater secrets SHALL never enter browser or model context.

#### Scenario: Crossuser chat access
- **WHEN** Alice requests Bob's conversation or message IDs
- **THEN** API and database policy SHALL deny access without disclosing private content.

#### Scenario: Client attempts financial projection mutation
- **WHEN** a client tries to insert a listing or increase a claim balance directly through Supabase
- **THEN** the database SHALL reject the mutation regardless of the connected wallet address.

#### Scenario: Model supplies privileged role
- **WHEN** user input or a fabricated tool result claims a system role, verified wallet or updater authority
- **THEN** server validation SHALL ignore that authority claim and SHALL refuse privileged operations.

### Requirement: IDX-010 Internal worker commands are constrained and idempotent
Metadata publishing SHALL occur through a private operator worker with only registry permissions. Candidate revisions and evidence SHALL be separate from protocol-final records. Retries SHALL check registry/transaction state before resubmission.

#### Scenario: Timeout after publishing
- **WHEN** the worker loses the response after submitting an event transaction
- **THEN** it SHALL reconcile transaction nonce/hash and registered event identity before retry, rather than issue another payout event.

#### Scenario: Source corrects a committed record
- **WHEN** later evidence conflicts with an immutable protocol-final record
- **THEN** the worker SHALL hold affected progression and record an incident, not rewrite database history as if contract payouts were corrected.

#### Scenario: Public request attempts watermark update
- **WHEN** a browser or AI tool requests a metadata watermark/simulator mutation
- **THEN** no public route SHALL authorize it.

#### Scenario: Pending snapshot recurs after another acknowledgement
- **GIVEN** a finalized simulator schedule produces snapshot A, then B, then A again with unchanged pending nonce and activation time
- **WHEN** the private worker reconciles the recurring snapshot, with reused or renewed evidence
- **THEN** it SHALL bind acknowledgement identity to the latest onchain acknowledgement occurrence and target snapshot, not snapshot contents alone; the registry SHALL reach the current snapshot without reusing a historical confirmed job.

#### Scenario: Concurrent acknowledgement and restart
- **WHEN** workers retry the same acknowledgement transition concurrently or restart after losing the broadcast response
- **THEN** they SHALL reuse the durable command and signed transaction for that transition, retain evidence-conflict rejection, and avoid issuing a fresh nonce for the retry.

#### Scenario: Reviewed no-income event
- **GIVEN** a private reviewed report contains ABI kind 3 (NO_INCOME), verified equal multipliers and a new effective history occurrence
- **WHEN** it is parsed and reconciled
- **THEN** parsing SHALL preserve the classification and exact integers, and append, acknowledgement, coverage and checkpoint SHALL advance without creating income or reducing principal; invalid enum values SHALL remain rejected.

#### Scenario: Concurrent broadcast consumes the stored nonce
- **WHEN** an exact-hash transaction is initially absent but another worker broadcasts its durable signed bytes before the nonce is read
- **THEN** the worker SHALL recheck the exact receipt/transaction before treating the nonce as unresolved, and SHALL still validate receipt status and finality before confirmation; a genuinely unknown replacement SHALL remain held.

#### Scenario: Unsigned acknowledgement becomes obsolete
- **GIVEN** an acknowledgement job remains READY after a transient pre-signing failure and its pending schedule is replaced
- **WHEN** canonical finalized and live snapshots agree on a different target
- **THEN** the worker SHALL retire that unsigned job as SUPERSEDED, preserve its history, and permit a new reviewed reconciliation; it SHALL NOT infer obsolescence from an RPC failure or discard signed, nonce-assigned, pending or HELD work.

#### Scenario: Retired unsigned target recurs
- **GIVEN** a target was superseded before any acknowledgement was sent
- **WHEN** a later verified report observes the same target again
- **THEN** a new job MAY reuse its transition key while retaining the old SUPERSEDED record; concurrent submissions SHALL share a single non-superseded job.
