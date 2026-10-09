## Context

The current Listing Detail page renders its buy CTA as disabled because purchase preparation and wallet execution are not yet wired. The requested design is a four-step modal that previews a purchase using DemoUSD/ETH values and ends in a demo receipt. The product contracts distinguish read-only quote data, transaction-intent preparation, wallet submission, and finalized receipt verification; the modal must not collapse those states into a false live success.

## Goals / Non-Goals

**Goals:**
- Provide a reusable modal shell with the requested dark overlay, 520px maximum width, progress indicator, close control, and responsive content.
- Make review consent explicit before advancing from Review.
- Show payment quote expiry, route comparison, slippage choice, and selected route before confirmation.
- Clearly distinguish a wallet confirmation request from a completed receipt.
- Provide a deterministic demo completion state for the supplied mock listing while labeling it as simulated.
- Preserve focus/keyboard semantics, modal labeling, and safe close/reset behavior.

**Non-Goals:**
- Sending a wallet transaction, signing calldata, approving tokens, executing a swap, bridging, or mutating ownership.
- Adding a second quote engine or inventing a new API response schema.
- Claiming that demo balances, addresses, timestamps, block numbers, or transaction hashes are live chain evidence.
- Making a purchase automatically from page load, hydration, AI output, or modal open.

## Decisions

### 1. Use a discriminated step state machine

`BuyModal` owns `step: 'review' | 'pay' | 'confirm' | 'done'`. Each transition is explicit:

- Review → Pay requires the income-risk checkbox to be checked.
- Pay → Confirm requires a selected route and displays the quote expiry/route data.
- Confirm → Done is demo-only in this change and must be labeled as a simulated completion.
- Done → View position navigates to `/positions`; closing the modal returns to the detail page.

The component receives listing identity and display terms as props rather than reading a stale Marketplace card fixture.

### 2. Keep the modal client-side and isolate it from the server route

The dynamic detail route may remain a server-rendered data boundary, but an interactive client wrapper owns modal open/close and step state. The wrapper must not put secrets or server-only imports into shared UI code.

### 3. Use a shared modal accessibility contract

The overlay exposes `role="dialog"`, `aria-modal="true"`, and an accessible label. Escape and the close button dismiss the modal; focus is placed inside on open and should not leave the dialog while it is active. Background content is inert/hidden from assistive technology while open. Reduced-motion users do not depend on animated transitions.

### 4. Treat quote and receipt values as demo presentation data

The requested values (`0:28`, `0.04540 ETH`, `90.07 DemoUSD`, route totals, demo wallet identity, receipt hash, and block) are static illustrative values unless a validated quote/receipt adapter is later supplied. Copy must identify the receipt as a confirmed demo receipt and must not imply finalized chain ownership.

### 5. Preserve the canonical live purchase boundary

When live purchase preparation is implemented, the modal must use `POST /api/v1/transaction-intents` with `action: "BUY_LISTING"` and the canonical listing key. It must re-read listing terms, account, chain, allowance, deadline, and snapshot before presenting an actionable wallet step. It must not accept arbitrary recipient, target, calldata, gas override, or wallet address from UI text.

### 6. Keep quote semantics read-only

The Pay step may present a quote and route comparison but does not execute a swap. Quote expiry, provider errors, stale data, or unavailable routes must be explicit states; no fabricated fallback quote may be presented as live.

## Risks / Trade-offs

- A demo Done state can be mistaken for a real purchase; strong simulated/confirmed-demo copy and disabled live boundaries are required.
- Focus trapping and restoration are easy to regress, so they require dedicated accessibility tests or source contracts.
- A fixed modal width must collapse to viewport-safe padding on narrow screens and avoid clipping the quote/table content.
- A static countdown should not be described as a live provider expiry until a real quote response supplies `expiresAt`.
