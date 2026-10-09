## ADDED Requirements

### Requirement: BWR-001 Approved Hierarchies
The button SHALL support exactly `primary`, `accent`, `outline`, and `ghost` variants, with primary as the default, and SHALL export `buttonVariants`.

#### Scenario: Rendering hierarchy classes
- **WHEN** a button is rendered with each supported variant
- **THEN** primary uses the primary gradient and `#092011` text, accent uses the accent gradient and white text, outline uses a transparent fill with a 1px `#505555` border and text-1 label, and ghost uses a transparent fill and border with text-1 label
- **AND** no `secondary` or effect-specific variant API is exposed

### Requirement: BWR-002 Dimensions and Geometry
The button SHALL use `rounded-full` and `font-medium`; `lg` SHALL be `h-12 px-[28px] text-[16px]`, `md` SHALL be `h-10 px-[24px] text-[14px]`, and `sm` SHALL be `h-8 px-[16px] text-[13px]`. Optional icons SHALL be 20px with an 8px gap.

#### Scenario: Rendering sizes
- **WHEN** a button is rendered with `sm`, `md`, or `lg`
- **THEN** its class contract contains the matching height, horizontal padding, font size, `gap-2`, and pill geometry

### Requirement: BWR-003 Interaction States
The button SHALL expose hover and pressed classes for each hierarchy, a keyboard-visible green-text focus ring with canvas offset, disabled opacity/cursor treatment, and native disabled behavior.

#### Scenario: Keyboard and disabled states
- **GIVEN** a button is focused by keyboard or is disabled
- **WHEN** its state is rendered
- **THEN** focus uses `focus-visible:ring-2 focus-visible:ring-green-text focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`
- **AND** disabled uses 40% opacity, not-allowed cursor, and no interaction

### Requirement: BWR-004 Loading State
When `isLoading` is true, the button SHALL render a 20px spinning loader, retain its label, and set the native `disabled` attribute.

#### Scenario: Loading button
- **GIVEN** `isLoading` is true
- **WHEN** the button renders
- **THEN** it includes a 20px spinner, retains the button content, and is disabled

### Requirement: BWR-005 Shared Icon Integration
The button SHALL use the shared `Icon` component from `@/components/ui/icon` for typed optional leading and trailing icon names and SHALL NOT import an external icon library.

#### Scenario: Icon button content
- **GIVEN** a valid shared icon name is supplied as a leading or trailing icon
- **WHEN** the button renders
- **THEN** the shared `Icon` renders at 20px with the configured 8px gap

### Requirement: BWR-006 Figma State Fidelity
Enabled hover and pressed SHALL preserve action gradients, using bounded surface light, shadow and transform feedback shared by native buttons and styled links. Disabled and loading controls SHALL NOT lift or compress; reduced-motion SHALL remove movement and transitions. Loading SHALL keep full opacity with the exported 20px Figma loader and retain native disabled plus aria-busy behavior. Optional icons SHALL inherit the label color without changing SVG geometry.

#### Scenario: Pointer and loading
- **WHEN** a primary button is hovered or pressed
- **THEN** the gradient remains visible, hover lifts at most2px, and press compresses to0.975 without changing layout dimensions
- **AND** a loading button rejects activation while retaining full visual emphasis
