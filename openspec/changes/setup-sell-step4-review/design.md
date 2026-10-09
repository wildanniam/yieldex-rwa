## Context

The Sell flow has five local draft steps, with Asset, Deposit, and Terms implemented. Review must consolidate the current draft without implying that a listing has been published or that a wallet action has occurred. The supplied design shows a seller-facing summary, a risk acknowledgement, and a ready-to-publish preview before confirmation.

## Goals / Non-Goals

**Goals:**
- Render Review as the active fourth step with the first four progress tracks highlighted and Confirm inactive.
- Show the current asset, seller identity, vault backing, income share, duration, payout semantics, and fixed price.
- Require two explicit acknowledgements before entering Confirm.
- Keep `Edit terms` local and preserve all existing draft state.
- Synchronize the right preview with the same draft values and identify it as ready to publish.

**Non-Goals:**
- Publishing a listing, signing a wallet message, creating a transaction intent, or mutating the chain.
- Reconfirming a vault receipt from static UI state or introducing a new API request shape.
- Changing canonical listing fields, accounting semantics, token decimals, or contract interfaces.
- Implementing the Confirm step or final receipt behavior.

## Decisions

### 1. Keep review acknowledgements in local state

The two checkbox values are controlled state owned by the existing Sell page. They default to unchecked whenever the page is loaded, and both must be true for the `Publish listing` transition. Returning to Terms preserves the draft values; returning to Review preserves the current acknowledgement state unless the page is remounted.

### 2. Reuse the shared Checkbox primitive

Use `Checkbox` from `@/components/ui/checkbox` for:

- confirming that `100 dAAPL` is locked in the Yieldex Vault as backing;
- understanding that income rights transfer for six months upon purchase.

The primary action remains disabled until both controls are checked, with accessible labels explaining the requirement.

### 3. Keep the transition local and explicit

`Edit terms` sets the step to `terms`. `Publish listing` and the right preview's Continue action set the step to `confirm` only after both acknowledgements are checked. Neither action signs, publishes, submits, or claims an onchain result.

### 4. Derive the summary and preview from existing draft state

The Review summary and final preview use the selected asset, deposit amount, `incomeShare`, `duration`, and `price` already held by the Sell flow. The fixture seller remains Alice Hartono with the abbreviated demo address `0x7a3F...9c2E`. The preview shows `Ready to publish`, `100 dAAPL`, `50%`, `6 months`, and `90 DemoUSD` for defaults.

### 5. Preserve financial and custody boundaries

Review copy distinguishes locked vault backing from transfer of income rights. The seller retains the principal, the buyer receives only the time-limited income rights after purchase, and all values remain draft/demo presentation data until a verified confirmation flow exists.

## Risks / Trade-offs

- Static `Vault deposit confirmed` copy can be mistaken for live receipt evidence; the page must retain draft/demo context and avoid invoking a live adapter.
- A disabled primary action needs an accessible explanation so users understand which acknowledgements are missing.
- The right preview must not bypass the acknowledgement gate even though it has its own Continue control.
