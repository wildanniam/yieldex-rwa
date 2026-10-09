## Why

The Sell route is still a placeholder, so Alice cannot review how a backing asset becomes a time-limited income-rights listing. The requested design needs a guided flow that makes asset selection and draft terms visible before any backing is deposited or a listing is published.

## What Changes

- Replace the `/sell` placeholder with a responsive five-step listing-creation surface.
- Add the stepper for Asset, Deposit, Terms, Review, and Confirm.
- Implement the first Asset step with registered-token selection, balances, disabled unregistered-token state, and the live “Your listing” draft preview.
- Add clear draft disclosures: backing is not deposited, principal remains with Alice, payout is in the same token, and terms are defaults until confirmed.
- Define the remaining steps as explicit draft states/placeholders so navigation cannot imply that a listing or deposit already exists.
- Align the eventual publish boundary with the canonical `CREATE_PRIMARY_LISTING` transaction-intent contract and shared schemas; no wallet transaction is introduced by this presentation-first change.

## Capabilities

### New Capabilities
- `sell-multistep-flow`: Guided primary income-rights listing creation and draft preview.

### Modified Capabilities
None.

## Impact

- `apps/web/src/app/sell/page.tsx` becomes the Sell flow entry point.
- New reusable Sell flow components may live under `apps/web/src/components/sell/`.
- Existing navigation remains the global shell with Sell active and the top bar heading `Sell`.
- Existing `Button`, `Icon`, and design tokens are reused.
- No changes to schemas, ABI, contracts, generated artifacts, wallet adapters, or marketplace accounting.
