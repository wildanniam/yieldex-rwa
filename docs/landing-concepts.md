# Landing concept illustrations

Scope: the feature group after the hero/product preview (`#why-yieldex`), followed by the approved continuation into `#how-it-works`, `#calculator`, `#assets`, `#risks` and the closing invitation/footer. Fradium is a composition/material reference, not a source of Yieldex product claims. Figma3583:2778 and detailed cards3583:2826/3583:2877 were inspected.

Implementation lives in `apps/web/src/components/landing/concept-cards.tsx` and its CSS module. Original SVG/HTML/CSS artwork avoids embedded text in raster images and scales without downloaded third-party assets or a new rendering library. Canonical Icon/AskAssistant are reused. SVG IDs use the section-specific `yx-` prefix and appear once per landing.

- Vault: retained100demoAAPL backing, separate50% income right.
- Offer ticket: share/term/fixed price example; barcode is purely decorative.
- Resale: whole position, unchanged original expiry, earned claims retained.
- AI: illustrative term/risk explanation; real CTA uses existing admission/error behavior.
- Proof: actual market deployment link.

No illustration is an actionable form. No transaction, quote, balance or AI response is fabricated as live data. Hero and backend logic remain unchanged. Flow, calculator, assets, risks and closing presentation were subsequently revised as documented below.

Verification results and final tested revision are recorded in the PR. Designer review, live integrations and cross-browser/assistive-technology audit remain separate.

## Local verification — 9 October 2026

- PASS: pnpm check,152 Vitest,46 Foundry,9 OpenSpec changes,format/lint/types/generated artifacts/production build. An unused import caught by the initial lint was removed before the passing run.
- PASS: Chromium1440/768/390/320, no document overflow, original scenes retain their geometry and important HTML labels remain visible. Decorative SVGs are hidden from screen readers. Artwork is inline/local; no external asset fetch required.
- PASS: keyboard focus activates the vault response (observed transform), anchor to calculator, zero-income result−90DemoUSD/−100%, offer link to lab, canonical AI fallback, hero pause state and interactive purchase preview.
- PASS with environment limit: lab is intentionally unconfigured locally; AI admission403 gives existing unavailable message. Production console had no new warnings/errors. No live wallet, quote or AI proof.
- KNOWN ADJACENT ISSUE: after calculator -> AI anchor -> AI fallback -> lab, browser Back can restore the landing hash while leaving lab content visible. Reproduced on both this revision and unchanged landing served at3011 (dashboard branch0c5fe74; landing code from63ffaed). Home link restores landing. Not introduced or fixed here; do not claim every back-navigation path passed.
- OBSERVED DEV-ONLY: calculator Motion initial-style hydration warning on first dev load; calculator source is unchanged from63ffaed. Not reproduced in final production console.
- NOT TESTED: OS-level reduced-motion preference, JS-disabled browser, pure pointer-hover motion, Safari/Firefox and full AT audit. Reduced-motion selectors and static SSR verified in source/build; keyboard focus motion tested in browser.

Before/after screenshots and logs are local QA artifacts outside Git. Dashboard PR15 remains independent.

## Flow and numbers revision — 9 October 2026

Wildan approved the section2 concept direction and requested equivalent visual quality for sections3/4. `interactive-scenes.tsx` and its CSS module own both new client scenes. The old process/calculator presentation and unused styles are removed; `income-math.ts` is unchanged.

- Lifecycle: manual offer/purchase/claim steps around a stationary illustrated vault. Payment travels from Bob toward Alice; the allocation stage branches toward both claimants. The light traces run once per selected stage (1.2 seconds). Claims are labeled available, never automatically paid. Labels and details immediately reflect the selected stage, including rapid/reverse selection.
- Simulator: a mint/neutral income allocation ring, buyer and seller exact values, native scenario buttons and a keyboard range. Upfront price stays90; no income empties both arcs. Gain/loss/break-even have text as well as color. This is hypothetical valuation, not a forecast, quote or token payment. No new dependency, provider call or transaction.
- Motion uses finite CSS transitions and animations with reduced-motion rules. Initial HTML is deterministic; the old calculator's preference-dependent Motion initial style is removed.

### Verification matrix

Before:2b1587d (user screenshots). After: final commit recorded in PR17. Local Chromium; production preview3012, development3013. Disposable screenshots/logs are outside Git.

