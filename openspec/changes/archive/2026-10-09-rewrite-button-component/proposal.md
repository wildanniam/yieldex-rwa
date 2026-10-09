## Why

The current button implementation contains interaction effects and variants outside the approved 72-variant design matrix. It must be replaced, not merged, so every hierarchy, size, and state maps directly to the design sheet and the shared icon system.

## What Changes

- Completely overwrite `components/ui/button.tsx`; do not preserve or merge its existing implementation.
- Implement the four approved hierarchies (`primary`, `accent`, `outline`, `ghost`) and three sizes using `clsx`/`tailwind-merge` or `class-variance-authority`.
- Implement pill geometry, exact size dimensions, icon spacing, focus, disabled, and loading states.
- Export `Button` and `buttonVariants`.
- Connect optional leading/trailing icon rendering to the type-safe `Icon` component from `@/components/ui/icon` without adding an external icon library.
- Update focused button tests and remove expectations for the discarded magnetic, shimmer, border-beam, and ambient-glow APIs.

## Capabilities

### New Capabilities
- `button-component-rewrite`: Approved 72-variant button matrix and shared icon integration.

### Modified Capabilities
- Replaces the existing starter button behavior rather than extending it.

## Impact

- `components/ui/button.tsx` is intentionally overwritten.
- `apps/web/src/components/ui/button.tsx` may provide the Next.js-local implementation/re-export required by the workspace dependency boundary.
- `apps/web/src/components/ui/button.test.ts` is updated for the new contract.
- No dependency on Lucide, Framer Motion, or other external icon libraries is introduced for button icons.
