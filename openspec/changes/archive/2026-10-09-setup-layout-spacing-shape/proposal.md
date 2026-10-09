## Why

The web starter needs one shared spatial system before product screens are built. The current app has no enforced shell dimensions or reusable geometry rules, so new screens can drift in page width, spacing, card shape, and form focus treatment.

## What Changes

- Define the desktop board, content container, topbar, sidebar, content padding, and 12-column content grid for the web shell.
- Standardize the approved Tailwind spacing rhythm and add explicit `card`, `inner`, and `input` border-radius tokens.
- Define flat card and input surfaces using the existing color-system tokens, including green-2 input focus treatment.
- Apply the shell and surface rules to the web app layout without prescribing product-screen content or visual details beyond the supplied measurements.

## Capabilities

### New Capabilities
- `layout-spacing-shape`: Shared web shell dimensions, spacing rhythm, radius tokens, surface borders, and input focus semantics.

### Modified Capabilities
None. This capability consumes the named colors from `setup-color-system`; it does not redefine or replace those tokens.

## Impact

- `apps/web/tailwind.config.ts` for custom border-radius utilities and the approved spacing utility usage.
- `apps/web/src/app/globals.css` for shared surface and form-control defaults.
- `apps/web/src/app/layout.tsx` and, if appropriate, a reusable component under `apps/web/src/components/layout/` for the application shell.
- `apps/web/src/app/page.tsx` to render the starter content within the shell.
- The web UI remains a development starter; no marketplace behavior or product-screen design is introduced.
