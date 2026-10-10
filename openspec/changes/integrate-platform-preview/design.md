## Context

Starting main 5f95a81 contains the approved dashboard and landing. Teammate PR12 head 94366ae supplies marketplace/detail/purchase/sell composition, but its global shell would wrap the landing and its local state can imply completed payments.

## Decisions

Use a product subgroup beneath the existing platform background layout. Keep the functional lab as sibling. Extract the dashboard shell without changing its visual DNA. Port page anatomy selectively, not the old root layout, placeholder menu pages or prematurely archived specs. Supported manifest tokens only; one fixture source per journey. Search/sort/filter and totals must reflect visible examples. Price and amount comparison uses integer units.

Native dialog provides focus containment, Escape and return focus. Mobile navigation is a disclosure; close on navigation/Escape. Preview drafts never connect a wallet or send a transaction. Final review hands off to lab, explicitly without forwarding a signed or prepared intent. Unknown IDs show unavailable rather than a different offer.

## Verification

Before: record main dashboard navigation boundary. After: route continuity, active menu, a single shell/background/main; dashboard states/tabs; market filtering/sorting/pagination and consistent details; invalid ID; buy dialog reset/Escape; sell validation/back/edit/review; reload drafts; desktop/mobile overflow; requests and console; full pnpm check. Live provider/signing and production deploy remain outside this UI preview.
