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
| How it works      | Three chronological steps                                   | Selectable Alice/vault/Bob scene; finite causal traces and fixed backing                                                                          |
| See the math      | 90 price, 50% share, 200/100/0 scenarios                    | Selectable scenarios + share slider; integer cents, hypothetical DemoUSD-equivalent valuation, actual payouts remain in-kind                      |
| Assets            | Three token cards                                           | Selectable demoAAPL/demoMSFT/demoSPY specimen collection; manifest links and payment/in-kind-income distinction                                   |
| Risks             | Sale vs loan, uncertain income, testnet                     | Zero-income illustration + four native disclosures including finalizer/delayed-release caveat                                                     |
| CTA/footer        | Final invitation, demo details and useful destinations      | Sculptural backing/income invitation; working lab/docs/explorer links and readable footer                                                         |

## Primary path and boundaries

`/` explains product → Launch app opens `/dashboard`; contextual AI buttons open the existing assistant. `/workspace` retains the old developer home. `/lab` and `/design-system` retain their desktop workspace shell and URLs. A single top-level ChatbotWrapper persists between routes. Marketing illustrations are labeled examples, never live offers or signed transactions.

## Motion and states

Use pinned Motion for tilt on the main illustrative card (mouse only), selection indicators and short causal transitions. No continuous React state updates for pointer motion. CSS hero entrance and progressive one-time section reveals stop with reduced motion. No autoplay carousel, pinned scroll, or hidden content awaiting hydration. The October 9 motion revision adds pausable ambient hero motion as specified below. Reduced-motion and no-JS keep readable content and navigation. Hover/focus/pressed reuse Button; loading/error/disabled come from canonical chat/session behavior. Mobile menu closes on navigation/Escape and restores focus on Escape.

## Implementation and verification

