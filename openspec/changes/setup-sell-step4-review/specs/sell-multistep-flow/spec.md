## MODIFIED Requirements

### Requirement: Sell flow shell and progress

The application MUST expose `/sell` as a five-step listing-creation flow inside the global navigation shell.

#### Scenario: Show Review progress

- **WHEN** a user advances from Terms to Review
- **THEN** the Asset, Deposit, Terms, and Review progress lines are highlighted with `bg-green-1`
- **AND** Confirm remains an inactive dark track
- **AND** the Sell heading and active Sell navigation landmark remain visible

### Requirement: Draft progression boundary

The flow MUST expose local draft actions that advance state without claiming an onchain result.

#### Scenario: Continue from Review

- **WHEN** a user is on Review and both required acknowledgements are checked
- **AND** the user activates `Publish listing` or the equivalent preview Continue action
- **THEN** the flow enters the Confirm step
- **AND** no wallet signature, transaction intent, listing publication, or chain mutation occurs

#### Scenario: Block Review progression without acknowledgements

- **WHEN** either Review acknowledgement is unchecked
- **THEN** `Publish listing` is disabled
- **AND** activating the preview Continue action cannot bypass the same acknowledgement gate
- **AND** the user remains on Review

## ADDED Requirements

### Requirement: Review listing summary

The Review step MUST show the current draft parameters before confirmation.

#### Scenario: Render default Review

- **WHEN** Review is rendered with the default Sell draft
- **THEN** the title is `Review your listing`
- **AND** the subtitle explains that the seller should verify parameters before signing and publishing
- **AND** the summary shows `dAAPL · Alice Hartono (0x7a3F...9c2E)`
- **AND** it shows `Backing locked: 100 dAAPL (Vault deposit confirmed)`
- **AND** it shows `Income share offered: 50% (You retain 50%)`
- **AND** it shows `Term length: 6 months (Starts on purchase)`
- **AND** it shows `Listing price: 90 DemoUSD (Fixed upfront payment)`

### Requirement: Review acknowledgements and editing

The Review step MUST provide two explicit acknowledgements and a local edit action.

#### Scenario: Acknowledge review requirements

- **WHEN** the user checks the Review acknowledgement controls
- **THEN** the UI records each control independently
- **AND** `Publish listing` becomes enabled only when both are checked
- **AND** the controls state that `100 dAAPL` is locked in the Yieldex Vault and that income rights transfer for six months upon purchase

#### Scenario: Edit terms

- **WHEN** the user activates `Edit terms`
- **THEN** the flow returns to Terms
- **AND** the selected asset, deposit amount, income share, price, and duration remain unchanged

### Requirement: Ready-to-publish preview

The right preview panel MUST reflect the Review draft and identify its status.

#### Scenario: Render Review preview

- **WHEN** Review is active with default values
- **THEN** the preview shows a `Ready to publish` status pill
- **AND** it shows backing `100 dAAPL`, income share `50%`, term `6 months`, and price `90 DemoUSD`
- **AND** the preview retains the payout-in-dAAPL, period-starts-at-purchase, and principal-remains-with-Alice disclosures
