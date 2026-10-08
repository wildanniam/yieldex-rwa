## ADDED Requirements

### Requirement: QTE-001 Read-only quote boundary
The quote service SHALL return indicative token exchange estimates and deterministic comparisons only. It SHALL NOT expose swap/bridge calldata, request token approvals, sign permits, invoke wallets, submit transactions, or place CEX orders.

#### Scenario: Upstream includes allowance or transaction fields
- **WHEN** the provider response contains allowanceTarget, spender, signature, or transaction payload
- **THEN** the adapter excludes those fields from the public DTO and model context and performs no related action.

### Requirement: QTE-002 Exact asset identity
The initial quote registry SHALL support native ETH and Circle-issued USDC on Ethereum mainnet, Arbitrum One, and Base using chain-specific identity and decimals. Native ETH SHALL use a native TokenRef, while WETH and other bridged or similarly named assets SHALL remain separate identities.

#### Scenario: User asks for USDC.e or WETH
- **WHEN** the requested asset is not enabled in the quote registry
- **THEN** the service returns UNSUPPORTED and does not silently substitute native ETH or native-issued USDC.

#### Scenario: Provider requires native placeholder
- **WHEN** a native ETH quote is built for 0x
- **THEN** only the adapter maps the native identity to the documented sentinel, and the domain token remains kind NATIVE with no ERC-20 address.

### Requirement: QTE-003 Full-size exact-input estimation
The service SHALL support EXACT_INPUT requests with amountAtomic denominated in the sell token, query the full requested amount, and compare returned buy amounts. It SHALL NOT multiply a one-unit spot quote to estimate a large order.

#### Scenario: Sell 1000 ETH
- **WHEN** the user asks to exchange 1000 ETH to USDC
- **THEN** the provider request uses sellAmount `1000000000000000000000` and the result reflects the provider's route estimate for that full input.

#### Scenario: Buy with a fixed budget
- **WHEN** the user asks how much ETH can be bought for 1000 USDC
- **THEN** the request is EXACT_INPUT with sellAssetId USDC, buyAssetId ETH and amountAtomic `1000000000`.

### Requirement: QTE-004 Exact-output estimation and ceilings
The service SHALL support EXACT_OUTPUT requests with amountAtomic denominated in the buy token. It SHALL preserve the distinction between expected sellAmount and maximum sellAmount, and SHALL NOT rank a maximum as an expected input amount.

#### Scenario: Purchase exactly 2 ETH
- **WHEN** the user specifies a target of 2 ETH paid in USDC
- **THEN** the provider receives buyAmount `2000000000000000000` without sellAmount, and the card shows expected input and any maximum separately.

#### Scenario: Only a maximum is returned
- **WHEN** an otherwise valid exact-output response provides maxSellAmount but no expected sellAmount
- **THEN** the card may show the ceiling with its meaning, but that row is excluded from expected-cost ranking.

### Requirement: QTE-005 Origin and hypothetical comparisons
The service SHALL distinguish ORIGIN_CHAIN from HYPOTHETICAL_CHAINS. Origin-only comparisons SHALL query only the given origin. Multi-chain local quotes SHALL explicitly assume the assets already exist on each chain and SHALL exclude bridge costs and transfer time from claims.

#### Scenario: More output on another chain
- **WHEN** a hypothetical Base quote exceeds the Ethereum quote and the user's assets are on Ethereum
- **THEN** the result does not claim moving assets to Base is profitable and displays that transfer costs/time have not been included.

#### Scenario: Origin is missing
- **WHEN** an origin-based recommendation is requested without a known origin chain
- **THEN** the user is asked to choose the origin instead of the model silently assuming one.

### Requirement: QTE-006 Fee provenance and no double counting
The service SHALL distinguish fees embedded in provider amounts, additional fees, and unknown fee treatment. Missing fees SHALL remain unknown rather than zero. Network cost coverage, approvals, and bridge exclusions SHALL be visible.

#### Scenario: Fee already included
- **WHEN** a provider returns output 990 USDC inclusive of a 10 USDC fee
- **THEN** the output remains 990 USDC and the fee is not subtracted a second time.

#### Scenario: Gas is missing
- **WHEN** one route has no verified gas estimate
- **THEN** gas is null/unknown and the route is not described as free or best after all costs.

### Requirement: QTE-007 Comparable deterministic ranking
Ranking SHALL use exact integer arithmetic, one common basis per comparison, and only valid fresh comparable rows. Default basis SHALL be GROSS_OUTPUT descending for exact-input or GROSS_INPUT ascending for exact-output. Net ranking SHALL require complete fees for the declared scope and a verified common denomination for every ranked row.

