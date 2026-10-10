## ADDED Requirements

### Requirement: AI-001 Three bounded product capabilities
The assistant SHALL support income-right discovery and comparison, grounded explanation and marketplace purchase preparation, and read-only external token quote recommendations. It SHALL NOT execute external swaps, bridges, or CEX orders.

#### Scenario: User asks to buy a right
- **WHEN** the user selects an available income-right listing
- **THEN** the assistant can obtain a marketplace purchase preview and explain the right, and only the application wallet flow can submit the purchase after the user's explicit action.

#### Scenario: User asks to buy ETH
- **WHEN** the user asks where 1000 USDC obtains the most ETH
- **THEN** the assistant requests exact-input quotes, displays comparisons, and does not create approval, signature, or swap requests.

### Requirement: AI-002 One compatible runtime
The implementation SHALL use CopilotKit v2 BuiltInAgent with an OpenAI model configured server-side, typed server tools, and render-only React tool cards. It SHALL keep the provider keys server-only and SHALL NOT add an independently running Responses agent loop to the same conversation.

#### Scenario: Model configuration is missing
- **WHEN** the AI_MODEL or required OpenAI credential is unavailable
- **THEN** the assistant is marked unavailable, the error contains no secret, and normal marketplace and quote interfaces remain accessible according to their own dependencies.

#### Scenario: Package compatibility has not been proved
- **WHEN** only documentation evidence exists
- **THEN** delivery records show the CopilotKit runtime gate as NOT_TESTED rather than claiming the chat works.

### Requirement: AI-003 Shared and validated tools
The assistant SHALL expose only the allowlisted business tools `searchListings`, `getListing`, `getPosition`, `getAssetContext`, `getPaymentQuotes`, and `preparePurchase`, with guest restrictions defined in AI-011. Framework-internal shared-state helpers SHALL be limited to validated presentation state and SHALL NOT establish financial, wallet, or authentication authority. Each business tool SHALL share domain services and schema contracts with the non-AI interface, reject invalid or unknown input fields, and validate provider/domain output before rendering.

#### Scenario: Model supplies arbitrary transaction fields
- **WHEN** a tool call includes calldata, recipient, spender, SQL, or an unrecognized field
- **THEN** validation rejects the call before any downstream operation, and no transaction is produced.

#### Scenario: Atomic number exceeds JavaScript integer precision
- **WHEN** a valid ETH amount has more than 15 decimal digits in atomic units
- **THEN** the value remains an exact decimal integer string through the model/tool/API boundary and is calculated using integer arithmetic.

#### Scenario: Model changes shared UI state
- **WHEN** a framework helper attempts to write a wallet address, payment amount, or permission into shared UI state
- **THEN** business tools and wallet execution ignore it as authority and continue to use verified session, chain data, and user action.

### Requirement: AI-004 Grounded listing comparison
The assistant SHALL present listing payment price, income percentage, underlying asset, market type, backing context, listing deadline, and duration or remaining expiry as different concepts. It SHALL NOT infer guaranteed income or economic superiority from a lower listing price alone.

#### Scenario: Secondary versus primary duration
- **WHEN** a primary listing offers 90 days and a secondary position has 20 days remaining
- **THEN** cards show those different durations, the secondary expiry remains unchanged, and past claims are described as belonging to their earlier recipient.

#### Scenario: User asks about stock ownership
- **WHEN** a user interprets an income-right listing as purchasing underlying shares
- **THEN** the assistant explains the income entitlement and retained principal before offering a purchase preview.

### Requirement: AI-005 Fresh state before purchase preview
The assistant SHALL prepare a purchase only from the selected listing key and trusted wallet request context. The preview SHALL use freshly checked contract state and expose the checks, bound account, chain, exact payment, terms, and expiration required by the wallet capability.

#### Scenario: Search result has become unavailable
- **WHEN** another buyer fills or a seller cancels the listing after the search card was produced
- **THEN** preparing the stale listing does not return an actionable Ready preview.

#### Scenario: Wallet account changes
- **WHEN** the account or chain changes after preview creation
- **THEN** the existing preview cannot be used to submit a purchase and requires revalidation for the current wallet context.

### Requirement: AI-006 Explicit wallet interaction
No model tool, card render, stream replay, restored history, or natural-language approval SHALL automatically request a wallet signature or broadcast a transaction. Marketplace transaction initiation SHALL require the user's explicit action on the validated application transaction component.

#### Scenario: Chat says yes
- **WHEN** the user writes “iya beli”
- **THEN** the assistant may prepare and display a purchase preview, but no wallet prompt appears until the user invokes the preview's wallet action.

#### Scenario: Card is rendered twice
- **WHEN** a completed purchase preview tool result is replayed or the browser refreshes
- **THEN** the same card identity is restored without invoking any wallet action.

