## Why

The web app currently has a starter shell but does not expose the product navigation consistently across screens. Sidebar and top-bar destinations need a shared App Router layout and placeholder routes so navigation can be exercised before individual screens are implemented.

## What Changes

- Wire `AppSidebar` and `AppTopBar` into the global Next.js App Router layout.
- Define the shared dashboard shell geometry: 248px sidebar, sticky 72px top bar, overflow-safe main panel, and 32px content padding.
- Use `usePathname()` in the sidebar to expose the active destination with the approved tint and green text tokens.
- Add minimal page stubs for all sidebar destinations and top-bar links so every navigation target resolves without a 404.

## Capabilities

### New Capabilities
- `global-navigation-layout`: Shared application navigation shell, active destination semantics, and route availability for the initial product destinations.

### Modified Capabilities
None.

## Impact

- `apps/web/src/app/layout.tsx` becomes the global navigation shell.
- New reusable navigation components under `apps/web/src/components/`.
- New route-local `page.tsx` stubs under `apps/web/src/app/`.
- The existing `/lab` functional route remains available; no marketplace, wallet, API, schema, or contract behavior changes.
