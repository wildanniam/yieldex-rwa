# Landing concept illustrations

Scope: the feature group after the hero/product preview (`#why-yieldex`), followed by the approved continuation into `#how-it-works` and `#calculator`. Fradium is a composition/material reference, not a source of Yieldex product claims. Figma3583:2778 and detailed cards3583:2826/3583:2877 were inspected.

Implementation lives in `apps/web/src/components/landing/concept-cards.tsx` and its CSS module. Original SVG/HTML/CSS artwork avoids embedded text in raster images and scales without downloaded third-party assets or a new rendering library. Canonical Icon/AskAssistant are reused. SVG IDs use the section-specific `yx-` prefix and appear once per landing.

- Vault: retained100demoAAPL backing, separate50% income right.
- Offer ticket: share/term/fixed price example; barcode is purely decorative.
- Resale: whole position, unchanged original expiry, earned claims retained.
- AI: illustrative term/risk explanation; real CTA uses existing admission/error behavior.
- Proof: actual market deployment link.

No illustration is an actionable form. No transaction, quote, balance or AI response is fabricated as live data. Hero, assets, risks, footer and backend logic remain unchanged. Process and calculator presentation were subsequently revised as documented below.

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
