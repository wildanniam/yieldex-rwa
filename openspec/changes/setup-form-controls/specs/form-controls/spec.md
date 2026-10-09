## ADDED Requirements

### Requirement: FCT-001 Shared Field Geometry and States
All field-like controls SHALL use 48px height where applicable, 12px radius, `bg-card`, a 1px `input-border` border, green-2 focus treatment, danger error treatment, and 40% opacity/not-allowed cursor when disabled. Labels SHALL use text-1 at 14px/20px, weight 500 and helper/error copy SHALL use 12px text.

#### Scenario: Default, focus, and disabled field
- **WHEN** a field is rendered default, keyboard-focused, or disabled
- **THEN** it has the shared geometry and tokens, green-2 visible focus, or disabled opacity/cursor respectively

### Requirement: FCT-002 Error Helper Replacement
Every reusable control that supports helper text SHALL accept `error?: string`; when present, it SHALL render danger styling and replace the normal helper text.

#### Scenario: Error state
- **GIVEN** `error="Enter a listing reference."`
- **WHEN** a control renders
- **THEN** the error appears in danger styling and the normal helper copy is not rendered

### Requirement: FCT-003 Text, Password, and Amount Inputs
The input component SHALL provide text, password, and amount controls. Password fields SHALL toggle visibility with shared eye icons. Amount fields SHALL support currency pill, MAX action, supplied simulated USD conversion, and `SIMULATED · Sepolia` status display.

#### Scenario: Password and amount affordances
- **WHEN** password or amount input renders
- **THEN** the password toggle or amount metadata uses the shared tokens/icons and remains keyboard accessible

### Requirement: FCT-004 Select, Slider, and Segmented Control
Select SHALL provide a chevron affordance; slider SHALL expose percentage value, 0%/100% labels, and green-1 active track; segmented control SHALL expose keyboard-selectable options with a green/tint active state.

#### Scenario: Selecting and adjusting controls
- **WHEN** a user selects an option or adjusts the range
- **THEN** the selected state/value is exposed through native or ARIA semantics and the visual active state uses approved tokens

### Requirement: FCT-005 Checkbox and Toggle
Checkbox SHALL expose checked state, label, description, and error semantics. Toggle SHALL expose switch semantics and Disabled/Enabled status text.

#### Scenario: Checkbox and toggle state
- **WHEN** checkbox or toggle changes
- **THEN** the new state is available to assistive technology and the adjacent status/description stays synchronized

### Requirement: FCT-006 OTP and Search Controls
OTPBox SHALL provide individual single-character slots with keyboard/paste behavior and error support. SearchField SHALL include the shared search icon and a `⌘K` shortcut tag while preserving an accessible label.

#### Scenario: OTP and search interaction
- **WHEN** a user enters an OTP or searches
- **THEN** focus/value behavior is predictable, errors replace helper text, and the search affordances do not replace the accessible name

### Requirement: FCT-007 No External Icon Library
Form controls SHALL reuse the existing `Icon` component and SHALL NOT import or add an external icon library.

#### Scenario: Reviewing control dependencies
- **WHEN** form-control implementations are reviewed
- **THEN** icons resolve through the shared component and no external icon dependency is introduced

### Requirement: FCT-008 Consistent Accessible Field State
Controls SHALL generate IDs when omitted and associate labels/messages. Error treatment SHALL persist on focus. Password/amount adornments SHALL stay inside the control regardless of labels/helpers and respect disabled state. Controlled and uncontrolled toggle/range state SHALL match visible outputs. Segments SHALL support radio arrow-key behavior. OTP deletion SHALL preserve occupied slot positions and disabled paste SHALL not update value.

#### Scenario: Recovery and keyboard
- **WHEN** an uncontrolled switch or range changes, or a segment changes using arrows
- **THEN** its displayed and accessible state matches the actual selection
- **AND** clearing an OTP slot keeps later occupied slots in their original positions
