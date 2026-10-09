## ADDED Requirements

### Requirement: CLR-001 Named Token Definitions as CSS Variables
The design system SHALL expose the named color tokens as CSS variables under `:root` and `@theme` in `globals.css` with exact hex/rgba definitions:
- Surface tokens: `canvas` (`#010911`), `canvas-deep` (`#000510`), `card` (`#070D0E`), `raised` (`#101716`), `tint` (`#16221D`), `border` (`#505555`), `input-border` (`#2A3533`).
- Text tokens: `text-1` (`#E5E5E7`), `text-2` (`#9DA3A8`), `text-3` (`#6E7074`).
- Action & Intelligence tokens: `green-1` (`#99E39E`), `green-2` (`#63C16B`), `green-3` (`#55B75E`), `green-text` (`#7BC882`), `purple-1` (`#7C72FE`), `purple-2` (`#6B62E0`), `purple-3` (`#544CBB`).
- Button label token: `primary-label` (`#092011`).
- Feedback tokens: `yellow` (`#FFDE8C`), `danger` (`#F0605D`).

#### Scenario: Inspecting root CSS variables
- **WHEN** the application loads `globals.css`
- **THEN** all named tokens, including input-border and primary-label are resolvable via `var(--...)` custom properties.

### Requirement: CLR-002 Tailwind CSS Color Mappings
The application SHALL map all named tokens in `tailwind.config.ts` under `theme.extend.colors` to their corresponding `var(--...)` values, enabling utility classes such as `bg-canvas`, `text-text-1`, `border-input-border`, and `bg-green-1`.

#### Scenario: Applying Tailwind color utilities
- **WHEN** an element specifies `className="bg-canvas text-text-1 border-input-border"`
- **THEN** it resolves to `#010911` background, `#E5E5E7` text color, and `#2A3533` border color.

### Requirement: CLR-003 Vertical Linear Gradients
The design system SHALL provide utility classes for top-to-bottom linear gradients:
- `primary-gradient`: Linear gradient top to bottom (`#99E39E` -> `#63C16B` -> `#55B75E`).
- `accent-gradient`: Linear gradient top to bottom (`#7C72FE` -> `#6B62E0` -> `#544CBB`).

#### Scenario: Applying primary gradient
- **WHEN** an element specifies `bg-primary-gradient`
- **THEN** it renders a top-to-bottom linear gradient transitioning from `#99E39E` through `#63C16B` to `#55B75E`.

#### Scenario: Applying accent gradient
- **WHEN** an element specifies `bg-accent-gradient`
- **THEN** it renders a top-to-bottom linear gradient transitioning from `#7C72FE` through `#6B62E0` to `#544CBB`.

### Requirement: CLR-004 Semantic Usage Constraints
The color system MUST document and enforce semantic constraints:
- Green executes core actions (primary transactions, investments, claims).
- Purple supports entry and intelligence (wallet connection, AI insight).
- Yellow and Red remain strictly semantic (warnings and danger/errors), never decorative.

#### Scenario: Semantic rule documentation
- **WHEN** developers review `globals.css` or `tailwind.config.ts`
- **THEN** explicit rule comments regarding Green, Purple, Yellow, and Red usage are present.

The Figma reference uses Inter while Google Sans is pending. The app SHALL self-host Inter, keep action gradients in the Tailwind utility layer, and expose primary label `#092011` as a semantic token.