#### Scenario: Different expected and maximum ordering
- **WHEN** A has expected6000/max6060 USDC and B expected6010/max6040 USDC
- **THEN** A ranks first for expected input and B's smaller ceiling is separately described without confusing the two metrics.

#### Scenario: Gas token differs from ranking token
- **WHEN** gas is in ETH but ranking output is in USDC and no verified conversion exists
- **THEN** the batch uses gross-output ranking and displays ETH gas separately.

#### Scenario: Only one valid row
- **WHEN** all but one chain have no usable result
- **THEN** the UI calls it the single available quote, not a proved best market route.

### Requirement: QTE-008 Quote freshness
The service SHALL record server observedAt, optional provider blockNumber, and expiresAt. Initial quote TTL SHALL be 30 seconds, cache reuse SHALL be at most 10 seconds without resetting timestamps, and compared row timestamps SHALL be no more than 10 seconds apart.

#### Scenario: Exact expiry boundary
- **WHEN** now equals expiresAt
- **THEN** the card is stale and does not provide an active recommendation without refresh.

#### Scenario: Cached quote is reused
- **WHEN** a new request reuses a valid cached result
- **THEN** observedAt and expiresAt retain their original values and the new requestId does not make the market observation newer.

### Requirement: QTE-009 Bounded requests and partial failures
The service SHALL limit a batch to three unique supported chains, issue at most one upstream request per chain, apply 8-second upstream timeouts and a 10-second batch deadline, and preserve failed row statuses alongside successful rows. Automatic retries within the same batch SHALL NOT conceal delays or rate limits.

#### Scenario: Provider rate limits a chain
- **WHEN** the upstream returns a rate-limit response
- **THEN** that row is RATE_LIMITED with a retry hint where available, and successful rows remain usable according to the ranking rules.

#### Scenario: No route exists
- **WHEN** liquidityAvailable is false
- **THEN** the row is NO_ROUTE rather than a zero-output quote.

### Requirement: QTE-010 Strict provider mapping
The initial adapter SHALL use 0x v2 indicative price with fixed server-owned endpoint, API headers, token registry and exactly one amount parameter. It SHALL verify response identities and mode-specific bounds, and SHALL reject malformed or mismatched responses.

#### Scenario: Response pair differs
- **WHEN** the provider response returns a different sell or buy identity than requested
- **THEN** the service marks INVALID_RESPONSE and does not display or rank the amount as the requested pair.

#### Scenario: Contradictory bounds
- **WHEN** minBuyAmount exceeds buyAmount or maxSellAmount is below expected sellAmount
- **THEN** validation rejects the row before ranking.

### Requirement: QTE-011 No false predictions or execution promises
The assistant and UI SHALL describe quotes as current indicative calculations, not predictions of future fills or guaranteed execution. Slippage tolerance SHALL be labeled as a scenario parameter, price impact SHALL use verified data or null, and no fabricated confidence percentage SHALL be shown.

#### Scenario: User selects 0.50 percent tolerance
- **WHEN** slippageBps is 50
- **THEN** the card does not say the user will lose 0.50 percent, and does not claim the application will enforce that limit on an external venue.

### Requirement: QTE-012 Source and coverage transparency
Each card SHALL identify the quote provider, chain, full token amounts, source route names when available, observation time, fee coverage, and environment. Aggregator route output SHALL NOT be represented as every market or as a single pool when it is multi-hop or split.

#### Scenario: Provider aggregates several sources
- **WHEN** route fills include multiple liquidity venues
- **THEN** the card identifies the candidate as the provider's aggregated route and avoids claiming it is a separate quote for every pool.

### Requirement: QTE-013 Simulation and integration evidence
Simulated fixtures SHALL be explicitly labeled and SHALL NOT silently replace a failing live provider. The live integration gate SHALL require read-only exact-input and exact-output smoke tests for both supported directions on each enabled chain; missing credentials SHALL be recorded as blocked rather than passed.

#### Scenario: Provider key unavailable
- **WHEN** the deployment has no working 0x key
- **THEN** live quotes are unavailable, a deliberate fixture mode is visibly simulated, and no live integration success is claimed.

### Requirement: QTE-014 Numeric and request safety
The service SHALL validate nonzero uint256 amounts, registry decimals, distinct token identities, supported chains, unique chainIds, comparison scope, and slippageBps before contacting the provider. Amount formatting SHALL NOT silently round excess precision or pass through floating-point numbers.

#### Scenario: Excess USDC precision
- **WHEN** the user inputs `1.0000001` USDC
- **THEN** the input is rejected with a precision explanation instead of becoming a different amount.

#### Scenario: Unsupported arbitrary endpoint
- **WHEN** user/model content attempts to set provider URL or recipient
- **THEN** schema validation rejects those fields and only the server-configured price endpoint can be called.
