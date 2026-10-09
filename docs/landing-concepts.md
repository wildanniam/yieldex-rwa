# Landing concept illustrations

Scope: the feature group after the hero/product preview (`#why-yieldex`), as identified by Wildan's screenshot. Fradium is a composition/material reference, not a source of Yieldex product claims. Figma3583:2778 and detailed cards3583:2826/3583:2877 were inspected.

Implementation lives in `apps/web/src/components/landing/concept-cards.tsx` and its CSS module. Original SVG/HTML/CSS artwork avoids embedded text in raster images and scales without downloaded third-party assets or a new rendering library. Canonical Icon/AskAssistant are reused. SVG IDs use the section-specific `yx-` prefix and appear once per landing.

- Vault: retained100demoAAPL backing, separate50% income right.
- Offer ticket: share/term/fixed price example; barcode is purely decorative.
- Resale: whole position, unchanged original expiry, earned claims retained.
- AI: illustrative term/risk explanation; real CTA uses existing admission/error behavior.
- Proof: actual market deployment link.

No illustration is an actionable form. No transaction, quote, balance or AI response is fabricated as live data. Hero, process, calculator, assets, risks, footer and backend logic remain unchanged.

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
