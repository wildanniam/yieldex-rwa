## MODIFIED Requirements

### Requirement: Sell flow shell and progress

The application MUST expose `/sell` as a five-step listing-creation flow inside the global navigation shell.

#### Scenario: Show Deposit progress

- **WHEN** a user advances from Asset to Deposit
- **THEN** the Asset and Deposit progress lines are highlighted with `bg-green-1`
- **AND** Terms, Review, and Confirm remain inactive dark tracks
- **AND** the Sell heading and active Sell navigation landmark remain visible

### Requirement: Draft progression boundary

The flow MUST expose a Continue action that advances local draft state without claiming an onchain result.

#### Scenario: Continue from Deposit

- **WHEN** a user is on Deposit and activates Continue
- **THEN** the flow enters the Terms step
- **AND** no approval, vault deposit, wallet signature, or chain mutation occurs
- **AND** the draft remains visibly pending/unconfirmed

## ADDED Requirements

### Requirement: Deposit backing form

The Deposit step MUST explain and collect the amount of the selected backing asset without executing a deposit.

#### Scenario: Render dAAPL deposit

- **WHEN** the selected asset is dAAPL and the user enters Deposit
- **THEN** the title is `Deposit your backing`
- **AND** the subtitle says the principal remains Alice's and backs only this listing
- **AND** an `AmountInput` defaults to `100` with a `dAAPL` tag and `MAX` action
- **AND** it shows `≈ $10,000 USD · illustrative`
- **AND** it shows `Available for new deposit: 100 dAAPL`

#### Scenario: Explain vault deposit

- **WHEN** the Deposit step renders
- **THEN** it shows the vault notice that deposited tokens are locked as backing for this listing
- **AND** it states that the vault deposit is not a transfer of principal to a buyer
- **AND** it shows an exact allowance of `100 dAAPL`, not unlimited approval
- **AND** it shows destination `Yieldex Vault · Ethereum Sepolia`

### Requirement: Deposit status and wallet boundary

The Deposit step MUST distinguish completed approval, pending deposit, and unconfirmed wallet state.

#### Scenario: Show transaction checklist

- **WHEN** the Deposit step renders the supplied demo state
- **THEN** it shows `Approve dAAPL — Confirmed · exact allowance 100 dAAPL`
- **AND** it shows `Deposit to vault — In-wallet · confirm deposit of 100 dAAPL`
- **AND** it shows `Deposit awaiting your signature`
- **AND** `Open wallet` uses the accent action style
- **AND** activating it does not silently sign, approve, send, or claim a confirmed deposit

#### Scenario: Update draft preview

- **WHEN** the Deposit step is active
- **THEN** the right preview shows `Backing pending deposit`
- **AND** it retains the selected token, draft terms, payout token, and principal-remains-with-Alice disclosure
