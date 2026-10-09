## Why

The Sell flow now supports local asset selection, but Step 2 still renders a generic draft placeholder. Alice needs a clear deposit screen that explains the exact backing amount, vault destination, allowance boundary, and the difference between depositing backing and transferring principal to a buyer.

## What Changes

- Extend `/sell` so the Deposit step renders the selected asset's amount input and vault deposit status.
- Reuse `AmountInput` with a default amount of `100`, the selected asset tag, `MAX`, illustrative USD value, and available balance.
- Add the vault notice, approval/deposit checklist, exact allowance and destination details, and the `Open wallet` accent action.
- Update the draft preview to show `Backing pending deposit` while preserving principal and payout disclosures.
- Keep Continue local and advance from Deposit to Terms without approving, depositing, signing, or mutating the chain.
- Preserve the canonical future primary-listing boundary; deposit and listing creation must use verified wallet context and the existing `CREATE_PRIMARY_LISTING` contract terminology.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sell-multistep-flow`: Add the Deposit step behavior and pending-deposit preview state.

## Impact

- `apps/web/src/app/sell/page.tsx` gains Deposit-step rendering and amount state.
- `apps/web/src/app/sell/sell-multistep-flow.test.ts` gains Deposit coverage.
- Existing `AmountInput`, `Button`, `Icon`, design tokens, and global Sell shell are reused.
- No schema, ABI, generated type, wallet adapter, or contract changes.
