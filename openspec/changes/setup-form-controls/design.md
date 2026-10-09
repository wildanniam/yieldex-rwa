## Context

The design sheet defines 10 controls across Default, Focus, Filled, Error, and Disabled states. The repository now has canonical SVG assets under `apps/web/public/icons/` and a type-safe `Icon` wrapper. Form controls must use those assets and existing color tokens rather than adding a parallel visual system.

## Goals / Non-Goals

**Goals:**
- Provide composable, accessible controls with labels, descriptions, errors, and native form semantics.
- Make the global geometry and state classes consistent across all controls.
- Preserve domain information in amount, select, slider, segmented, toggle, OTP, and search APIs.
- Keep keyboard interaction and controlled/uncontrolled usage predictable.

**Non-Goals:**
- Implementing marketplace validation, wallet actions, or financial calculations beyond presentation callbacks and a supplied conversion value.
- Adding a form library or external icon library.
- Replacing the existing design tokens or inventing new colors.

## Decisions

### 1. Shared control contract

Controls use 48px height and 12px radius where a field surface applies, `bg-card`, `border-input-border`, `focus:border-green-2`, `text-text-2` labels at 12px/14px, `text-text-3` helper copy at 12px, `text-danger` error copy, and `disabled:opacity-40 disabled:cursor-not-allowed`. Focus must remain visibly distinguishable with a green-2 ring/border.

All field-like controls expose `label`, `helperText`, `error`, `disabled`, and `className` as appropriate. When `error` is present, error text replaces helper text rather than rendering both.

### 2. Component boundaries

- `input.tsx`: `TextInput`, `PasswordInput`, and `AmountInput` variants or named exports. Password toggling uses the shared `eye`/`eye-off` icons. Amount fields expose currency label, MAX callback, simulated USD text, and simulation status/balance captions without claiming real backing.
- `select.tsx`: native select-compatible control with a custom `chevron-down` affordance.
- `slider.tsx`: range control with percentage value bubble, active green-1 track, and 0%/100% labels.
- `segmented-control.tsx`: keyboard-selectable single-choice pill group.
- `checkbox.tsx`: native checkbox with circular visual indicator, description, and error.
- `toggle.tsx`: switch semantics with Disabled/Enabled status text.
- `otp-input.tsx`: controlled individual single-character slots with focus movement and paste-safe behavior.
- `search-field.tsx`: text search field with leading `search` icon and trailing `⌘K` tag.

Each file has one canonical implementation under the shared UI path; the web-local alias boundary may re-export it only when required for Next.js compilation.

### 3. Icon and state safety

Only names in the existing `IconName` union may be accepted. Icons are decorative when adjacent labels already provide the accessible name. Invalid runtime icon values remain handled by `Icon`, not by a second fallback in each control.

### 4. Financial display boundaries

AmountInput treats numeric strings as display input and does not use JavaScript floating-point accounting. Any USD equivalent, balance, DemoUSD label, and `SIMULATED · Sepolia` badge are explicitly supplied display values and must not imply real yield, backing, or a transaction.

## Risks / Trade-offs

- Native controls provide robust semantics but custom visual affordances need careful keyboard and forced-colors testing.
- OTP focus management is more interactive than the other controls and requires focused tests for typing, deletion, paste, and disabled/error states.
- Existing broad global selectors may overlap component classes; implementation should narrow or override them deliberately without changing unrelated controls.
