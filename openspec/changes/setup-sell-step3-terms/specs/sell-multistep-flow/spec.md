## MODIFIED Requirements

### Requirement: Sell flow shell and progress

The application MUST expose `/sell` as a five-step listing-creation flow inside the global navigation shell.

#### Scenario: Show Terms progress

- **WHEN** a user advances from Deposit to Terms
- **THEN** the Asset, Deposit, and Terms progress lines are highlighted with `bg-green-1`
- **AND** Review and Confirm remain inactive dark tracks
- **AND** the Sell heading and active Sell navigation landmark remain visible

### Requirement: Draft progression boundary

The flow MUST expose a Continue action that advances local draft state without claiming an onchain result.

#### Scenario: Continue from Terms

- **WHEN** a user is on Terms and activates Continue
- **THEN** the flow enters the Review step
- **AND** changing terms or continuing does not approve, deposit, publish, sign, or mutate the chain
- **AND** the draft remains explicitly illustrative until confirmation is implemented

### Requirement: Live draft preview

The right preview panel MUST reflect the selected asset and clearly identify the listing as a draft.

#### Scenario: Render Terms preview

- **WHEN** Terms is active with the default values
- **THEN** the preview shows backing `100 dAAPL`, income share `50%`, term `6 months`, price `90 DemoUSD`, and estimated income `about 1.00 dAAPL`
- **AND** it states that backing is locked for this listing, payout is in dAAPL, period starts at purchase, and principal remains with Alice

## ADDED Requirements

### Requirement: Listing terms controls

The Terms step MUST expose bounded income-share, fixed-price, and duration controls.

#### Scenario: Render default terms

- **WHEN** the user enters Terms after the deposit step
- **THEN** the title is `Set your listing terms`
- **AND** the subtitle explains income share, fixed price, and period offered to the buyer
- **AND** it shows `Deposit confirmed · locked for this draft (100 dAAPL)`
- **AND** it shows `Available for new deposit: 0 dAAPL · This draft's vault backing is eligible`
- **AND** the income-share control ranges from 10% to 100% and defaults to 50%
- **AND** it shows buyer share 50% and seller share 50%
- **AND** it provides price `90 DemoUSD` and duration options `1m`, `3m`, `6m`, and `12m`, with 6m selected

#### Scenario: Update terms and preview

- **WHEN** the user changes income share, price, or duration
- **THEN** the control state updates without a chain side effect
- **AND** the right preview reflects the selected share, price, and duration
- **AND** the breakdown states that only income during the purchased period is split and principal stays with the seller

### Requirement: Illustrative income estimate

The Terms step MUST disclose the income estimate as illustrative and non-guaranteed.

#### Scenario: Show estimated buyer income

- **WHEN** Terms is rendered for dAAPL
- **THEN** it shows `Estimated income to buyer`
- **AND** it shows `about 1.00 dAAPL` in the specified blue/purple treatment
- **AND** it shows `Illustrative only · not guaranteed; may be zero`
- **AND** it shows `Source: Simulated issuer feed`
- **AND** it shows `Updated 07 Oct 2026 10:42 UTC`
