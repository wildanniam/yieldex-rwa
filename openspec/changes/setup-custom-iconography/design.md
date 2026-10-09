## Context

The request names example assets such as `search.svg`, `wallet.svg`, and `eth-logo.svg`. The repository scan found the actual inventory under `apps/web/public/icons/`; it includes `search.svg` and `wallet.svg` but no `eth-logo.svg`. The component therefore derives its public name union from the checked-in inventory rather than hard-code missing examples.

## Goals / Non-Goals

**Goals:**
- Keep icon names synchronized with files under `apps/web/public/icons/`.
- Use `next/image` with deterministic `/icons/<filename>.svg` sources.
- Preserve accessible defaults and support square and rectangular rendering.
- Surface invalid runtime values during development while providing a safe non-icon fallback in production.

**Non-Goals:**
- Drawing new SVG artwork or choosing icon visual designs.
- Adding third-party icon packages.
- Replacing existing button behavior or visual tokens.

## Decisions

### 1. Asset inventory is authoritative

Implementation begins by scanning `apps/web/public/icons/*.svg`. The generated/static `IconName` union must contain the basename without `.svg` and must not include names for missing files.

### 2. Shared component contract

`Icon` accepts:

- `name: IconName`, derived from the available SVG basenames.
- `size?: number`, defaulting to `20`, used for both dimensions when custom dimensions are absent.
- `width?: number` and `height?: number`, which override the corresponding square dimension independently.
- `alt?: string`, defaulting to `name`.
- `className?: string`, merged onto the `next/image` element.

The component uses `width={width ?? size}` and `height={height ?? size}`. It does not accept arbitrary source URLs, preventing callers from bypassing the asset inventory.

### 3. Invalid runtime values

TypeScript prevents invalid literals at compile time, but data from APIs or CMS boundaries can still be untyped. The component will guard the runtime name against the inventory. In development it emits a concise `console.warn`; it renders an accessible neutral fallback with no broken image request rather than substituting another icon. Tests cover valid source paths, dimensions, alt defaults, and invalid-name behavior.

### 4. Export convention

The canonical shared component lives at `components/ui/icon.tsx`, matching the existing root UI re-export convention. If Next.js compilation requires source-local access, `apps/web/src/components/ui/icon.tsx` re-exports the shared implementation without creating a second component or icon-name union.

## Risks / Trade-offs

- The inventory is maintained manually alongside the checked-in assets; a new asset requires updating the union and its focused test.
- `next/image` requires static dimensions, so callers must use numeric dimensions and the component cannot infer intrinsic SVG dimensions at runtime.
- A warning is diagnostic only; product surfaces should validate external icon names before rendering.
