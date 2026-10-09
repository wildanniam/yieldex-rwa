## Why

The Sell flow now lets Alice select backing, define terms, and acknowledge the Review step, but the final Confirm step is still a generic placeholder. Alice needs a clear last risk check before creating the demo listing, including the distinction between selling income rights and transferring principal.

## What Changes

- Complete `/sell` with a Confirm step after Review.
- Highlight all five progress tracks when Confirm is active.
- Render the rights summary, simulated network fee, cancellation/backing notice, and final risk acknowledgement.
- Require the Confirm risk checkbox before enabling `Create listing`.
- Simulate listing creation locally, show a success notification, and navigate to the existing My Listings route (`/listings`) without signing, submitting, or mutating the chain.
- Keep the final listing preview synchronized with the existing asset, backing, income share, duration, and price draft values.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sell-multistep-flow`: Add the Confirm risk gate and simulated completion transition.

## Impact

- `apps/web/src/app/sell/page.tsx` gains Confirm risk state, final summary, simulated completion action, and navigation.
- `apps/web/src/app/sell/sell-multistep-flow.test.ts` gains Confirm coverage.
- Existing `Checkbox`, `Button`, `Icon`, router, and notification/accessibility patterns are reused.
- No schema, ABI, generated type, wallet adapter, transaction-intent, or contract changes.
