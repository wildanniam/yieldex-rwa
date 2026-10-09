## Context

The design sheet specifies four button hierarchies, three sizes, and six states: default, hover, pressed, focus, disabled, and loading. The existing file has extra visual-effect props and a `secondary` variant, so a clean overwrite is required to avoid carrying unsupported behavior into the replacement.

## Goals / Non-Goals

**Goals:**
- Make the public button API exactly match the approved matrix.
- Keep dimensions and typography deterministic: `lg` 48px/28px/16px, `md` 40px/24px/14px, `sm` 32px/16px/13px.
- Keep actions pill-shaped with `font-medium`, 20px icons, and 8px icon gap.
- Use the shared color and gradient utilities and the specified green focus treatment.
- Ensure loading is disabled and accessible while retaining the button label.

**Non-Goals:**
- Preserving magnetic motion, shimmer, border beam, ambient glow, or `secondary`.
- Creating new icon artwork or using an icon package.
- Changing the shared design tokens or page layout.

## Decisions

### 1. Clean public API

`Button` extends native `React.ButtonHTMLAttributes<HTMLButtonElement>` and accepts `variant` (`primary | accent | outline | ghost`), `size` (`sm | md | lg`), `isLoading`, optional `leadingIcon`, optional `trailingIcon`, and `className`. `buttonVariants` is exported for composition. Defaults are `primary` and `md`.

### 2. State and geometry classes

- All variants use `rounded-full`, `font-medium`, `focus-visible:ring-2`, `focus-visible:ring-green-text`, `focus-visible:ring-offset-2`, and `focus-visible:ring-offset-canvas`.
- Primary uses `bg-primary-gradient text-canvas`, green-1 hover, and green-3 pressed.
- Accent uses `bg-accent-gradient text-white`, purple-1 hover, and purple-3 pressed.
- Outline uses a 1px `#505555` border, transparent background, and green-text label.
- Ghost uses transparent background, transparent border, and green-text label.
- Disabled uses `disabled:opacity-40 disabled:cursor-not-allowed`.
- Loading renders a 20px spinner and sets the native `disabled` attribute.

### 3. Icon integration

The component accepts typed icon names compatible with `IconName` and renders the shared `Icon` component from `@/components/ui/icon` at 20px. The wrapper must remain the only icon source; no arbitrary SVG or external icon import is accepted. If the workspace root file is not compiled by Next directly, the web-local file owns implementation and the root file re-exports it, while the user-requested root path remains overwritten with the new contract.

## Risks / Trade-offs

- Removing existing effect props is intentionally breaking and may require callers to delete those props.
- CSS hover/pressed states cannot be fully asserted by the current non-DOM test runner; class contract tests cover their emitted tokens.
- The icon type must remain synchronized with the archived custom-iconography inventory.
