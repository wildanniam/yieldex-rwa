# RWA-ETHJKT — Aturan Agen dan Tim

## Scope dan urutan baca

Read README.md, docs/development.md, docs/spec/decisions.md, active proposal/design/tasks, then related capability specs and schemas before changing anything. Baseline change: `build-rwa-income-rights`. User approved the monorepo starter. Web/worker shells and interface tooling exist; economic contracts/product flows remain unimplemented. No remote/push/deployment authorization is inferred.

Default prose Indonesian. Data identifiers and technical schemas English. Visual design belongs to human UI/UX designer; spec owns data, states, user actions and accessibility semantics, not colors/layout taste.

## Consistency

- Never invent alternate field names/enums/ABI in one module. Reuse shared schemas/generated artifacts.
- JSON money and large integer IDs use strings; no JS float for financial accounting. Define chain, token, decimals and units explicitly.
- Chain is authoritative for rights, funds and claims. Supabase is an index/cache/chat store.
- Update spec/interface/examples and relevant tests before implementing a changed contract. If related documents conflict, reconcile, do not silently choose one.
- No NFT, partial secondary transfer, direct gift, auto-swap/bridge, model-controlled keys/calldata, assumed real backing for mock tokens, or guaranteed yield.
- Metadata finalizer trust is approved for hackathon with constrained role; no arbitrary recipient, balance setter, backing sweep, retroactive rewrite or guaranteed source SLA.
- Quote provider/runtime compatibility and token adapter require tests; don't report docs/source proof as runtime proof.

## Workflow

Repository: https://github.com/wildanniam/eth-jkt (private). Wildan explicitly authorized a clean initial push directly to main on 8 October 2026; issue/PR is skipped only for that bootstrap. Subsequent meaningful implementation needs an issue, non-main branch, risk matrix, verification and PR. Do not publish/push/merge beyond applicable user authorization.

Keep task scope, acceptance and verification evidence in the active OpenSpec change and linked reports. Tests and audit evidence must describe actual behavior and limits.

Never check off implementation tasks merely because a spec/fixture exists. Keep `openspec/specs/` empty until implementation is verified and change legitimately archived. No routine global dependency upgrades. Pin the local OpenSpec CLI used for validation (currently 1.3.1).

Before parallel work, claim a task/module and its shared interfaces; assignees decided at team meet. Don't overwrite teammates' edits. Keep one interface revision for all modules; fixture-based work is explicitly provisional until integration passes.

## Verification

Run `openspec validate build-rwa-income-rights --strict --no-interactive`, `python3 scripts/check_specs.py` (jsonschema required) and `python3 scripts/export_context.py` for spec changes. Review the semantic matrix in docs/spec/verification.md; syntactic validation is not proof of economic correctness. Export is generated, never hand edit docs/TEAM-CONTEXT.md.

Use Node 24.18.0 and pinned pnpm 11.3.0 (`.nvmrc`, packageManager). Run `pnpm check` from root. `pnpm generate` owns shared types/schema registry/ABI, interface Solidity and team context; `pnpm generate:check` detects drift. Forge/Anvil are local npm binaries. Do not introduce a second schema/type/ABI or put secrets/server imports in shared. Contract ABIs are INTERFACE_ONLY until a verified implementation/deployment exists. Private env examples are optional for starter boot; absent external integrations must stay visibly unimplemented.

Meaningful implementation must exercise normal, boundary, concurrency, failure/recovery, real UI/requests/console and persisted chain outcomes as relevant. Report passed/failed/blocked/not-tested and tested revision. Preserve mock/fork/live/mainnet distinctions. For contract/finality risks, stronger Foundry fuzz/invariant/fork tests required; no auto-merge.

Never commit personal chat exports, local machine paths, credentials, build output or browser QA artifacts. Keep accepted/proposed/verified/history distinctions in team documentation.
