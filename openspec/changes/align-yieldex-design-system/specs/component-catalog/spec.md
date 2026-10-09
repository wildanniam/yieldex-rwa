## ADDED Requirements

### Requirement: CAT-001 Shared component reference
The web app SHALL expose `/design-system` using the actual shared buttons, ten form controls, color/type tokens and all 40 typed icons. Sample financial values SHALL be labeled simulated and SHALL NOT initiate a wallet transaction.

#### Scenario: Inspecting a button state
- **WHEN** a collaborator visits the catalog
- **THEN** all four variants, three sizes and six states are present, with forced visual states distinguished from native interactive controls.

### Requirement: CAT-002 Interactive and responsive verification
The catalog SHALL provide native keyboard-operable examples for button submit/loading and form editing, error and disabled states without horizontal page overflow on 320 px or wider viewports.

#### Scenario: Trying disabled fields
- **WHEN** a collaborator selects the disabled form state
- **THEN** fields and related eye/MAX controls reject changes, and returning to the default state retains the edited values.

### Requirement: CAT-003 Source provenance and boundaries
The repository SHALL document source Figma nodes, local asset dimensions and fingerprints, font license, and the boundary between shared components and incomplete page-level slicing.

#### Scenario: Updating an icon
- **WHEN** an SVG is re-exported from Figma
- **THEN** its root geometry is preserved and its provenance manifest is updated after review, while the typed name inventory remains consistent.
