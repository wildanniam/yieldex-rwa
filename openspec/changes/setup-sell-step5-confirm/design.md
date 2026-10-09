## Context

The Sell flow is a local five-step draft. Confirm must represent the final user acknowledgement and a demo completion state, not a live listing transaction. The supplied reference shows the rights summary, fee disclosure, cancellation semantics, risk acknowledgement, and a full-width create action.

## Goals / Non-Goals

**Goals:**
- Render Confirm as the active fifth step with every progress track highlighted.
- Show the selected asset, locked backing, retained rights, buyer share, purchase-starting duration, payout token, and fixed upfront price.
- Show the simulated network fee and cancellation/backing behavior.
- Require the risk acknowledgement before enabling `Create listing`.
- On confirmation, provide an explicit simulated-success notification and navigate to the existing `/listings` destination.

**Non-Goals:**
- Calling a wallet, signing, approving, depositing, creating a transaction intent, publishing a live listing, or locking tokens onchain.
- Treating the displayed fee, backing, seller, price, or income values as live chain evidence.
- Adding a new listing API contract, schema field, ABI, or persistence layer.
- Implementing a live receipt, settlement, or cancellation operation.

## Decisions

### 1. Keep Confirm as a local draft boundary

The Confirm step is entered only after Review acknowledgements pass. Its final checkbox is controlled local state and defaults to unchecked. `Create listing` is disabled until it is checked, then performs a simulated completion action only.

The completion action must not call a wallet or transaction service. It may set a transient completion/notification state before navigating to the existing My Listings route `/listings`; the notification must identify the result as a demo/simulated listing creation rather than a confirmed chain publication.

### 2. Reuse shared controls and preserve accessibility

Use `Checkbox` for:

`I understand income may be lower than estimated or zero.`

Include the supporting copy `Checked · required before creating the listing.` when checked, and preserve an accessible label and disabled state for the final CTA. Use the existing `Button` and `Icon` primitives for the action and information banner.

### 3. Derive the rights summary from the existing draft

The summary uses the selected asset and existing `depositAmount`, `incomeShare`, `duration`, and `price` state. For the default draft it shows:

- `Locked 100 dAAPL`;
- `You keep 50% of income`;
- buyer income share `50%`;
- `Period starts at purchase, ends after 6 months`;
- `Payout in dAAPL`;
- `Price 90 DemoUSD`.

No UI value is converted to an accounting amount or used as transaction authorization.

### 4. Preserve custody and economic disclosures

The Confirm copy states that creating a listing does not sell or transfer principal, that cancellation is possible until sale, and that backing remains locked for the income-rights obligation after purchase. The network fee remains explicitly labeled `about 0.0007 ETH (simulated)` and paid separately in ETH.

### 5. Use the existing route mapping

The navigation target is `/listings`, the route already used by the global sidebar for My Listings. The change must not introduce a parallel `/my-listings` route. If the notification mechanism requires destination handoff, use the repository's existing client notification pattern and mark the message as simulated.

## Risks / Trade-offs

- A `Create listing` label can be mistaken for a real publication; the simulated boundary and success notification must be visible.
- The static fee can be mistaken for a quote; retain the simulated label and avoid presenting it as a live estimate.
- A notification shown immediately before navigation may disappear on route change; use the existing app notification handoff pattern or a destination-visible success state rather than silently dropping feedback.
