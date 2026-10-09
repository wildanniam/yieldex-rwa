## ADDED Requirements

### Requirement: Sell flow shell and progress

The application MUST expose `/sell` as a five-step listing-creation flow inside the global navigation shell.

#### Scenario: Open Sell

- **WHEN** a user opens `/sell`
- **THEN** the top bar heading is `Sell`
- **AND** Sell is the active sidebar destination
- **AND** the stepper shows Asset, Deposit, Terms, Review, and Confirm
- **AND** Asset is the active step with a green-highlighted progress line
- **AND** the page uses a responsive form/preview split without horizontal overflow

### Requirement: Registered backing asset selection

The Asset step MUST allow selection only from registered backing assets and must expose the requested illustrative balances.

#### Scenario: Select dAAPL

- **WHEN** the Asset step opens
- **THEN** dAAPL is selected with a visible active border and check indicator
- **AND** it shows `Balance 100 dAAPL · $10,000 illustrative`
- **AND** it states that income is paid in the same token
- **AND** the draft preview uses dAAPL as its selected asset

#### Scenario: Show alternative registered assets

- **WHEN** the Asset step renders
- **THEN** it offers dNVDA with `Balance 40 dNVDA · $4,800 illustrative`
- **AND** it offers dKO with `Balance 250 dKO · $15,000 illustrative`
- **AND** selecting either registered asset updates the draft preview without depositing or publishing

#### Scenario: Disable unregistered token

- **WHEN** an unregistered token option is displayed
- **THEN** it is disabled and labeled `Not in the asset registry, cannot be deposited.`
- **AND** it cannot become the selected backing asset

### Requirement: Live draft preview

The right preview panel MUST reflect the selected asset and clearly identify the listing as a draft.

#### Scenario: Render dAAPL draft

- **WHEN** dAAPL is selected
- **THEN** the preview shows `Your listing`, `Draft preview`, dAAPL, seller Alice Hartono, and `Draft · not published`
- **AND** it shows backing `100 dAAPL`, income share `50% · draft`, term `6 months · draft`, and `90 DemoUSD · draft`
- **AND** it states `Backing not deposited`, payout in the selected token, period starts at purchase, and principal remains with Alice
- **AND** it includes the callout that only time-limited income rights are sold and this is not a loan

### Requirement: Draft progression boundary

The flow MUST expose a Continue action that advances local draft state without claiming an onchain result.

#### Scenario: Continue from Asset

- **WHEN** a registered asset is selected and the user activates Continue
- **THEN** the flow enters the Deposit step
- **AND** no token approval, deposit, listing, wallet signature, or chain mutation occurs
- **AND** the step remains visibly draft/unimplemented until the corresponding transaction flow is available

### Requirement: Canonical primary-listing boundary

Any future Confirm implementation MUST map the draft to the canonical primary-listing contract without inventing alternate fields.

#### Scenario: Prepare a primary listing

- **WHEN** live listing creation is enabled
- **THEN** it uses `CREATE_PRIMARY_LISTING` with `assetKey`, `depositTokenAmountAtomic`, `minReceivedShares`, `incomeBps`, `durationSeconds`, `priceAtomic`, and `listingExpiresAt`
- **AND** it revalidates wallet, chain, asset registration, token decimals, balance/allowance, and terms before wallet action
- **AND** it does not accept arbitrary recipient, target, calldata, or gas override from the form
