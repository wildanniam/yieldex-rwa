## Approach

Product UI with a 248px sidebar, compact header, four metrics, a two-column portfolio/claims row and activity/assistant row. At narrow widths the sidebar becomes a disclosure and cards stack. Reuse canonical icons and landing logo; no new assets or dependencies required. Purple identifies claim summary/AI, mint identifies actions, yellow identifies demo context.

The Figma-linked screen is a personal portfolio overview, distinct from Marketplace. /dashboard is this overview; naming it My Portfolio in the navigation follows the product discussion. Figma has inconsistent empty-state activity and unsupported dNVDA/dKO examples: empty state has no activity, and examples use supported demoAAPL/demoMSFT/demoSPY labels. No invented dollar valuation, transaction hash or connected identity.

A clearly labeled UI preview defaults to empty content. It can switch to empty/loading/error without a network request. Retry restores the example, explicitly a preview retry. This is presentation state, not a parallel domain model. Examples use display strings only; integration must adapt canonical DTOs with integer accounting. No financial preview is signed or sent.

Keyboard-operable tabs use roving focus. Menu is a disclosure, Escape returns focus, navigation closes it. Financial preview actions use a native dialog with focus restoration; confirm navigation only opens lab. Assistant opens the existing global runtime without passing example holdings as wallet facts.

## Verification plan

- Normal: example cards/tabs, details dialog, assistant entry and existing route navigation.
- Boundaries: empty state has zero claims, no active positions or fake activity; loading/error use unknown values, not zeros.
- Recovery: error -> preview retry, close/reopen dialog, rapid tabs, reload default, Escape menu/dialog.
- Responsive: 1440, 768, 390, 320 widths, no page overflow, table isolated scroll, readable focus and reduced-motion CSS.
- Browser console/network and SSR content checks; pnpm check. Real wallet signing, APIs and backend failures are explicitly outside slicing proof.