| Scenario                                     | Result       | Evidence / limit                                                                                                                           |
| -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Full repository gate                         | PASS         | pnpm check:152 Vitest,46 Foundry,9 OpenSpec changes; lint, format, types, generated drift and production build                             |
| Three lifecycle stages                       | PASS         | Offer retains100 backing; purchase displays90 paid to Alice and50% right; allocation shows0.50 claimable each                              |
| Rapid/reverse selection; keyboard            | PASS         | 2→3→1→3→2 stays on purchase; Enter/Space select stages; SVG animation duration1.2s, iteration1                                             |
| Calculator values                            | PASS         | Real native controls:200/100/0 income ×10/50/90 share; buyer+seller sums conserved; fixed90 cost; net−90…+90; income100/share90 break-even |
| Zero and recovery                            | PASS         | Zero ring has both arcs0, allocations0, loss−90/−100%; later scenario changes update values                                                |
| Reload                                       | PASS         | Production reload resets illustrative scenario100/share50; no claim of persisted financial state                                           |
| Responsive / navigation                      | PASS         | 1440,768,390,320 widths; no horizontal overflow; menu closes after anchor navigation; labels and controls remain visible                   |
| Hydration / console                          | PASS         | No hydration warning in revised calculator; production has no new warning/error; dev dependency Lit mode notice only                       |
| Reduced motion / no JS                       | SOURCE + SSR | Static content and noscript rendered; CSS disables transitions/animations. OS preference and JS-disabled runtime not exercised             |
| Live providers / wallet / cross-browser / AT | NOT TESTED   | No change to financial logic; no new claim of live-provider or Safari/Firefox/screen-reader verification                                   |

The existing adjacent multi-anchor→AI fallback→lab→Back issue described above remains outside this visual revision. The earlier calculator hydration observation is superseded by the successful revised checks.

## Remaining sections revision — 9 October 2026

The user approved the visual direction and requested the remaining sections. `closing-scenes.tsx` and its scoped CSS own the asset collection, risk guide and closing invitation. Asset identities are the three currently deployed demo symbols; addresses, payment symbol and registry come from `deployments/sepolia.json`.

- The selectable specimen collection uses original CSS coins and a pedestal. Labels explicitly distinguish DemoUSD payment from in-kind income in the selected backing token. Each asset retains its own explorer link before hydration; the selected detail address and explanation use the same manifest object.
- The risk guide shows a possible90-paid/0-income outcome, plus four native details/summary disclosures. It preserves the sale/no-loan, no-refund, zero-income, simulated-backing, finalizer, delayed-release and no-clawback boundaries. No guaranteed return or fabricated market quote.
- The final invitation uses a faceted sculpture with separate backing/income labels. Links go to the existing demo and lifecycle; footer links are enlarged for readability. Finite selection animation and hover/focus motion are disabled under reduced motion. No new dependencies or external image requests.

| Scenario                         | Result       | Evidence / limit                                                                                                                           |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Full gate                        | PASS         | 153 Vitest,46 Foundry,9 OpenSpec changes; format/lint/types/generation/build                                                               |
| All three assets                 | PASS         | Pointer and Enter selection update symbol, selected state, explanation and correct canonical explorer address; DemoUSD stays payment token |
| Rapid switching and reload       | PASS         | SPY→MSFT→AAPL→MSFT remains consistent; reload restoresAAPL and default first disclosure                                                    |
| Disclosures                      | PASS         | All four open simultaneously; Enter/Space open and close; finalizer text readable at320px                                                  |
| Responsive                       | PASS         | 1440/768/390/320; no page overflow; selection panel, coin, long disclosures and closing CTA visible                                        |
| Closing navigation               | PASS         | Revisit flow reaches#how-it-works; Start exploring reaches/lab; Home returns to landing                                                    |
| Console and resources            | PASS         | No new production errors/hydration warning; dev Lit mode notice only. Production HTML/resources checked separately                         |
| No JS / reduced motion           | SOURCE + SSR | Canonical explorer links and all risk text in server HTML; native details; reduced-motion CSS; browser preference/no-JS runtime not tested |
| Live financial/provider behavior | NOT TESTED   | Local lab intentionally unconfigured; no wallet/AI/provider functionality changed or claimed reverified                                    |

Previous adjacent Back-navigation limitation remains. No merge or manual deployment. Screenshot evidence and logs remain outside the repository. Final tested commit is recorded in PR17.

## Brand presentation and artwork polish — 9 October 2026

