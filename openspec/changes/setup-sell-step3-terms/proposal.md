## Why

The Sell flow now lets Alice choose an asset and preview a pending deposit, but Step 3 still shows a generic placeholder. Alice needs to define the income share, fixed upfront price, and duration while seeing the resulting draft terms and illustrative income estimate before review.

## What Changes

- Extend `/sell` with an interactive Terms step after Deposit.
- Add income-share control from 10% to 100%, defaulting to 50%, with buyer/seller breakdown.
- Add the DemoUSD fixed-price input and duration selector for 1m, 3m, 6m, and 12m, defaulting to 6m.
- Add deposit-confirmed draft status, income estimate disclosure, and synchronized right-hand listing preview.
- Keep Continue local, advancing Terms to Review without creating or publishing a listing.
- Preserve the future `CREATE_PRIMARY_LISTING` field mapping and financial/accounting boundaries.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sell-multistep-flow`: Add interactive Terms state and draft preview.

## Impact

- `apps/web/src/app/sell/page.tsx` gains terms state, slider, price input, duration selector, and preview fields.
- Sell flow tests gain Terms coverage.
- Existing `Slider`, `SegmentedControl`, `TextInput`, `Button`, `Icon`, and design tokens are reused.
- No schema, ABI, generated type, wallet, quote, or contract changes.
