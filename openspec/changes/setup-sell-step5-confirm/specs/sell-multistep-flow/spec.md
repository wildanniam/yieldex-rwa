## MODIFIED Requirements

### Requirement: Sell flow shell and progress

The application MUST expose `/sell` as a five-step listing-creation flow inside the global navigation shell.

#### Scenario: Show Confirm progress

- **WHEN** a user advances from Review to Confirm
- **THEN** all five progress lines are highlighted with `bg-green-1`
- **AND** the Confirm step is the active step
- **AND** the Sell heading and active Sell navigation landmark remain visible

### Requirement: Draft progression boundary

The flow MUST expose a final local action without claiming an onchain result.

#### Scenario: Block creation without risk acknowledgement

- **WHEN** the Confirm risk acknowledgement is unchecked
- **THEN** `Create listing` is disabled
- **AND** activating the action cannot route away or claim completion

#### Scenario: Simulate listing creation

- **WHEN** the user checks the risk acknowledgement and activates `Create listing`
- **THEN** the application shows a success notification explicitly identified as simulated/demo
- **AND** the application navigates to the existing My Listings route `/listings`
- **AND** no wallet signature, token approval, transaction intent, listing publication, or chain mutation occurs

## ADDED Requirements

### Requirement: Confirm rights summary

The Confirm step MUST show the final draft rights and payment summary.

#### Scenario: Render default Confirm

- **WHEN** Confirm is rendered with the default Sell draft
- **THEN** the title is `Review before creating`
- **AND** the subtitle states that creating a listing does not sell or transfer principal
- **AND** it shows `Backing: Locked 100 dAAPL`
- **AND** it shows `Retained rights: You keep 50% of income`
- **AND** it shows `Buyer income share: 50%`
- **AND** it shows `Duration: Period starts at purchase, ends after 6 months`
- **AND** it shows `Income token: Payout in dAAPL`
- **AND** it shows `Upfront payment: Price 90 DemoUSD`

### Requirement: Confirm fee and cancellation disclosure

The Confirm step MUST disclose the simulated network fee and cancellation semantics.

#### Scenario: Render Confirm notices

- **WHEN** Confirm is rendered
- **THEN** it shows `Network fee`
- **AND** it states `Paid separately in ETH`
- **AND** it shows `about 0.0007 ETH (simulated)`
- **AND** it explains `You can cancel until it is sold; cancelling releases your backing.`
- **AND** it explains that backing remains locked for the income-rights obligation after purchase and the buyer receives income rights only

### Requirement: Confirm risk acknowledgement

The Confirm step MUST provide the final risk acknowledgement.

#### Scenario: Acknowledge creation risk

- **WHEN** the user checks the Confirm risk checkbox
- **THEN** it states `I understand income may be lower than estimated or zero.`
- **AND** the supporting text states `Checked · required before creating the listing.`
- **AND** `Create listing` becomes enabled

### Requirement: Final listing preview

The right preview MUST retain the current draft values while Confirm is active.

#### Scenario: Render Confirm preview

- **WHEN** Confirm is active with default values
- **THEN** the preview shows `100 dAAPL`, `50%`, `6 months`, and `90 DemoUSD`
- **AND** it retains the payout-in-dAAPL, period-starts-at-purchase, and principal-remains-with-Alice disclosures
- **AND** the final action is a full-width `Create listing` CTA gated by the Confirm risk acknowledgement