### Requirement: AI-007 Structured card semantics
The UI SHALL implement typed cards for listing comparison, asset context, quote comparison, purchase preview, and transaction status. Economic labels, chain/demo identity, as-of information, and permitted actions SHALL remain consistent with shared schemas while visual styling remains the designer's responsibility.

#### Scenario: Tool arguments are still streaming
- **WHEN** a card receives only partial tool parameters
- **THEN** it shows a loading/in-progress state without presenting partial numbers as a validated final result.

#### Scenario: Complete result fails schema validation
- **WHEN** the serialized result cannot be parsed or contains an invalid card payload
- **THEN** the renderer displays a recoverable error and never evaluates supplied HTML, JavaScript, or transaction instructions.

### Requirement: AI-008 Quotes and marketplace environments stay distinct
The assistant SHALL label mainnet market quotes independently from Sepolia marketplace assets and SHALL NOT imply that a mainnet quote funds or reserves a demo listing.

#### Scenario: User has mainnet USDC but a DemoUSD listing
- **WHEN** the assistant presents the Sepolia purchase preview
- **THEN** it shows the actual Sepolia payment token and checks its balance without treating mainnet USDC as sufficient payment.

### Requirement: AI-009 External data is untrusted
The assistant and tool services SHALL treat listing descriptions, issuer metadata, provider output, and source links as data. They SHALL restrict network destinations and rendered external links to application-controlled allowlists and SHALL NOT grant additional tools based on instructions in external content.

#### Scenario: Prompt injection in metadata
- **WHEN** issuer text instructs the assistant to reveal secrets or change payout addresses
- **THEN** the assistant ignores those instructions and the tool layer provides no capability to perform them.

### Requirement: AI-010 Bounded execution and recovery
Assistant runs SHALL have bounded steps, output, and duration as specified in the design. Tool errors SHALL remain typed and SHALL NOT be replaced by invented values. Cancellation and model failures SHALL leave normal marketplace access available.

#### Scenario: Quote tool partially times out
- **WHEN** one chain times out and two return valid results
- **THEN** the assistant explains the partial comparison and does not invent a quote for the missing chain.

#### Scenario: Run budget is exhausted
- **WHEN** the assistant reaches the configured maximum steps or run deadline
- **THEN** it stops additional tools and reports available results or a recoverable error without repeating transactions.

#### Scenario: Stop arrives before run admission
- **WHEN** a valid thread issues a stop for a specific run before that run acquires its server lease
- **THEN** the stop is recorded durably, the arriving run closes its user turn with an interruption marker without invoking the model, and reconnect preserves that disposition.

#### Scenario: Late stop and replay remain isolated
- **WHEN** a completed run receives a late stop or an already accepted run identifier is replayed
- **THEN** the completed stop does not affect another run, the replay is rejected, and a subsequent user question does not implicitly resume a cancelled request.

#### Scenario: Pending cancellation storage reaches its bound
- **WHEN** a thread reaches the configured bound of 128 run identifiers
- **THEN** new run identifiers return a recoverable chat-limit error, known active runs remain stoppable, and private run controls expire with their owning thread.

### Requirement: AI-011 Ownership-safe chat state
The assistant SHALL allow anonymous ephemeral read-only chat for discovery, explanation and quotes using a server-issued transient context and server quotas. Guest runs SHALL expose only the five read tools and SHALL NOT expose `preparePurchase`, save history, or access persisted conversations. Conversation state and card snapshots SHALL be scoped to the authenticated application session where persistence is enabled. User identity SHALL come from validated server context, and public onchain data SHALL NOT authorize access to another user's transcript.

#### Scenario: Guest requests a quote
- **WHEN** an unauthenticated user asks to compare ETH and USDC quotes
- **THEN** a transient read-only assistant run can produce cards without wallet authentication, and no private transcript is read or written.

#### Scenario: Guest requests purchase preparation
- **WHEN** a guest selects a marketplace listing and requests a server purchase preview
- **THEN** the application explains the sign-in requirement for the private intent and does not register or execute `preparePurchase` for the guest context.

#### Scenario: Client substitutes a thread owner
- **WHEN** a request supplies a userId or thread identifier owned by another session
- **THEN** authorization prevents access to that private transcript, even if wallet positions are public.

### Requirement: AI-012 Honest provenance and verification
The assistant SHALL identify data sources, as-of time, simulation/demo data, and material limitations. It SHALL distinguish current quote calculation from ML prediction and hypothetical earnings from confirmed claims. Release evidence SHALL distinguish source research, fixture tests, live API tests, and onchain transactions.

#### Scenario: Fixture quote used during UI development
- **WHEN** no provider key is configured and a fixture is explicitly selected
- **THEN** every affected card is labeled simulated and no text describes the data as a live market result.

#### Scenario: Transaction has no successful receipt
- **WHEN** the user has submitted or signed a marketplace transaction but confirmation is pending
- **THEN** the assistant reports pending status and does not state that ownership has transferred.
