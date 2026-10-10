# Portfolio dashboard slice

## Scope

`/dashboard` renders the personal overview from [Figma empty 60:18962](https://www.figma.com/design/XgSDQCwLb41j9XjTDwLtM2/Design-Yieldex?node-id=60-18962), with [Alice 60:18558](https://www.figma.com/design/XgSDQCwLb41j9XjTDwLtM2/Design-Yieldex?node-id=60-18558) informing the filled preview. It is named My Portfolio in navigation, distinct from public Marketplace. Root `/` stays the landing. The original `/lab` remains the functional wallet interface.

This is a UI slice, not a connected portfolio. Preview settings in the footer exposes empty (default), example, loading and error. No preview state is saved or used as an authenticated identity. Reload returns to empty. No balances, approval, transaction, nonce or history records are written. Buttons for unintegrated financial destinations explain the boundary in a dialog and offer the real lab route. They do not fake a success. The existing single chatbot wrapper handles AI entry; an unconfigured runtime displays its existing error/retry UI.

## Reuse and integration

- Entry: `apps/web/src/app/(platform)/dashboard/page.tsx`; client presentation: `components/dashboard/dashboard.tsx` and scoped CSS module.
- Reuse `Button`, `buttonVariants`, `Icon`, canonical theme tokens, Inter and local Yieldex logo. Assets are already documented in `design-system-assets.json` and `landing-assets.json`. No new dependency or icon pack.
- Sidebar/header layout can be extracted to a shared product shell when the next real product route is implemented; it intentionally does not replace the developer WorkspaceShell.
- Replace presentation examples with canonical API DTO adapters. Do not promote example display strings to another wire model or parse them for accounting. Scope claims per asset; no sum across unlike tokens and no assumed USD price.
- Read portfolio using verified wallet identity. Handle disconnect, account/chain switch, session expiry, source finality and stale snapshots before enabling financial actions. Reuse the existing transaction preview/intent and wallet modules; do not send from the AI or a static card.
- No real Marketplace, login or wallet integration is claimed by this slice. No baseline product tasks 5.1–5.6 are marked complete by its UI tests.

## Visual decisions

The user's Fradium reference supersedes the original dense layout: one purple claim summary, a borderless portfolio area with Positions/Listings/Vault tabs, collapsed activity and contextual position details. Keep the Yieldex brand and semantics. Do not invent a total USD valuation. Remove repeated metrics, duplicate claim balances and the large AI card; the existing assistant remains reachable from navigation. A compact preview disclosure remains visible; preview state controls are secondary in the footer. The transparent sidebar reveals the full-canvas artwork; the mobile menu uses a dark translucent surface for readability.

## Verification

See the PR for tested revision and final results. Coverage includes default empty, example tabs, unavailable states, dialog keyboard/focus restoration, retry, mobile/tablet/desktop, adjacent navigation and assistant unavailable behavior. Backend/provider success, signing/claims, persisted portfolio, native wallet apps, Safari/Firefox and full assistive-technology audit remain separate acceptance.

## Local verification — 9 October 2026

- PASS: pnpm check, 157 Vitest tests, 46 Foundry tests, lint/types/format, generated artifacts, 9 OpenSpec changes and production build. Sandbox initially blocked listener tests (EPERM); the same suite passed with local port permission. Existing Foundry warnings remain.
- PASS: Chromium desktop1440, tablet768, mobile390/320; page width matches viewport, narrow listing table scrolls inside its container. Empty, example, loading, error and explicit preview retry verified. Arrow/Home tab selection, native dialog Escape/close/reopen and focus restoration verified; mobile navigation Escape restores focus.
- PASS: production dashboard assets load, logo keeps original611:188 aspect ratio. An initial development image-ratio warning was corrected; no new warning/error observed on production dashboard. Dev Lit warning is not a production failure. HTTP200 for landing/dashboard/lab; dashboard dialog handoff reaches lab.
- PASS with environment limit: existing assistant unavailable response and retry were exercised with HTTP403 admission on the local runtime without environment credentials. No live AI success is claimed. Lab correctly shows its unconfigured fallback; this proves route preservation only.
- NOT TESTED: live balances, wallet signing, backend successful admission, persisted transaction outcomes, Safari/Firefox, OS-level reduced motion and full assistive-technology audit. Reduced-motion CSS inspected; no new ambient motion. QA screenshots/logs remain outside Git.

## Shared background — 9 October revision

The replacement user-approved artwork is stored at `public/backgrounds/platform.webp` (2600×1560, WebP quality85). It is decorative, served through Next Image optimization, and has a dark canvas fallback. `components/platform/background.tsx` owns one fixed, pointer-transparent layer plus a light contrast scrim; the desktop sidebar is transparent, and text retains contrast against the dark artwork. There is no entrance animation or pathname key to restart the image.

The shared nested layout lives at `app/(platform)/layout.tsx`. Dashboard and the existing lab are in this route group with unchanged URLs (`/dashboard`, `/lab`). **Put future product pages—marketplace, positions, claims, listing creation and wallet entry—under this group**, keeping the background in its layout rather than copying it into pages. The group is structural and does not create those future routes. Landing and developer catalog/workspace retain their existing layouts. A single root ChatbotWrapper still owns chat.

Verification for this revision: check background on desktop/mobile, tab changes, scroll and client navigation dashboard -> lab -> back; check text readability, local image loading and console; rerun route type/build and the required pre-push checks.

Shared-background verification PASS: original/source SHA256 matches; production image loads; exactly one background layer on dashboard and lab and after back navigation; background top stays0 at scrollY382; desktop1440 and mobile390 have no horizontal overflow; tabs and mobile Escape work; production console has no new warnings/errors. Full pnpm check passes (157 Vitest,46 Foundry,9 OpenSpec changes,production build). Live lab still uses the explicitly unconfigured local fallback; no financial runtime claim.

## Minimal refinement verification plan

Reuse issue14/PR15. Test empty/example/loading/error, disabled unknown claims, tab keyboard navigation, position and activity disclosures, preview selector, financial dialog/Escape, mobile menu/focus, reload, image loading and console. Check viewport1440/768/390/320, no horizontal overflow, dashboard/lab/back background continuity and landing isolation. Financial/AI live success remains outside this UI slice.

### Minimal refinement results — 9 October

- PASS: full pnpm check (157 Vitest,46 Foundry,9 OpenSpec changes,format/lint/types/generation/build).
- PASS: production Chromium empty/example/loading/error and retry/reload; unknown claim disabled; tab ArrowRight/End; position details and Activity navigation open the right disclosure; claim/review dialogs close with Escape and restore focus.
- PASS: 1440/768/390/320 viewport widths without document overflow; small listing table scrolls internally. Mobile navigation Escape restores the trigger.
- PASS: replacement WebP image loads on dashboard/lab, one fixed background layer at scroll; no background on landing. Desktop sidebar is transparent; mobile disclosure remains readable with a translucent dark surface. Source PNG1880213bytes -> WebP14964bytes at2600x1560.
- PASS with limit: assistant entry reaches the existing unavailable fallback on local admission403. No new production console warnings/errors. Prior dev-only Lit warning remains in the browser log from port3010.
- NOT TESTED: live wallet/financial actions, live AI success, Safari/Firefox and full assistive technology audit. No change to economic or API behavior.

## Platform integration preview — superseding navigation update

Issue #19 extracts the approved shell into `components/platform/shell.tsx` and shares it across the product route group. The portfolio layout and preview states remain, while Marketplace and Create listing now navigate to actual preview pages. Landing entry links target `/dashboard`. Wallet/claim actions still hand off to `/lab`; this change does not complete baseline live wallet/API acceptance. Earlier verification entries above remain historical.
