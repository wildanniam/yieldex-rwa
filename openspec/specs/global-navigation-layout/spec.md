# global-navigation-layout Specification

## Purpose
TBD - created by archiving change wire-global-navigation-layout. Update Purpose after archive.
## Requirements
### Requirement: Global navigation shell

The web application MUST render the global navigation shell around every App Router page, with a full-height canvas, a 248px non-shrinking sidebar, and a main panel that can shrink without horizontal overflow.

#### Scenario: Render the shared shell

- **WHEN** a user opens any web page route
- **THEN** the page renders a flex container with `bg-canvas`, `min-h-screen`, and `text-text-1`
- **AND** the sidebar is rendered with `w-[248px]`, `shrink-0`, and `border-r border-border`
- **AND** the main panel is rendered with `flex-1`, `flex-col`, and `overflow-x-hidden`

### Requirement: Global top bar and content spacing

The main panel MUST render `AppTopBar` above page content and provide the approved sticky header and content spacing semantics.

#### Scenario: Render top bar and page content

- **WHEN** a page is rendered inside the global shell
- **THEN** `AppTopBar` is rendered at the top of the main panel
- **AND** the top bar uses sticky positioning, z-index 40, the translucent canvas background, backdrop blur, and a bottom border
- **AND** page children are rendered inside a `<main>` element with `p-8`

### Requirement: Active sidebar destination

The sidebar MUST determine its active item from the current pathname and expose the active state using the approved tint, green text, and current-page semantics.

#### Scenario: Highlight an exact destination

- **WHEN** the current pathname equals a sidebar destination href
- **THEN** that destination uses `bg-tint text-green-1`
- **AND** it exposes `aria-current="page"`

#### Scenario: Highlight a nested destination

- **WHEN** the current pathname starts with a sidebar destination href followed by `/`
- **THEN** the parent destination remains active
- **AND** unrelated destinations remain inactive

### Requirement: Routable navigation destinations

The application MUST provide a page route for every initial sidebar destination and every top-bar destination, including unbuilt screens as title-only placeholders.

#### Scenario: Open an unbuilt sidebar destination

- **WHEN** a user follows `/dashboard`, `/marketplace`, `/sell`, `/listings`, `/positions`, `/claims`, `/ai-assistant`, `/activity`, `/assets`, `/demo-console`, or `/settings`
- **THEN** the route resolves without a 404
- **AND** it renders a simple title container for the corresponding destination

#### Scenario: Open a top-bar destination

- **WHEN** a user follows any top-bar link
- **THEN** its target route resolves without a 404

### Requirement: Preserve existing functional routes

The global shell MUST not remove or bypass existing starter and functional routes.

#### Scenario: Open the functional marketplace lab

- **WHEN** a user opens `/lab`
- **THEN** the existing functional marketplace lab remains the page content
- **AND** it is rendered inside the global navigation shell

