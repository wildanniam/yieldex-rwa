## Context

The Sell route currently renders only a placeholder. The reference design shows a desktop two-column workspace: the active form on the left and a live draft preview on the right. The product contract treats primary listing creation as an atomic onchain action, so the UI must distinguish local draft selection from deposit, intent preparation, wallet approval, and confirmed listing state.

## Goals / Non-Goals

**Goals:**
- Render the requested global shell, Sell heading, active navigation state, five-step progress indicator, and responsive two-column layout.
- Make registered asset selection data-driven and keyboard accessible.
- Keep the draft preview synchronized with the selected asset while preserving the default 50% share, six-month term, and 90 DemoUSD illustrative price.
- Show the disabled unregistered-token state and explain why it cannot be deposited.
- Make all financial values explicitly illustrative and keep principal/rights boundaries visible.
- Provide clear step state semantics for future Deposit, Terms, Review, and Confirm implementation.

**Non-Goals:**
- Depositing tokens, approving allowances, creating a listing, signing, or sending a transaction.
- Adding a parallel listing DTO or changing the canonical `CREATE_PRIMARY_LISTING` request.
- Treating wallet balances, token registration, price, or income estimates as live unless supplied by a validated API/read adapter.
- Implementing secondary listings, swaps, auto-conversion, guaranteed returns, or loan behavior.

## Decisions

### 1. Use a client flow container with explicit step state

The Sell page owns a typed step state for `asset`, `deposit`, `terms`, `review`, and `confirm`. The initial render starts at `asset`; Continue advances only the local draft state. Later steps must be visibly marked as draft/unimplemented until their contracts and wallet actions are wired.

### 2. Keep asset selection separate from backing deposit

Selecting dAAPL changes the draft preview only. It does not lock backing, reserve balance, or create an OFFERED position. The UI copy must state that the backing is not deposited and that the seller is selling income rights rather than the token.

### 3. Use a typed presentation model that can map to canonical data

Asset cards use a view model containing asset identity, symbol, balance, illustrative value, registry status, and payout token. A future adapter must source identity/registration/balance from validated canonical asset/account data and preserve integer amounts as strings until display formatting. The preview's eventual request maps to:

`CREATE_PRIMARY_LISTING(assetKey, depositTokenAmountAtomic, minReceivedShares, incomeBps, durationSeconds, priceAtomic, listingExpiresAt)`.

### 4. Keep draft terms visibly non-live

The initial defaults are 100 dAAPL backing, 50% income share, six months from purchase, payout in dAAPL, and 90 DemoUSD fixed upfront. They are illustrative draft defaults, not a quote, promise, live listing, or guarantee of income.

### 5. Preserve responsive navigation landmarks

The desktop layout uses a form column and a preview column. At narrow widths it becomes one column with the stepper and Continue action still reachable; no fixed panel may create horizontal overflow or hide the active navigation route.

### 6. Define the future confirmation boundary

The Confirm step may summarize the normalized request and required allowance, but a live action must use the verified wallet/chain context and canonical transaction-intent preparation. The UI must never accept arbitrary recipient, target, calldata, or gas override from draft fields.

## Risks / Trade-offs

- Static balances can look authoritative; labels must retain “illustrative” language until a read adapter is connected.
- A five-step shell can suggest all steps are complete; active/pending/locked states must be explicit.
- Default terms may be mistaken for seller intent; review must require an explicit confirmation before any future transaction step.
- A responsive preview may move below the form on small screens, so the draft summary must remain available before Continue.
