## Why

The web UI needs a single, type-safe wrapper for the team's own SVG assets. The repository stores the approved assets under `apps/web/public/icons/`, so the wrapper must use that inventory rather than inventing names.

## What Changes

- Establish `apps/web/public/icons/` as the canonical icon asset location and inventory its `.svg` filenames before implementation.
- Add a type-safe `Icon` component at `components/ui/icon.tsx`, backed by the actual available filenames and using `next/image` rather than an external icon library.
- Support square defaults and explicit non-square dimensions through `size`, `width`, and `height`, plus accessible alt text and Tailwind `className`.
- Define a development-visible fallback or warning for invalid runtime names without silently rendering an unrelated icon.
- Keep the component usable from the existing web alias/re-export conventions.

## Capabilities

### New Capabilities
- `custom-iconography`: Canonical SVG inventory and typed Next Image icon wrapper.

### Modified Capabilities
None.

## Impact

- `apps/web/public/icons/*.svg` is the required asset source; the current inventory is used without adding or renaming assets.
- `components/ui/icon.tsx` is the requested shared entry point.
- A web-side re-export or import path may be added if required by the existing Next.js path configuration.
- No `lucide-react` or other external icon library will be introduced.
