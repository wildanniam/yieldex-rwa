## ADDED Requirements

### Requirement: LSS-001 Responsive Application Shell
The web application SHALL use a shared responsive shell with a board no wider than 1440px, a centered content frame no wider than 1200px, a 72px topbar, a 248px desktop sidebar, and 32px main-content padding. At a 1440px viewport, the 1200px content frame SHALL leave 120px outer margins. The main content area SHALL provide a 12-column grid with 24px gutters. Narrower viewports SHALL use fluid gutters and SHALL keep navigation and content reachable without horizontal overflow.

#### Scenario: Desktop shell dimensions
- **GIVEN** the web application is rendered at a 1440px viewport width
- **WHEN** the shared shell is displayed
- **THEN** the board is at most 1440px wide, the content frame is 1200px wide with 120px outer margins, the topbar is 72px high, and the desktop sidebar is 248px wide
- **AND** main content has 32px padding and a 12-column grid with 24px gutters

#### Scenario: Narrow viewport shell
- **GIVEN** the viewport is narrower than the desktop content frame
- **WHEN** the shared shell adapts to the available width
- **THEN** it does not retain fixed 120px side margins or create horizontal overflow
- **AND** navigation and main content remain reachable

### Requirement: LSS-002 Shared Spacing Rhythm
The web UI SHALL use the shared Tailwind spacing utilities for the approved rhythm: `2` = 8px, `4` = 16px, `6` = 24px, `8` = 32px, `12` = 48px, `16` = 64px, and `24` = 96px. Shared shell and surface spacing SHALL use these values rather than introducing competing values for the same roles.

#### Scenario: Applying approved spacing utilities
- **WHEN** a shell or shared surface uses `gap-*` or `p-*` with an approved rhythm value
- **THEN** Tailwind resolves the utility to its specified pixel value
- **AND** 24px grid gutters and 32px content padding remain consistent with the shell dimensions

### Requirement: LSS-003 Shared Radius Tokens
The web design system SHALL expose Tailwind border-radius utilities for cards at 24px (`rounded-card`), inner surfaces at 16px (`rounded-inner`), and inputs at 12px (`rounded-input`). Actions SHALL use pill geometry (`rounded-full`).

#### Scenario: Applying shared radius utilities
- **WHEN** a card, inner surface, input, or action uses its semantic radius utility
- **THEN** its computed radius is respectively 24px, 16px, 12px, or pill-shaped

### Requirement: LSS-004 Flat Card and Input Surfaces
Shared cards SHALL use a 1px border from the existing `--border` token at 40% opacity, `rounded-card`, and zero box shadow. Text inputs, selects, and textareas SHALL use a 1px border from the existing `--input-border` token and `rounded-input`. These rules MUST reuse the color-system tokens and MUST NOT add unapproved colors, decorative gradients, or shadows.

#### Scenario: Rendering a card surface
- **WHEN** a shared card surface is rendered
- **THEN** it has a 1px `border-border` border, a 24px radius, and no box shadow

#### Scenario: Rendering a form control
- **WHEN** a text input, select, or textarea is rendered without focus
- **THEN** it has a 1px `--input-border` border and a 12px radius

### Requirement: LSS-005 Green-2 Input Focus
Keyboard-visible focus on text inputs, selects, and textareas SHALL use the existing `green-2` token for the focus border and visible focus indicator. Focus styling MUST remain visible without relying on color change alone.

#### Scenario: Focusing a form control
- **GIVEN** a text input, select, or textarea is focused using the keyboard
- **WHEN** its focus-visible state is rendered
- **THEN** its border and visible focus indicator use the existing `green-2` token
- **AND** the focus state remains visually distinguishable from its unfocused state
