## Why

The Sell flow now supports local asset selection, a simulated deposit state, and editable listing terms. Alice needs a review step that makes the complete draft explicit before the flow can enter confirmation, including the backing, income-rights period, price, and required acknowledgements.

## What Changes

- Extend `/sell` with a Review step after Terms.
- Highlight Asset, Deposit, Terms, and Review in the stepper while keeping Confirm inactive.
- Render a listing summary for dAAPL, Alice's seller identity, vault backing, income share, duration, and fixed DemoUSD price.
- Add two controlled acknowledgement checkboxes for vault backing and the time-limited income-rights transfer.
- Keep `Edit terms` local and return to Terms without losing the draft.
- Require both acknowledgements before the local `Publish listing` action advances to Confirm.
- Update the right-hand preview to show `Ready to publish` and the current draft values.
- Preserve the draft-only boundary: no signing, publishing, transaction intent, or chain mutation occurs in Review.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sell-multistep-flow`: Add the Review step summary, acknowledgements, preview state, and guarded transition to Confirm.

## Impact

- `apps/web/src/app/sell/page.tsx` gains Review acknowledgement state, summary content, and guarded local transitions.
- `apps/web/src/app/sell/sell-multistep-flow.test.ts` gains Review coverage.
- Existing `Checkbox`, `Button`, `Icon`, and design tokens are reused.
- No schema, ABI, generated type, wallet adapter, transaction-intent, or contract changes.
