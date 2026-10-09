# Portfolio dashboard slice

## Scope

`/dashboard` renders the personal overview from [Figma empty 60:18962](https://www.figma.com/design/XgSDQCwLb41j9XjTDwLtM2/Design-Yieldex?node-id=60-18962), with [Alice 60:18558](https://www.figma.com/design/XgSDQCwLb41j9XjTDwLtM2/Design-Yieldex?node-id=60-18558) informing the filled preview. It is named My Portfolio in navigation, distinct from public Marketplace. Root `/` stays the landing. The original `/lab` remains the functional wallet interface.

This is a UI slice, not a connected portfolio. A visible state selector exposes empty (default), example, loading and error. No preview state is saved or used as an authenticated identity. Reload returns to empty. No balances, approval, transaction, nonce or history records are written. Buttons for unintegrated financial destinations explain the boundary in a dialog and offer the real lab route. They do not fake a success. The existing single chatbot wrapper handles AI entry; an unconfigured runtime displays its existing error/retry UI.

## Reuse and integration

- Entry: `apps/web/src/app/dashboard/page.tsx`; client presentation: `components/dashboard/dashboard.tsx` and scoped CSS module.
- Reuse `Button`, `buttonVariants`, `Icon`, canonical theme tokens, Inter and local Yieldex logo. Assets are already documented in `design-system-assets.json` and `landing-assets.json`. No new dependency or icon pack.
- Sidebar/header layout can be extracted to a shared product shell when the next real product route is implemented; it intentionally does not replace the developer WorkspaceShell.
- Replace presentation examples with canonical API DTO adapters. Do not promote example display strings to another wire model or parse them for accounting. Scope claims per asset; no sum across unlike tokens and no assumed USD price.
- Read portfolio using verified wallet identity. Handle disconnect, account/chain switch, session expiry, source finality and stale snapshots before enabling financial actions. Reuse the existing transaction preview/intent and wallet modules; do not send from the AI or a static card.
- No real Marketplace, login or wallet integration is claimed by this slice. No baseline product tasks 5.1–5.6 are marked complete by its UI tests.

## Visual decisions

Preserve Figma sidebar, four metrics, portfolio tabs and separate claims/activity panels. Keep the purple claim card, mint controls, subtle borders and 24px rounded panels. Add a compact title/preview toolbar, phone disclosure menu, focused empty states and an AI card. Do not show Figma's example receipt logs in the empty portfolio, unsupported demoNVDA/demoKO, fabricated transaction hashes, connected avatars or unverified dollar valuations. Example listings are separate illustrative offers, not a complete reconciled account ledger.

## Verification

See the PR for tested revision and final results. Coverage includes default empty, example tabs, unavailable states, dialog keyboard/focus restoration, retry, mobile/tablet/desktop, adjacent navigation and assistant unavailable behavior. Backend/provider success, signing/claims, persisted portfolio, native wallet apps, Safari/Firefox and full assistive-technology audit remain separate acceptance.

## Local verification — 9 October 2026

- PASS: pnpm check, 157 Vitest tests, 46 Foundry tests, lint/types/format, generated artifacts, 9 OpenSpec changes and production build. Sandbox initially blocked listener tests (EPERM); the same suite passed with local port permission. Existing Foundry warnings remain.
- PASS: Chromium desktop1440, tablet768, mobile390/320; page width matches viewport, narrow listing table scrolls inside its container. Empty, example, loading, error and explicit preview retry verified. Arrow/Home tab selection, native dialog Escape/close/reopen and focus restoration verified; mobile navigation Escape restores focus.
- PASS: production dashboard assets load, logo keeps original611:188 aspect ratio. An initial development image-ratio warning was corrected; no new warning/error observed on production dashboard. Dev Lit warning is not a production failure. HTTP200 for landing/dashboard/lab; dashboard dialog handoff reaches lab.
- PASS with environment limit: existing assistant unavailable response and retry were exercised with HTTP403 admission on the local runtime without environment credentials. No live AI success is claimed. Lab correctly shows its unconfigured fallback; this proves route preservation only.
- NOT TESTED: live balances, wallet signing, backend successful admission, persisted transaction outcomes, Safari/Firefox, OS-level reduced motion and full assistive-technology audit. Reduced-motion CSS inspected; no new ambient motion. QA screenshots/logs remain outside Git.
