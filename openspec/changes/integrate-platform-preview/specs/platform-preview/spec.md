## ADDED Requirements

### Requirement: Consistent product navigation
The product preview SHALL share one background and shell while the root remains a landing page and the wallet console remains separate.

#### Scenario: Visitor opens the application
- **WHEN** a visitor follows Launch app and then Marketplace
- **THEN** the portfolio and marketplace share the approved sidebar/background and active navigation matches the current page

### Requirement: Honest preview listings
The marketplace SHALL label examples, use supported token identities, derive counts from visible results and resolve every offer to matching details.

#### Scenario: Visitor narrows offers
- **WHEN** the visitor searches, filters, sorts or paginates
- **THEN** the results reflect those controls and unknown offer IDs do not resolve to unrelated data

### Requirement: Draft actions stay unsigned
Purchase and creation previews SHALL never claim a successful wallet or chain transaction and SHALL provide a clear handoff to the existing console.

#### Scenario: User reviews a draft
- **WHEN** the user completes valid preview inputs
- **THEN** the final state reports readiness for wallet review without claiming approval, payment, deposit or publication

#### Scenario: Draft data changes
- **WHEN** the user changes asset, amount or terms
- **THEN** the review reflects the latest valid values and prior risk acknowledgement is reset

### Requirement: Accessible responsive preview
The preview SHALL preserve visible focus, usable mobile navigation, native modal dismissal and readable loading/error states.

#### Scenario: Close the menu or purchase dialog
- **WHEN** the user presses Escape
- **THEN** the open overlay closes and focus returns to its trigger
