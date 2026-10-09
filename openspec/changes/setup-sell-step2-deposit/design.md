## Context

The first Sell implementation advances through five local draft steps but only renders the Asset form. The supplied Step 2 reference requires a deposit-specific explanation: the backing is moved to a Yieldex vault for this listing, the principal remains owned by Alice, approval is exact rather than unlimited, and the deposit is not confirmed until the wallet receipt exists.

The repository's `AmountInput` already provides a decimal input, token adornment, `MAX` callback, simulated USD label, and balance text. The transaction contract treats approval and deposit as explicit wallet operations; a presentational Step 2 must not claim either operation succeeded.

## Goals / Non-Goals

**Goals:**
- Render Deposit as the active step after Asset, with Asset and Deposit progress tracks green and later tracks inactive.
- Show the selected asset amount defaulting to `100`, token tag, `MAX`, illustrative USD value, and available balance.
- Explain vault locking, exact allowance, destination, pending signature, and the distinction from principal transfer.
- Keep the draft preview synchronized with the selected asset and show `Backing pending deposit`.
- Advance to Terms locally without creating approval/deposit side effects.

**Non-Goals:**
- Implementing ERC-20 approval, vault deposit, wallet connection, receipt polling, or transaction-intent submission.
- Changing canonical request fields, token decimals, accounting rules, or contract interfaces.
- Treating the supplied balance, USD value, Sepolia destination, or allowance status as live chain evidence.
- Introducing unlimited approval, arbitrary spender, swap, bridge, or buyer transfer behavior.

## Decisions

### 1. Keep Deposit state tied to the selected Asset draft

The amount defaults to `100` for dAAPL and is represented as controlled local input state. `MAX` sets the available illustrative balance; it does not read or mutate a wallet. If the selected asset changes, the displayed token and draft backing update consistently.

### 2. Reuse `AmountInput`

Use `AmountInput` from `@/components/ui/input` with `currency={selectedAsset.id}`, `simulatedUsd="$10,000"`, and `balanceText="Available for new deposit: 100 dAAPL"` for the supplied dAAPL fixture. The control remains presentation/draft data until a validated balance adapter is connected.

### 3. Make approval and deposit states explicit

The checklist shows:

- `Approve dAAPL — Confirmed · exact allowance 100 dAAPL` as a demo fixture state.
- `Deposit to vault — In-wallet · confirm deposit of 100 dAAPL` as awaiting the user's wallet.

The UI must also state `Deposit is not confirmed` and that the wallet still has the amount available. `Open wallet` is an accent action boundary only; it must not silently sign, approve, or send a transaction in this change.

### 4. Preserve the vault/principal boundary

The notice must say deposited tokens are locked as backing for this listing and that this is not a transfer of principal to a buyer. The preview keeps payout in the selected token and principal with Alice.

### 5. Keep progression local and safe

Continue moves from Deposit to Terms only as a draft state transition. A future live flow must revalidate wallet, chain, registration, decimals, balance, allowance, amount, and terms before preparing the canonical primary listing action.

## Risks / Trade-offs

- A “Confirmed” approval row can look like real chain evidence; label the entire screen/values as demo or draft and keep deposit explicitly unconfirmed.
- Static amount and balance values can become stale; do not use them as transaction authorization.
- A future wallet integration may need separate approval and deposit intents; this change deliberately does not collapse them into one implicit action.