User requested company identities instead of repeated demo headings and more refined risk/closing artwork. Main labels now use Apple/AAPL, Microsoft/MSFT and S&P500/SPY. Canonical contract symbols remain beside selected Sepolia addresses; the collection and native risk disclosure state simulation/no real backing. NVIDIA is not added because it is not in this deployment. No contract token has been renamed or remapped. Main CTA copy is Launch app / Explore Yieldex.

Apple silhouette is from Simple Icons (CC0), https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg; Microsoft uses four-square geometry. The S&P500 numeric mark is a custom index label. Marks identify reference assets, not a partnership. SVGs are inline with no runtime external requests.

Risk artwork is an original layered income statement with a zero indicator. Closing artwork is an original extruded Yieldex-inspired mark, lit edges and glass platform. All financial copy, native disclosure behavior, routes, arithmetic and finalizer boundaries remain.

Verification plan: compare against1393c45 screenshots, check all three company selections against canonical addresses, rapid selection/reload and keyboard, 1440/768/390/320 overflow/artwork, expanded risk and CTA navigation, console/network, full checks. Final results and tested hash are recorded in PR17.

Final result: PASS full pnpm check (153 Vitest,46 Foundry,9 OpenSpec; format/lint/types/generated/build). PASS company selection and exact canonical addresses, rapid switching and reload defaults on production build; keyboard disclosure, flow anchor, Launch app→unconfigured local lab→Home. PASS 1440/768/390/320 no overflow; new SVG artwork inspected desktop/mobile. Production console clean; local HTML/static resources200. A dev-browser input timed out during concurrent compilation; the same selection journey passed on the final production build. Reduced-motion/no-JS remain source/SSR only; live providers and other browsers are not tested. No merge/deploy.

## Reusable button feedback — 9 October 2026

User requested better shared button hover/animation. Old utility hover removed gradients abruptly and landing link overrides duplicated behavior. Shared CSS now preserves gradient, adds bounded surface light/shadow/lift, fast press and trailing-icon feedback; native focus/loading/disabled remain intact. LinkAction consumes the same rules. Verification matrix: primary/accent/outline/ghost, native and link paths, click count/loading/disabled, keyboard focus, desktop/mobile overflow, reduced-motion source and normal UI console. Baseline4eb9064. Final results recorded in PR17.

Button verification: baseline4eb9064 native hover reproduced gradient=none/transform=none. Revised real pointer hover keeps the green/purple gradient, surface opacity increases and lift settles at2px; trailing icon moves2px. Native Space increments submit once; loading is disabled/aria-busy/full opacity with transform none, then recovers; disabled remains40% and inactive. Keyboard outline2px/offset3px visible.390px page has no horizontal overflow. Static pressed specimens/source cover compression; held-pointer frame, OS reduced-motion and physical touch are not runtime-tested. Full gate153 Vitest/46 Foundry/9 OpenSpec passes; final styling-only build and production smoke results recorded in PR.

## Footer signature — 9 October 2026

User rejected the small four-column footer and requested a more expressive ending. Plan: editorial brand statement, two clear navigation groups, an oversized Yieldex wordmark with a restrained horizon/light treatment, back-to-top control and compact testnet disclosure. Preserve every real destination and the no-real-backing boundary; no invented social accounts, audience counts or operational status. Risk matrix: all footer destinations/anchors, keyboard focus/back-to-top, desktop/tablet/mobile320px wrapping/assistant clearance, static SSR/reduced motion, console and resources. Baseline2d12875 and user screenshot.

Footer verification: PASS full pnpm check (153 Vitest/46 Foundry/9 OpenSpec, lint/types/generation/build); final typography adjustments separately pass format/spec/build. PASS production Chromium1440/768/390/320 no horizontal overflow, two-column mobile navigation and assistant clearance. PASS keyboard Back to top returns hash#top/scrollY0; footer How it works and Income scenarios reach the correct anchors. Destination audit matches existing routes/docs and canonical market address. Production console has no new warnings/errors (older dev Lit notice only); HTML and23 referenced static resources return200. Reduced motion and no-JS are source/SSR only; external docs availability, live providers, other engines and full assistive-technology audit not reverified. No financial logic changed. Final tested revision is recorded in PR17; evidence remains outside Git.

## Minimal footer correction — 9 October 2026

User supersedes the separated green surface and line-heavy footer: continuous canvas, plain unnumbered navigation, logo beside the wordmark, mouse-following light clipped to the lettering. Preserve destinations, disclosure and keyboard access. Before:3bf0554. Verification matrix: mouse enter/move/leave and cancellation, static touch/reduced-motion fallback, keyboard links, desktop/mobile overflow, console and full checks.

