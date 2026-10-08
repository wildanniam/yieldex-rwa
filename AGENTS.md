# RWA-ETHJKT — Aturan Agen dan Tim

## Scope dan urutan baca

Read README.md, CONTRIBUTING.md, docs/development.md, docs/spec/decisions.md, active proposal/design/tasks, then related capability specs and schemas before changing anything. Baseline change: `build-rwa-income-rights`. User approved the monorepo starter. Web/worker shells and interface tooling exist; economic contracts/product flows remain unimplemented. No remote/push/deployment authorization is inferred.

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

Repository: https://github.com/wildanniam/eth-jkt (private). Team workflow is deliberately lightweight: branch → implementation → tests → push branch → PR → human review. GitHub issues are optional for teammates, including when they use AI; OpenSpec task coordination does not require a duplicate issue. Do not publish/push/merge beyond applicable user authorization. Initial direct-main push was only a bootstrap exception.

[CONTRIBUTING.md](CONTRIBUTING.md) is the canonical team workflow for manual coding and AI-assisted work. Collaborators push their own task branch to the same origin repository and open a PR to main; no fork required. Names such as `feat/create-listing`, `fix/claim-button` or `docs/setup-guide` need no issue number. One PR can contain related commits; no new issue/PR for each review revision. Do not push directly to main, force-push a shared branch, or overwrite another contributor's work.

Before push, run `pnpm check` and relevant feature tests and review the diff. The shared PR template only needs the change, actual test results and relevant unfinished/untested work. Teammates need no mandatory risk table or manual commit-hash report for every PR. A green foundation suite alone does not prove product behavior. Keep incomplete acceptance gates in a draft PR. Review/CI and financial/security acceptance still apply. Repository settings/hooks are not changed merely by writing this policy.

Keep task scope and acceptance tied to the active OpenSpec change. Tests and evidence must describe actual behavior and limits; a concise PR report is sufficient unless the affected product acceptance requires more detail.

### Additional workflow only for Codex acting for Wildan

Wildan retains his personal issue-driven workflow: standard/high-risk work needs an issue (reuse an existing one where appropriate), a non-main branch, a risk-based verification plan, actual scenario evidence and PR. Record the tested revision and passed/failed/blocked/not-tested results. Tiny typo/copy changes may skip an issue. Never merge without Wildan's explicit approval for the PR. These extra process/reporting requirements apply only to Codex working on Wildan's behalf, not to teammates or their AI sessions. Do not enforce the personal workflow as a team contribution requirement.

Never check off implementation tasks merely because a spec/fixture exists. Keep `openspec/specs/` empty until implementation is verified and change legitimately archived. No routine global dependency upgrades. Pin the local OpenSpec CLI used for validation (currently 1.3.1).

Before parallel work, claim a task/module and its shared interfaces; assignees decided at team meet. Don't overwrite teammates' edits. Keep one interface revision for all modules; fixture-based work is explicitly provisional until integration passes.

## Verification

Run `openspec validate build-rwa-income-rights --strict --no-interactive`, `python3 scripts/check_specs.py` (jsonschema required) and `python3 scripts/export_context.py` for spec changes. Review the semantic matrix in docs/spec/verification.md; syntactic validation is not proof of economic correctness. Export is generated, never hand edit docs/TEAM-CONTEXT.md.

Use Node 24.18.0 and pinned pnpm 11.3.0 (`.nvmrc`, packageManager). Run `pnpm check` from root. `pnpm generate` owns shared types/schema registry/ABI, interface Solidity and team context; `pnpm generate:check` detects drift. Forge/Anvil are local npm binaries. Do not introduce a second schema/type/ABI or put secrets/server imports in shared. Contract ABIs are INTERFACE_ONLY until a verified implementation/deployment exists. Private env examples are optional for starter boot; absent external integrations must stay visibly unimplemented.

For meaningful implementation, validate normal, boundary, concurrency, failure/recovery and persisted outcomes as relevant to the feature; UI changes need real UI/requests/console checks. Preserve mock/fork/live/mainnet distinctions. For contract/finality risks, stronger Foundry fuzz/invariant/fork tests remain required by product acceptance. Codex acting for Wildan additionally records the detailed scenario matrix and tested revision under the personal workflow above.

Never commit personal chat exports, local machine paths, credentials, build output or browser QA artifacts. Keep accepted/proposed/verified/history distinctions in team documentation.
