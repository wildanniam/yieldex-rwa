# custom-iconography Specification

## Purpose
TBD - created by archiving change setup-custom-iconography. Update Purpose after archive.
## Requirements
### Requirement: ICO-001 Canonical SVG Inventory
The icon system SHALL treat `.svg` files directly under `apps/web/public/icons/` as the only valid icon assets. `IconName` SHALL be a string-literal union of the available basenames without the `.svg` suffix, and SHALL NOT include invented or missing filenames.

#### Scenario: Scanning available assets
- **GIVEN** `apps/web/public/icons/search.svg` and `apps/web/public/icons/wallet.svg` exist
- **WHEN** the icon inventory is generated or updated
- **THEN** `IconName` includes `'search' | 'wallet'` for those assets
- **AND** each name resolves to `/icons/<name>.svg`

#### Scenario: Empty inventory
- **GIVEN** no SVG files exist under `apps/web/public/icons/`
- **WHEN** the icon capability is prepared
- **THEN** no usable icon name is claimed
- **AND** no missing filename is added to the type union

### Requirement: ICO-002 Type-Safe Next Image Component
The shared `Icon` component SHALL be available at `components/ui/icon.tsx`, use `next/image`, and accept an inventory-derived `name`, optional numeric `size` defaulting to 20, optional numeric `width` and `height`, optional `alt` defaulting to `name`, and optional Tailwind `className`. It MUST NOT import or depend on an external icon library.

#### Scenario: Rendering a square icon
- **GIVEN** `name` is a valid inventory name and no dimensions are provided
- **WHEN** `<Icon name={name} />` renders
- **THEN** it requests `/icons/<name>.svg` with width 20 and height 20
- **AND** its alt text equals the icon name

#### Scenario: Rendering a custom rectangle
- **GIVEN** `name` is a valid inventory name, `width={32}`, and `height={16}`
- **WHEN** the icon renders
- **THEN** it requests the matching public SVG with width 32 and height 16
- **AND** it preserves the supplied `className`

### Requirement: ICO-003 Invalid Runtime Name Handling
The icon system SHALL handle untyped runtime names without rendering a broken or unrelated icon. Invalid names SHALL produce a development warning and an accessible neutral fallback; valid names SHALL render normally.

#### Scenario: Invalid external name
- **GIVEN** an external value is not present in the icon inventory
- **WHEN** the value reaches the runtime icon boundary
- **THEN** the component warns in development
- **AND** it renders the neutral fallback without requesting a missing SVG

### Requirement: ICO-004 No External Icon Library
The implementation SHALL use only repository SVG assets and `next/image`; it SHALL NOT add or import `lucide-react` or another external icon library for this capability.

#### Scenario: Reviewing icon dependencies
- **WHEN** the icon component and dependency manifest are reviewed
- **THEN** no external icon package is added for rendering these icons
- **AND** no component imports an external icon library

