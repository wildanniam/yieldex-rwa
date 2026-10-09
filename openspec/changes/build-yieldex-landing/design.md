## Architecture
Root layout owns global CSS and one ChatbotWrapper. Landing is the server-rendered root page; interactive nav, product illustration and scenario calculator are client leaves. A reusable WorkspaceShell wraps `/workspace`, `/lab` and `/design-system` without duplicating the assistant provider. Chat session admission remains canonical; context exposes open/busy to intentional UI triggers.

## Content and arithmetic
Use canonical demoAAPL/demoMSFT/demoSPY names. Preview: 100 demoAAPL backing, 50% income share, six-month term starting at purchase, 90 DemoUSD upfront. A hypothetical 1 demoAAPL income event splits 0.5/0.5. This visual state never creates a listing. Scenario calculator takes integer cents and basis points, splits the hypothetical terminal DemoUSD-equivalent value, and subtracts the 90 DemoUSD purchase price. It does not convert onchain claims, quote assets or predict dividends. Fees omitted and disclosed, not fabricated.

## Visual decisions / risk
`DESIGN.md` maps each Figma section and deliberate adaptations. Keep source artwork proportions, server-visible fallback, keyboard-operable native controls, reduced motion and route persistence. Moving shell ownership can regress lab/catalog or duplicate chat, so verify all adjacent routes and source parity of financial modules. New Motion is pinned; review lockfile and runtime compatibility.
