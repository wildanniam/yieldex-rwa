## Why

The Figma portfolio dashboard has no product-facing implementation. The existing lab is for functional testing. Add a responsive slice teammates can integrate without inventing live balances or changing auth and transaction logic.

## What Changes

- Add /dashboard with a reusable application shell, metrics, positions/listings/vault tabs, claims, activity and assistant entry.
- Follow Figma 60:18962 and 60:18558 with existing Button/Icon/tokens, and reuse local source assets.
- Explicit example, empty, loading and error presentation states. Preview controls do not represent a wallet session.
- Keep root landing and lab behavior intact. Financial actions explain the preview boundary and link to the existing lab.

## Impact

UI-only, no schema, ABI, auth, database or transaction changes. Baseline 5.1–5.6 remain incomplete until real wallet and API integration passes.
