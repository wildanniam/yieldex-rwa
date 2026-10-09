## Context

The Next.js App Router currently renders the starter page through a legacy header/sidebar wrapper. The supplied navigation reference defines a shared 248px sidebar, a 72px top bar, active navigation treatment, and content beginning at 32px padding. Product destinations are not all implemented yet, but links must still be routable.

## Goals / Non-Goals

**Goals:**
- Make the sidebar and top bar available from the root layout across all current screens.
- Preserve the existing functional `/lab` route while adding placeholder destinations.
- Keep navigation active state deterministic for exact paths and nested paths.
- Reuse existing semantic Tailwind tokens such as `bg-canvas`, `border-border`, `bg-tint`, `text-green-1`, and `text-text-1`.
- Keep the shell overflow-safe and accessible with semantic navigation landmarks, `aria-current`, and keyboard-visible focus styles.

**Non-Goals:**
- Implementing marketplace, listing, portfolio, claims, assistant, settings, or activity product behavior.
- Changing wallet/auth/API behavior, financial state, schemas, contracts, generated files, or chatbot runtime.
- Adding responsive visual design beyond preserving reachable links and avoiding horizontal overflow.

## Decisions

### 1. Use the root App Router layout as the shared shell

`apps/web/src/app/layout.tsx` will render a full-height flex container. The sidebar remains a fixed-width sibling, while the main panel uses `flex-1`, `flex-col`, and `overflow-x-hidden`. The top bar is rendered before the page content and remains sticky.

### 2. Keep pathname logic inside the client sidebar

`AppSidebar` will be a client component because `usePathname()` is required for active highlighting. The root layout and top bar remain server-compatible. A destination is active when the pathname equals its href or begins with that href followed by `/`.

### 3. Use one reusable placeholder component

Unbuilt destinations will use a small typed `PlaceholderPage` component and route-local `page.tsx` files. This keeps route ownership explicit while avoiding duplicated placeholder markup. Placeholder pages contain only their title and do not imply implemented product behavior.

### 4. Preserve existing routes

The current root starter page and `/lab` route remain mounted inside the global shell. The shell is not a route group that would exclude existing routes.

## Risks / Trade-offs

- A fixed 248px sidebar consumes substantial width on narrow viewports. The initial implementation must avoid horizontal overflow and keep all links reachable; a future responsive collapse can be added without changing route contracts.
- Root-level shell changes affect every route, including API-adjacent UI pages. No server route behavior should be moved into the layout.
- Placeholder pages prevent 404s but are not evidence that the destination feature is implemented.
