## Why

The Listing Detail screen explains an offer but currently has no purchase-review journey. Users need a contained, multi-step dialog that makes the payment quote, wallet confirmation boundary, and completion receipt explicit before any future transaction integration is enabled.

## What Changes

- Add a reusable `BuyModal` component at `apps/web/src/components/marketplace/buy-modal.tsx`.
- Implement the four-step state machine: `review`, `pay`, `confirm`, and `done`.
- Open the modal from the Listing Detail `Buy income rights` action with the selected listing context.
- Render the supplied review summary, swap quote, wallet confirmation, and demo receipt states.
- Keep the flow accessible and responsive with a dark modal overlay, close action, step progress, keyboard semantics, and explicit disabled/unavailable behavior where live wallet integration is not present.
- Preserve canonical marketplace purchase boundaries: a future live purchase uses `BUY_LISTING` transaction intent preparation and verified wallet context; this change does not add a swap or transaction executor.

## Capabilities

### New Capabilities
- `purchase-modal-flow`: Multi-step purchase review and demo confirmation dialog.

### Modified Capabilities
- `listing-detail-screen`: Opens the purchase dialog from the buy-offer action.

## Impact

- New `apps/web/src/components/marketplace/buy-modal.tsx`.
- Update `apps/web/src/app/marketplace/[id]/page.tsx` to provide a client interaction boundary and listing detail context.
- Add focused modal/detail tests and accessibility source contracts.
- Reuse existing `Button`, `Icon`, design tokens, and canonical transaction terminology.
- No schema, ABI, contract, quote-provider, wallet, or generated-type changes.
