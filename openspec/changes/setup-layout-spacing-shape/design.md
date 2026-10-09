## Context

The Next.js starter currently renders page content without a shared shell. The active `setup-color-system` change defines the color tokens this work must reuse, while the active `component-button` change defines pill-shaped actions. This proposal covers layout geometry and surfaces only; product-screen content remains subject to the team's designer and the accepted product behavior.

## Goals / Non-Goals

**Goals:**
- Establish a consistent 1440px board and 1200px content frame with the supplied desktop dimensions.
- Provide a 12-column grid with 24px gutters and the approved spacing utilities.
- Use flat, bordered cards and inputs with accessible green-2 focus treatment.
- Keep navigation and content usable on narrower viewports without imposing fixed desktop margins there.

**Non-Goals:**
- Redesigning product screens, choosing new colors, or changing the color-token meanings.
- Adding shadows, decorative gradients, a hero glow, or background artwork to the shell and cards.
- Defining new product actions, navigation destinations, or business states.

## Decisions

### 1. One responsive shell with bounded desktop widths

- The outer board is fluid up to `1440px`, centered in the viewport.
- The shell's content frame is fluid up to `1200px`. At a 1440px viewport this yields 120px outer margins; at narrower widths it uses responsive gutters rather than fixed 120px margins.
- The topbar is 72px high. The desktop sidebar is 248px wide.
- Main content uses 32px padding and a 12-column grid with 24px gutters. Columns are allowed to shrink at narrower widths; the layout must not create horizontal overflow or make navigation unreachable.
- The shell may live in `layout.tsx` or a reusable layout component, but there must be one source of these shared dimensions.

### 2. Keep the spacing vocabulary on the existing Tailwind scale

Use only the supplied rhythm for shared layout spacing: `2` = 8px, `4` = 16px, `6` = 24px, `8` = 32px, `12` = 48px, `16` = 64px, and `24` = 96px. Prefer the corresponding `gap-*` and `p-*` utilities; do not create a second spacing scale for these values.

### 3. Add explicit geometry utilities

Extend Tailwind border-radius configuration with `card: 24px`, `inner: 16px`, and `input: 12px`, yielding `rounded-card`, `rounded-inner`, and `rounded-input`. Actions retain pill geometry through `rounded-full`, consistent with the button capability.

### 4. Reuse existing color tokens for flat surfaces

- Cards use a 1px `border-border` border (the existing `--border` token at 40% opacity), `rounded-card`, and no box shadow.
- Inputs use a 1px `--input-border` border and `rounded-input`.
- Keyboard-visible input focus changes the border and focus indicator to the existing `green-2` token.
- Do not add colors or gradients. Existing gradient utilities from the color-system work are not applied to this shell or its cards. Any optional hero glow remains out of scope.

## Risks / Trade-offs

- Existing color-system work is in progress. The implementation must reuse its CSS variables and avoid copying color values into a second token source.
- A fixed desktop sidebar cannot be preserved at every viewport size. Narrow layouts must keep navigation reachable and avoid overflow, while exact breakpoint and collapse interactions remain a designer implementation detail.
- Tailwind's default spacing scale already includes the requested utility values; configuration should not duplicate those values unnecessarily.
