# Yieldex web design

## Direction

Brand landing page for tokenized-stock holders and income-right buyers, with a calm dark fintech language and one interactive product narrative. Reference: [Figma 50:21692](https://www.figma.com/design/XgSDQCwLb41j9XjTDwLtM2/Design-Yieldex?node-id=50-21692). Wildan explicitly permits better cards/motion than the literal mock while retaining its DNA.

Design variance 6, motion intensity 5, density 4. Existing Inter + navy/green/purple tokens remain canonical. A 1200px content width, generous section rhythm, pill actions, 24px cards and fine borders connect the marketing page to the shared design system.

## Section decisions

| Section           | Retained from Figma                                         | Adaptation / interaction                                                                                                                          |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation        | Logo, product/how/AI/docs links, compact actions            | Sticky dark header; real demo CTA, accessible mobile disclosure; no invented signup flow                                                          |
| Hero              | Centered two-tone promise, Ethereum silhouettes, green CTA  | Clear Sepolia label, staged entrance, artwork in original aspect ratios                                                                           |
| Product in action | Asset, fixed price, share, term, ownership                  | Interactive 3-step preview: listing → purchase → dividend; side cards explain retained backing and in-kind claims instead of 3 duplicate listings |
| Why Yieldex       | Mixed-size feature cards, principal retained, resale and AI | Native grouped cards, subtle card depth; purple reserved for AI; complete-position resale and original expiry explicit                            |
| How it works      | Three chronological steps                                   | Numbered rail explaining the interactive preview, no scroll hijacking                                                                             |
| See the math      | 90 price, 50% share, 200/100/0 scenarios                    | Selectable scenarios + share slider; integer cents, hypothetical DemoUSD-equivalent valuation, actual payouts remain in-kind                      |
| Assets            | Three token cards                                           | Canonical demoAAPL/demoMSFT/demoSPY; no unverified spot prices or unsupported NVDA/KO claims                                                      |
| Risks             | Sale vs loan, uncertain income, testnet                     | Readable disclosure cards + expandable source/withdrawal caveat                                                                                   |
| CTA/footer        | Final invitation, demo details and useful destinations      | Working lab/docs/explorer links; no nonexistent terms/privacy/signup pages                                                                        |

## Primary path and boundaries

`/` explains product → Explore demo opens `/lab`; contextual AI buttons open the existing assistant. `/workspace` retains the old developer home. `/lab` and `/design-system` retain their desktop workspace shell and URLs. A single top-level ChatbotWrapper persists between routes. Marketing illustrations are labeled examples, never live offers or signed transactions.

## Motion and states

Use pinned Motion for tilt on the main illustrative card (mouse only), selection indicators and short causal transitions. No continuous React state updates for pointer motion. CSS hero entrance and progressive one-time section reveals stop with reduced motion. No autoplay carousel, infinite float, pinned scroll, or hidden content awaiting hydration. Reduced-motion and no-JS keep readable content and navigation. Hover/focus/pressed reuse Button; loading/error/disabled come from canonical chat/session behavior. Mobile menu closes on navigation/Escape and restores focus on Escape.

## Implementation and verification

Server-render editorial content; isolate interactive leaves. Use the existing typed Icon and Button vocabulary. Figma artwork is local with provenance in `docs/landing-assets.json`; no new icon pack or external card code copied. The 3D card pattern was evaluated against [Aceternity](https://ui.aceternity.com/components/3d-card-effect), implemented for this product using [Motion springs](https://motion.dev/docs/react-use-spring) and [reduced motion](https://motion.dev/docs/react-use-reduced-motion), rather than importing a second design system.

Verify 1440/768/390/320 widths, keyboard/menu/selection, actual tilt/reset, reduced motion, readable no-JS fallback, image geometry, page navigation/reload, chat failure/retry, existing lab and catalog. No blank links, invented social proof/fees, or guaranteed return copy. Full repository checks before PR; designer acceptance and production deployment remain separate.

## Reuse

Page sections live in `apps/web/src/components/landing/page.tsx`; client controls and `LinkAction` are in `interactions.tsx`. Import shared `Button`/`Icon` for new controls. `buttonVariants` currently belongs to a client module, so call it within a client leaf such as `LinkAction`, not a server component. `income-math.ts` is a display-only valuation helper, never a financial API or accounting implementation.
