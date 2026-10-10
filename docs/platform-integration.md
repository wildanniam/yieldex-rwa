# Product UI integration preview

Issue #19. Starting main: `5f95a81` (approved dashboard + landing). Source: [diamondver's PR #12](https://github.com/wildanniam/yieldex-rwa/pull/12), head `94366ae17d6263151b8294e74077799f2e289756`.

## What is retained

- The approved root landing, minimal portfolio, shared city/crypto background, tokens, buttons and single assistant runtime.
- PR12's marketplace card/filter/detail anatomy, purchase-review sequence and five-step sell composition, adapted to the newer design.
- Canonical backend, schemas, contracts and wallet console.

## Integration decisions

The `(platform)` layout owns the background; its nested `(product)` layout owns one sidebar/header/main for dashboard, marketplace/detail and sell. The functional `/lab` remains a sibling with its existing console shell. Landing Launch app links now open `/dashboard`.

PR12's older root navigation and placeholder destinations are not imported. Its source-only tests and prematurely archived specs are not accepted as live feature evidence. In the source PR, search/sort were unwired, most cards lacked matching details, and local buy/sell state could display successful transactions without a wallet. These are corrected in the adapted preview: coherent fixtures, working filters, exact amount validation and an unsigned review handoff.

Marketplace examples are shared by list, detail and purchase review. Assets are limited to the deployment manifest. Portfolio example IDs use a separate `PF-` prefix where they do not represent marketplace examples. No unsupported asset, made-up return estimate, successful payment, approval, deposit or published listing is presented as chain state.

## Handoff boundary

This is **UI integration for design feedback**, not completion of baseline tasks 5.1–5.6. Example balances/offers and creation drafts are local presentation state; refresh resets them. The wallet-console link opens `/lab` without transferring the draft or automatically selecting/signing an offer. Live API/wallet integration, account/network change, transaction rejection/replacement and persisted financial outcomes require separate acceptance. Backend and contract code are unchanged.

Other PR12 destinations (assets, positions, claims, activity, settings, assistant and demo console) were mostly placeholders. Portfolio tabs/disclosures and the existing assistant/console cover those destinations where implemented; empty pages are not added just to fill the sidebar.

## Verification matrix

| Scenario                                             | Status     | Evidence/boundary                                                                                                                                                                                                  |
| ---------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main baseline portfolio → Explore offers             | PASS       | Before changes this opened the preview disclosure on `5f95a81`; after adaptation it links to the marketplace.                                                                                                      |
| Shared shell, root and console separation            | PASS       | Real browser: root has no product shell; Launch app opens dashboard; product pages have one main/background; `/lab` keeps the original console shell.                                                              |
| Search/filter/sort/pagination/detail identity        | PASS       | Search Microsoft + resale finds L-0212; price sort starts 72/84/88/90; page 2 shows two offers; L-0211 list/detail/review agree on asset, price, share and remaining term.                                         |
| Unknown ID and empty search recovery                 | PASS       | No-match search resets with Clear filters; unknown ID returns HTTP 404 and a working marketplace return link.                                                                                                      |
| Purchase acknowledgement/Escape/reset                | PASS       | Acknowledgement gates payment review; Escape restores opener focus; reopening clears acknowledgement. Narrow dialog remains within a 320px viewport. No purchase is submitted.                                     |
| Sell validation/back/edit/review/reset               | PASS       | Microsoft example backing 100 > 40 rejected; Use max recovers; zero price rejected; valid 40/50%/90-day/90-DemoUSD draft reaches Ready; editing price resets acknowledgement; refresh resets the draft.            |
| Dashboard loading/error/empty, tabs/activity         | PASS       | Preview state controls exercised; Retry restores example; arrow keys move among holdings tabs; repeated Activity clicks reopen the disclosure. These are fixture-state tests, not provider failures.               |
| Desktop/tablet/mobile, keyboard and overflow         | PASS       | Marketplace at 1440/768/390/320; sell at 1440/390/320; dashboard at 1440/320; purchase dialog at 320. No page horizontal overflow. Mobile Escape/navigation/Back/Forward close menu; wallet dialog restores focus. |
| Console/network + production build                   | PASS       | No captured browser warnings/errors in production journeys; six routes return 200, unknown offer 404; all 52 discovered route assets return 200. HTTP asset checks are independent of browser network capture.     |
| Full pnpm check                                      | PASS       | Formatting, lint, types, 188 Vitest tests, 46 Foundry tests, generation, 11 OpenSpec changes and production build passed. Final targeted shell/dashboard checks also passed.                                       |
| Live API/wallet financial lifecycle                  | NOT TESTED | No provider secrets copied into this preview; `/lab` correctly reports missing configuration. No wallet signing, network/account changes, transaction failures or financial persistence exercised.                 |
| Assistant live conversation                          | BLOCKED    | Existing assistant opens its unavailable notice without runtime configuration; no model request was submitted.                                                                                                     |
| Safari, screen reader and OS reduced-motion behavior | NOT TESTED | Browser checks used the local Chromium-based preview. Existing reduced-motion styles are retained.                                                                                                                 |
| User visual acceptance, merge, deployment            | PENDING    | Draft review only; no main mutation or deployment.                                                                                                                                                                 |

QA images/logs are kept outside Git. Record the tested revision and actual results with the preview PR; do not mark pending baseline product gates complete.
