## Context

The global shell and Marketplace card surface are implemented. The supplied reference image defines a desktop Listing Detail composition with the global sidebar, a `Listing Detail` top bar, a two-column content region, and a compact dark visual hierarchy. The product contracts define listing identity and terms through the canonical read API, while purchase preparation is a separate explicit wallet flow.

## Goals / Non-Goals

**Goals:**
- Provide a stable dynamic route for every Marketplace card listing ID.
- Explain the selected listing's asset, backing, sold income share, period, payout form, fixed price, deadline, and illustrative income outcomes.
- Keep Marketplace active in the sidebar and provide a clickable breadcrumb back to `/marketplace`.
- Preserve explicit “simulated”, “illustrative”, and “no promised returns” boundaries wherever fixture data is displayed.
- Keep the buy sidebar structurally ready for a future `BUY_LISTING` intent without signing, sending, or fabricating a transaction in this change.
- Preserve responsive behavior: the sidebar action card may move below the detail content on narrow widths without horizontal overflow.

**Non-Goals:**
- Implementing a new listing API, changing `schemas/api.schema.json`, or creating a parallel detail DTO.
- Executing a purchase, requesting wallet approval, estimating a live network fee, or claiming that a click completed a transaction.
- Implementing token swaps, bridges, auto-conversion, guaranteed income, or real backing proof.
- Replacing the existing global navigation shell or redesigning unrelated Marketplace controls.

## Decisions

### 1. Use `/marketplace/[id]` as the canonical route

The route parameter is the listing identifier used by the Marketplace card, for example `L-0142`. The page must use the parameter for detail lookup and must not silently render a different listing when the identifier is missing or invalid. A not-found/unavailable state is explicit.

### 2. Reuse canonical API and domain contracts

The eventual data adapter uses:

- `GET /api/v1/chains/{chainId}/markets/{marketAddress}/listings/{listingId}`
- `schemas/api.schema.json#/$defs/ListingResponse`
- `schemas/domain.schema.json#/$defs/ListingDetail`

The page consumes nested `listing`, `position`, and `asset` data. Atomic quantities, prices, IDs, timestamps, and integer values remain strings until a display formatter applies the manifest token decimals. The detail adapter preserves snapshot/finality and typed error information.

### 3. Keep the first detail screen presentation-safe

The initial implementation may use a validated fixture for `L-0142` and deterministic fallback detail fixtures for the existing card IDs, but it must label those values as simulated/illustrative. Unknown IDs render an explicit unavailable/not-found state rather than copying `L-0142` data.

### 4. Make the card CTA a navigation link

`View offer` uses Next.js `Link` with the listing ID, keeps an accessible link name, and does not use `router.push` or a transaction side effect. The Marketplace screen remains responsible for listing discovery; the detail screen owns explanation and future purchase preparation.

### 5. Separate explanation from purchase action

The right-hand “Buy this offer” card presents fixed price, estimated income, network fee copy, payment tabs, balance copy, and two buttons according to the supplied design. Until a transaction-intent implementation is explicitly wired, these controls are clearly non-executing presentation controls or disabled/annotated actions. Any future purchase must use `POST /api/v1/transaction-intents` with `BUY_LISTING`, then require an explicit wallet action.

### 6. Treat calculation examples as illustrative

The 50/50 split, transferability, claim execution, timeline, and `$200/$100/$0` scenario table explain the selected listing's terms. They are not an oracle for future income, do not promise returns, and must retain the product disclosure that sellers keep principal and claims require a separate action.

## Risks / Trade-offs

- Fixture-backed details can look live; source/snapshot labels and unavailable states must remain visible until the read adapter is integrated.
- A fixed-width 380px action card matches the desktop reference but must become a normal responsive grid column below the desktop breakpoint.
- A copy button and explorer icon are useful affordances, but the explorer URL must come from an allowlisted chain manifest; no arbitrary address URL may be built from user input.
- The requested network fee is only illustrative until a supported transaction preparation path supplies a current estimate.