Server-render editorial content; isolate interactive leaves. Use the existing typed Icon and Button vocabulary. Figma artwork is local with provenance in `docs/landing-assets.json`; no new icon pack or external card code copied. The 3D card pattern was evaluated against [Aceternity](https://ui.aceternity.com/components/3d-card-effect), implemented for this product using [Motion springs](https://motion.dev/docs/react-use-spring) and [reduced motion](https://motion.dev/docs/react-use-reduced-motion), rather than importing a second design system.

Verify 1440/768/390/320 widths, keyboard/menu/selection, actual tilt/reset, reduced motion, readable no-JS fallback, image geometry, page navigation/reload, chat failure/retry, existing lab and catalog. No blank links, invented social proof/fees, or guaranteed return copy. Full repository checks before PR; designer acceptance and production deployment remain separate.

## Reuse

Page sections live in `apps/web/src/components/landing/page.tsx`; client controls and `LinkAction` are in `interactions.tsx`. Import shared `Button`/`Icon` for new controls. `buttonVariants` currently belongs to a client module, so call it within a client leaf such as `LinkAction`, not a server component. `income-math.ts` is a display-only valuation helper, never a financial API or accounting implementation.

## Hero motion revision

Wildan requested stronger ETH hover response and a living background. The signature is an orbital Ethereum field: six original assets buoy gently, nearby assets lean toward the pointer, and thin elliptical light trails move behind the copy. GSAP owns nested artwork transforms; Motion owns product selections/result transitions; CSS owns button/icon feedback. Keep text static and CTA hit targets stable. Ambient movement stops offscreen, when the document is hidden, under system reduced motion, or via the visible pause control. Coarse pointers use smaller floats without pointer tilt. No canvas/WebGL, scroll hijacking or per-frame React renders.

Verification matrix for this revision: desktop idle/pointer/leave; pause/resume plus rapid repeated toggles; scroll away/back; navigation/unmount/re-entry; mobile/tablet/320px overflow and menu; keyboard pause/scenario/range; result arithmetic and preview stages; adjacent lab/catalog; requests/console and full checks. OS reduced-motion and JS-disabled runtime remain separately reported if unavailable.

## Portfolio dashboard slice

References: Figma 60:18962 (empty), 60:18558 (Alice). Product register: compact, scanable personal overview at `/dashboard`, labeled My Portfolio. Preserve sidebar, metric row, portfolio/claims split and activity/assistant row. Use canonical Button/Icon and local logo, 24px panels, 16–24px rhythm and 150–200ms feedback. No hero motion on this working surface. Preview states are explicit examples, not wallet balances; omit unsupported token examples, invented USD prices and fake transaction links. Loading/error mean unknown, not zero. Live account/claim integration remains separate acceptance.

### Shared platform artwork

User-provided city/crypto background is the persistent decorative layer for all product routes under `app/(platform)`. Dashboard and lab currently share it; future product screens must join the same layout. Keep artwork fixed, proportional (cover), noninteractive and without entry motion. Use a transparent dashboard sidebar and restrained content surfaces so the artwork spans the full canvas. Keep opaque dialogs and a dark translucent mobile menu for contrast. The replacement artwork is stored as WebP and served through Next Image. Do not duplicate a background per menu/page.

## Concept-led benefits revision

The user's Fradium reference replaces the prior repeated icon/text feature design at `#why-yieldex` only. `concept-cards.tsx` and its CSS module own original glass-vault/income-stream, layered offer ticket, resale pass and AI explanation scenes. Their visuals explain actual Yieldex concepts; Fradium branding, security claims and source assets are not copied. Labels remain HTML, all data is illustrative, and the compact chain row links to the deployment manifest. Use hover/focus only for short object motion with reduced-motion fallback. Other landing sections and canonical assistant behavior remain intact.

## Lifecycle and allocation continuation

Maintain the approved concept-led approach: a visual subject must explain what moves, what stays, and what the user can control. Sections3/4 use a stable glass vault with selectable Alice/Bob lifecycle states, then an income-allocation ring with exact buyer/seller values and an anchored upfront cost. `interactive-scenes.tsx` owns these client controls; `income-math.ts` remains the sole calculator arithmetic source. Finite directional traces show payment/allocation; ring transitions show share changes. Never animate an illustrative claim as a completed payment, imply guaranteed yield, or change the price when the scenario changes. Native controls, HTML labels, static SSR and CSS reduced-motion handling remain required.

## Remaining sections continuation

The specimen collection, quiet zero-income illustration and faceted closing sculpture extend the accepted concept-led direction through the rest of the landing. `closing-scenes.tsx` owns these sections. Treat token letters as demo identities, not issuer branding or real-stock backing. The palette can distinguish the selected token, but the payment/income distinction must stay explicit in text. Preserve manifest explorer links, native risk disclosures, reduced-motion/static behavior and existing destinations. Detailed verification and limits are in `docs/landing-concepts.md`.

## Footer signature

The landing footer uses an editorial brand statement, two navigation groups and a large logo and typographic Yieldex signature on the continuous page canvas. Footer artwork is live text/CSS, not a bitmap. Use the existing product/resource destinations and a native back-to-top anchor; avoid invented social links or status claims. Compact Sepolia/payment/no-real-backing disclosure remains visible at all breakpoints. Keep bottom clearance for the persistent assistant launcher. No divider lines or numbered menu headings. A mouse-following light is clipped to the wordmark; touch, reduced motion and no JavaScript retain the static gradient.

## Shared product shell — 10 October integration preview

The accepted minimal portfolio is the design source of truth for product pages. `app/(platform)/(product)/layout.tsx` owns `PlatformShell`: one transparent sidebar, compact header and main landmark for portfolio, marketplace/detail and create-listing. The outer platform layout owns the single persistent city/crypto background. `/lab` remains its sibling with the existing console shell; root landing retains its own navigation. This supersedes the original PR12 all-routes navigation placement and the dashboard's former page-local shell.

Adapt PR12 page anatomy (offer cards, filters, purchase review and five-step creation) to this canvas. Prioritize company identity, price, income share and time period; secondary caveats belong in detail/disclosure. Use canonical components and subtle 150–200ms feedback, not landing choreography. Small preview labels distinguish examples; no fabricated connected identity, transaction receipt or successful creation. Actual financial actions remain in the wallet console.
