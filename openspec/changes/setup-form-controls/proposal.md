## Why

The web UI has global input CSS but no reusable, typed form-control components that consistently implement the design sheet's 10 controls and five states. Product screens would otherwise duplicate dimensions, token usage, helper/error behavior, and accessibility semantics.

## What Changes

- Add reusable controls for text/password/amount input, select, slider, segmented control, checkbox, toggle, OTP input, and search field.
- Standardize 48px height, 12px radius, card background, input-border default border, green-2 focus, danger error state, and disabled treatment.
- Give every control an `error?: string` path that replaces normal helper text with red error copy.
- Reuse the existing `Icon` component and canonical SVG inventory for eye, chevron, search, and related affordances.
- Keep domain-specific display details such as DemoUSD, simulated Sepolia labels, MAX action, percentage bubble, and shortcut tag explicit in component APIs.

## Capabilities

### New Capabilities
- `form-controls`: Typed reusable controls matching the 10-control design sheet and shared state semantics.

### Modified Capabilities
None. Existing global input styles remain compatible and may be refined to avoid conflicts with component classes.

## Impact

- New shared components under `components/ui/`, with web-local implementations/re-exports where required by the existing Next.js dependency boundary.
- Existing icon component is reused; no external icon library is introduced.
- Focused component tests cover class contracts, error/helper replacement, disabled behavior, and control-specific state.