PASS full pnpm check153 Vitest/46 Foundry/9 OpenSpec plus production build. Final logo-only SVG update rebuild passed. Real browser pointer movement updates light coordinates (wordmark center490px → logo−119px); leaving clears data-lit and fades the overlay. Production build confirms the light and no console errors. Desktop1440 and mobile320 have no horizontal overflow; keyboard links and back-to-top remain operational. Touch/reduced-motion/cancel guards are source-checked, not physical-device or OS-preference runtime-tested. No new dependency or financial changes.

## Hero preview artwork — 9 October 2026

User requested conceptual assets and relevant hover/animation for the three preview cards. Backing now has a layered glass vault/Apple coin, the offer a 50% income seal, and the buyer a layered ticket that changes with purchase/allocation. Reuses the existing Apple mark. Original numbers, timing, in-kind allocation and illustrative-only flow remain. Pointer hover lifts the coin/ticket, center retains bounded tilt; pointer cancellation resets tilt. Motion is finite with reduced-motion CSS. No dependencies or wallet actions added.

Risk matrix: ordinary purchase/dividend/replay, keyboard and rapid stage selection, backing remains100 and allocation0.50/0.50, reload default, hover/reset, narrow layouts and console; touch/reduced-motion source checks. Baseline8898309/user screenshot.

PASS full pnpm check (153 Vitest/46 Foundry/9 OpenSpec, format/lint/types/generated/build). Browser production purchase→allocation→replay preserves100 backing,90 price,50% share and0.50/0.50 claim example. Keyboard replay and rapid3→2→1 stage selection recover; reload initializes first stage. Real hover activates the coin lift/rotation (observed translateY−6.6px during transition toward−8px). Mobile320 has no overflow; desktop1440 inspected. Production console has no errors. Touch/reduced-motion/pointer-cancel source-only; no live wallet/provider verification. Screenshot evidence outside Git.

## Assistant bubble — 9 October 2026

User requests a compact purple chat bubble that attracts clicks. Replaces only the initial session launcher with a64px rounded speech bubble, original inline face/spark, two gentle2.4s greeting/blink cycles and hover/focus label. Motion stops after4.8s; reduced-motion disables it. Native button keeps the existing session request/pending guard, disabled busy state and error recovery; connected Copilot UI unchanged.

Verification matrix: keyboard/click session opening, busy disabled, unavailable-session recovery/retry, mobile320 overflow and label placement, focus, finite motion and reduced-motion source, full quality gate. No live provider success implied by local fallback.

PASS full pnpm check153 Vitest/46 Foundry/9 OpenSpec and build. Real keyboard Enter starts request, displays disabled Membuka chat, then unavailable-session alert and enabled retry on the unconfigured local environment. PASS production320px no overflow;64px bubble and focus outline/tooltip (opacity1) observed. Finite animation iteration count2 confirmed; production console clean before session request. Live successful chat, physical touch and OS reduced-motion runtime not tested; unchanged provider/session behavior is not re-certified.

## Orbiting chat lights — 9 October 2026

User clarified that the bubble should have ongoing fairy-like lights around it. Two offset5s/7s orbits with soft shimmer/trails replace the fixed sparkle; hover increases brightness. A small pause/resume button and reduced-motion static fallback keep ongoing motion controllable. Loading pauses orbit. Session logic unchanged. Matrix: orbit position changes, pause/resume, keyboard control, mobile edge clearance, full checks. Browser observed2 moving orbits and paused computed animation state; provider success is not re-tested by this visual refinement.

## Transparent navbar — 9 October 2026

User requested no visible navbar boundary at the hero. Sticky navbar now overlays the hero background with no border, transparent at scrollY<=32; beyond32px or while mobile menu is open it uses an85% dark surface and18px blur. Navbar dimensions remain stable; hero offsets compensate at80/72/68px breakpoints. Existing Escape/outside-click/link behavior and destinations retained. Reduced-motion disables transition.

PASS full pnpm check153/46/9/build. Production browser: top background transparent/border0/data-solid false, anchor navigation gives dark85%/blur18px, home returns scrollY0/transparent. Mobile390 open gives solid/expanded true; Escape returns false with no overflow. Console clean. Initial older tab debugger synchronization timed out; fresh production tab verified. OS reduced-motion/other engines not runtime-tested. Baselinead0c479.
