## Context

The reference Terms screen presents a confirmed deposit draft followed by controls for income share, fixed price, and duration. The product model treats these values as listing terms: income is split only during the purchased period, the principal remains with the seller, and primary duration starts when a buyer purchases.

Existing UI primitives include `Slider`, `SegmentedControl`, and `TextInput`. The Sell flow currently owns local asset, deposit amount, and step state, so Terms can update the draft without creating a second form state or API DTO.

## Goals / Non-Goals

**Goals:**
- Highlight Asset, Deposit, and Terms progress tracks while keeping Review and Confirm inactive.
- Render deposit-confirmed draft status for 100 dAAPL and the zero-available-balance message.
- Bind income share, price, and duration controls to local draft state.
- Show buyer share, seller share, period semantics, and illustrative income estimate with source/timestamp copy.
- Synchronize the right preview with every selected term.
- Advance locally to Review without wallet or chain side effects.

**Non-Goals:**
- Publishing a listing, changing vault backing, approving tokens, or sending a transaction.
- Calculating guaranteed yield, APY, or live issuer income.
- Adding a new duration/share schema or changing canonical integer/string representations.
- Implementing review/confirm transaction preparation in this change.

## Decisions

### 1. Keep terms in the existing Sell draft state

The flow stores `incomeShare` as a bounded percentage value, `price` as a display/input string, and `duration` as one of `1m`, `3m`, `6m`, or `12m`. Defaults are 50, `90 DemoUSD`, and `6m`. Preview values are derived from this state rather than duplicated constants.

### 2. Reuse existing controls

Use `Slider` for the 10–100% income-share range, `TextInput` for `Price · DemoUSD`, and `SegmentedControl` for duration choices. All controls retain accessible labels and keyboard interaction provided by the shared primitives.

### 3. Preserve explicit financial boundaries

The income estimate remains `about 1.00 dAAPL` with `Illustrative only · not guaranteed; may be zero`, `Source: Simulated issuer feed`, and the supplied update timestamp. The screen must not describe the estimate as expected return or use it to authorize a transaction.

### 4. Map future live terms to canonical fields

When confirmation is implemented, the draft maps to `incomeBps`, `durationSeconds`, and `priceAtomic` within `CREATE_PRIMARY_LISTING`; asset, deposit amount, minimum shares, and expiry remain separately validated. The current UI does not construct or submit this request.

### 5. Keep deposit status as a presentation boundary

The Terms screen may show `Deposit confirmed · locked for this draft` as the requested fixture state, while implementation remains draft-only unless a verified receipt/read adapter supplies that status. No new vault mutation occurs from changing terms.

## Risks / Trade-offs

- Percentage and duration controls can look economically authoritative; labels and draft status must remain visible.
- A text price field may contain symbols such as `DemoUSD`; future submission must normalize and validate atomic units rather than parsing UI text as accounting numbers.
- The estimate is intentionally static/illustrative until a validated issuer observation adapter is connected.
