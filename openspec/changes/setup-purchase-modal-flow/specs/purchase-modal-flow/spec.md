## ADDED Requirements

### Requirement: Accessible purchase modal shell

The application MUST provide a reusable purchase dialog with the requested dark overlay, bounded card, close control, and four-step progress indicator.

#### Scenario: Open the purchase dialog

- **WHEN** a user activates `Buy income rights` for a known listing
- **THEN** a modal dialog opens over a dark `bg-black/80` backdrop
- **AND** the dialog exposes `role="dialog"`, `aria-modal="true"`, an accessible label, and a close button
- **AND** the progress indicator shows Review, Pay, Confirm, and Done with Review active

#### Scenario: Close and restore

- **WHEN** the user activates the close button or presses Escape
- **THEN** the dialog closes without sending a transaction
- **AND** the listing detail page remains available
- **AND** reopening starts at Review rather than retaining an unverified intermediate state

### Requirement: Review step and consent

The Review step MUST show the selected listing summary and require explicit acknowledgement of income risk before advancing.

#### Scenario: Review listing terms

- **WHEN** the modal opens for `L-0142`
- **THEN** it shows `Review and buy`, listing/seller/date metadata, dAAPL, 50% income sold, six months from purchase, dAAPL payout, `90 DemoUSD` fixed upfront price, and the illustrative estimated income
- **AND** it shows listing availability metadata and the disclaimer that income may be lower than estimated or zero

#### Scenario: Require review acknowledgement

- **WHEN** the risk checkbox is unchecked
- **THEN** Continue is disabled or otherwise unavailable
- **AND** no Pay step is entered
- **WHEN** the checkbox is checked and Continue is activated
- **THEN** the modal enters the Pay step

### Requirement: Pay quote step

The Pay step MUST expose the requested read-only payment quote and route selection without executing a swap.

#### Scenario: Review quote

- **WHEN** the user enters Pay
- **THEN** it shows the ETH payment selector, quote expiry, amount paid, minimum DemoUSD received, rate, swap fee, slippage options, and Route A/Route B totals
- **AND** Route A is selected by default
- **AND** Continue with Route A advances to Confirm without submitting a swap

#### Scenario: Quote unavailable

- **WHEN** the quote is expired, unavailable, or invalid
- **THEN** the modal shows an explicit unavailable state
- **AND** it does not substitute a fabricated quote or claim a successful payment

### Requirement: Confirm and demo completion states

The Confirm and Done steps MUST distinguish wallet confirmation from completed live ownership.

#### Scenario: Confirm in wallet

- **WHEN** the user enters Confirm
- **THEN** it shows the wallet identity, purchase summary, principal-retention explanation, and that ownership is not confirmed until receipt
- **AND** Open Wallet does not silently sign or send a transaction in the demo implementation

#### Scenario: Complete demo flow

- **WHEN** the demo confirmation action is activated
- **THEN** the modal enters Done with the supplied demo receipt fields and position identifier
- **AND** the receipt is explicitly labeled as a confirmed demo/simulated receipt
- **AND** the flow does not claim finalized onchain ownership or real income
- **AND** View position navigates to `/positions`

### Requirement: Canonical live purchase boundary

The modal MUST preserve the canonical purchase contract for any future live integration.

#### Scenario: Prepare a live purchase

- **WHEN** live wallet purchase support is enabled
- **THEN** the flow uses `BUY_LISTING` transaction-intent preparation for the selected listing key
- **AND** it revalidates account, chain, listing terms, allowance, deadline, and snapshot before wallet action
- **AND** the modal never accepts arbitrary recipient, calldata, target, or gas override from display input
- **AND** a receipt is only treated as successful after the existing transaction verification/finality rules
