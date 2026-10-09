# Hosted core rollout

Scope: issue #3, Sepolia simulation + hosted Supabase + Vercel + isolated Hostinger indexer. Deployment is authorized; merge is separate. UI Afer/chatbot Rafi retain their own workstreams. No mainnet backing or production financial safety claim.

## Configuration

- Web: normal `.env.example` fields; `DATABASE_SSL_CA` contains the official Supabase root PEM. Missing CA for remote databases fails closed. Local loopback PostgreSQL still supports the isolated test suite.
- Web `DEPLOYMENT_MANIFEST_JSON`: public validated manifest, used in preference to local `DEPLOYMENT_MANIFEST`. Keep one identical manifest for web and worker.
- Worker: session pooler connection, TLS CA, Sepolia RPC, release-local manifest. Indexer has no signing key. Reviewed finalization is a separate explicit command with finalizer role; never enable autonomous dividend classification.
- Deployer/admin and dedicated finalizer keys remain in ignored local configuration. Demo Alice/Bob/Carol keys are generated once in `.local/sepolia/actors.json`, mode 0600, never committed or placed in Vercel.

## Deployment and recovery

Build with the pinned toolchain and pass `pnpm check`, then commit runtime/source changes before broadcasting. Unrelated research-note formatting is excluded from the deployment dirty check and never treated as deployed code. Load the local web env and separate signer env into the process, then run `node --import tsx scripts/deployment/sepolia.mts` for preflight and add `--broadcast` to deploy. Requires observed chain 11155111, distinct valid signers and sufficient balance. The deployment spend cap is 0.03 Sepolia ETH including 3 × 0.003 demo-account gas transfers; this is a hard cap, not a fee promise. Every transaction is estimated before signing.

The private journal stores signed bytes/hash before broadcasting. On interruption, rerun the exact source revision and configuration; it reconciles/rebroadcasts the same bytes instead of minting or deploying twice. Never delete the journal, reset nonce or copy a rehearsal journal onto a live run. Public evidence omits signed bytes and keys. A separate ignored output directory can be specified with SEPOLIA_DEPLOYMENT_DIR for an isolated Anvil rehearsal (chain ID 11155111); such evidence is simulation, not testnet proof.

Migrations run in timestamp order after checking the target project and existing state. Use the session pooler and TLS verify-full/official CA for CLI migrations; dry-run first. No reset/drop/down migration. Review any existing unknown schema before proceeding. Subsequent app rollback keeps additive migration007 and existing rows.

Vercel uses apps/web as root with workspace packages available. Secrets are supplied to the project via environment variables, never CLI literal arguments or source. Hostinger gets a dedicated release and service; unrelated services and firewall remain untouched. Rollback points the service at the previous tested release and redeploys the prior Vercel revision; non-upgradeable contracts retain their original addresses/state.

## Verification gates

- Local config TLS guards, generation/spec parity, tests/lint/types/build and isolated deployment rehearsal.
- Hosted schema history/RLS, native two-wallet auth, API contracts and denied cross-user access.
- Sepolia receipts, verified source/code/roles, full lifecycle with real wall-clock time and finalized blocks. No Anvil mining or time travel in testnet scripts.
- Indexer finalized cursor, replay/restart and unavailable-RPC recovery. Reviewed metadata must preserve the approved trust boundary.
- Real web `/lab` loading/refresh, requests/console, wallet/auth and available lifecycle. Final designed UI/chatbot acceptance remains open.

This runbook describes the operational plan. Actual addresses, URLs, tested revisions and PASS/FAIL/BLOCKED results are appended only after execution. Tasks 7.3/7.8 are not complete merely because scripts exist.

## Live checkpoint — 9 October 2026

The deployment source is `f82cb0d9ef26141a39bdf187f1e02f5d7451f0fc`, on issue [#3](https://github.com/wildanniam/yieldex-rwa/issues/3). Public addresses and deployment block are in [the Sepolia manifest](../deployments/sepolia.json). Deploy/seed submitted 23 successful transactions. The deployer spent `9074536138363962` wei including `0.009` Sepolia ETH transferred to three dedicated demo wallets. This excludes subsequent lifecycle-test gas.

All seven deployed contracts have Sourcify creation and runtime matches. [Market source](https://repo.sourcify.dev/11155111/0x25e2288d8fa689a1d9895a31b26130153f2dc76f); use the same chain/address URL pattern for the other manifest contracts. Sourcify's additional Etherscan/Blockscout submissions hit provider quotas; do not describe them as Etherscan verified. See the [official verification API](https://docs.sourcify.dev/docs/api/) for source-only submission and lookup.

| Scenario                                | Result                   | Scope                                                                                                                                               |
| --------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local full check at deployment revision | PASS                     | 111 Vitest, 46 Foundry, lint/types/spec/generated artifacts/build                                                                                   |
| Deployment rehearsal and resume         | PASS, simulation         | Separate Anvil chain; second run retains nonce 23, no duplicate transactions                                                                        |
| Seven Sepolia contracts and demo seed   | PASS, live               | Actual receipts/code; distinct admin/finalizer permissions; unprivileged actor has neither role                                                     |
| Supabase migrations and RLS             | PASS, hosted             | Seven migrations, 22 application tables with RLS; official CA verification and server SSL enforcement enabled                                       |
| Native hosted auth/RLS                  | PASS, hosted             | Two wallets; one-use/racing challenge; invalid signature/origin/browser/expiry; provider replay and foreign-chain denial; revocation                |
| Vercel build and `/lab` response        | PASS, hosted             | [Staging lab](https://yieldex-rwa.vercel.app/lab), functional harness; final UI/chatbot not integrated                                              |
| Hosted HTTP session/history/intent flow | PASS, hosted             | Real HTTPS cookies; login/replay/origin denial, private conversation lifecycle, tombstones, blocked intent preview/idempotency, logout              |
| Hostinger worker                        | PASS, hosted             | Pinned Node 24.18.0, isolated image; service running and actual finalized blocks indexed after entrypoint/permissions/RPC-range fixes               |
| Sepolia complete lifecycle              | PASS, finalized + hosted | 23 successful receipts; exact balances, two dividends/resale/split/expiry/release/claims; canonical finalized receipts and persisted terminal state |
| Final product UI/AI acceptance          | NOT TESTED               | Tasks 7.4–7.6 depend on Afer/Rafi integration                                                                                                       |

`/api/health` is process liveness, not integration readiness. Its new `CORE_BASELINE` / `NOT_PROBED` labels avoid claiming unimplemented integrations or successful readiness. Use actual API responses, finalized indexer progress and scenario checks for readiness.

### Worker operation

Build `infra/worker/Dockerfile` from the repository root. Its build context excludes secrets and generated outputs. Runtime uses a dedicated container with no published ports and no signing keys. Provide `DATABASE_URL` (session pooler), `MARKETPLACE_RPC_URL`, `DEPLOYMENT_MANIFEST` and `DATABASE_SSL_CA_FILE`; mount the identical public manifest and official public CA read-only. The entrypoint loads the PEM into `DATABASE_SSL_CA` before starting the indexer. The env file must be mode 0600 outside the release. Run non-root, read-only root filesystem, dropped capabilities, memory/CPU/log limits and `unless-stopped` restart policy. Use graceful stop/restart; cursor and unique chain-event keys live in Supabase.

Do not copy local Supabase auth configuration onto the hosted project. In the installed CLI, `config push --workdir` ignored the requested directory; running from the dedicated staging config directory applied the intended origin. A later Storage-config read error did not roll back the successful auth update. Verify the actual login and SSL enforcement afterward. Only the exact staging domain is allowed, and unrelated auth/API defaults were restored.

Hosted provider correction: the configured RPC rejected a 22-block eth_getLogs range and accepted 10. The worker entrypoint now uses 10-block batches; persisted cursor/finality rules are unchanged. Public mounted manifest and CA must be mode 0644 for the non-root container; only the private env file remains 0600. The first image also required changing cwd to apps/worker so production-only dependencies resolve correctly. Both failures were observed before claiming service readiness.

Additional live checks: four deployed unauthorized operations reverted with Unauthorized via eth_call (outsider metadata, admin finalization, outsider principal withdrawal, finalizer resume). Official-token fork regression passed 4 tests again. Hosted quote request returned AVAILABLE for Ethereum/Arbitrum/Base; one bounded read-only comparison does not establish sustained quote-only provider entitlement.

### Runtime and recovery checkpoint

Contract source remains `f82cb0d9ef26141a39bdf187f1e02f5d7451f0fc`. The web and worker runtime tested and deployed is `f73935c23158de865e088fad49ab7b56c94f3198`; the later changes do not modify contract source. Vercel deployment `dpl_5TioLRUPci3qAyCBXiGr7YRFF8dh` is READY and owns the staging alias. Automatic Git deployments run for `main` only; branch preview builds are deliberately skipped. A manual authorized production deployment was used for this unmerged rollout branch. Merge the reviewed rollout PR before relying on later automatic `main` deployments: deploying an older `main` revision would omit the hosted TLS/manifest changes. Do not treat the live alias as proof that this branch has already merged.

Worker image `yieldex-indexer:f73935c` has digest `sha256:bd9205ff8ca471e28ff355385bafa4df2761b53bab431fd4d8657f9675b7ae36`. A comparison of all 29 runtime source/package files between checkout and container matched. Full `pnpm check` passed again on this runtime revision (111 Vitest, 46 Foundry, lint/types/spec/generation/build); [GitHub CI](https://github.com/wildanniam/yieldex-rwa/actions/runs/37884905507) also passed. The four official-token fork tests passed separately. The old release-directory name is not the source revision. A graceful container restart preserved the exact cursor, finalized block/hash, unique logs and indexed positions. A controlled unavailable-RPC probe also preserved the database cursor; this is fault injection, not evidence of a natural provider outage.

| Additional scenario              | Result                                        | Evidence boundary                                                                                                                                             |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker restart                   | PASS, hosted                                  | Identical persisted cursor at next block 11874930, finalized block 11874929 and hash; 13 logs, 13 unique, 3 assets, 1 active position                         |
| Unavailable RPC                  | PASS, controlled                              | Real hosted database cursor unchanged when using an intentionally unavailable local RPC endpoint                                                              |
| Live read API                    | PASS, hosted                                  | Five canonical response schemas and finalized snapshots; invalid query rejected with HTTP 400                                                                 |
| Browser login, reload and logout | PASS, hosted with controlled wallet transport | Actual HTTPS auth/session, persisted portfolio and browser requests; signer stayed in local bridge, no MetaMask extension claim                               |
| Browser transaction rejection    | PASS, controlled wallet rejection             | AAPL listing preview produced the correct allowance intent; wallet rejected send with code 4001, controls recovered; Alice nonce and AAPL allowance unchanged |
| Late settlement without coverage | PASS, deployed eth_call                       | Expired position still rejected with `FinalityCoverageRequired`; no transaction broadcast                                                                     |

The functional browser test does not prove a successful browser transaction broadcast or final Afer/Rafi integration. Sepolia economic transactions are exercised by the separate signed lifecycle harness. Keep task 7.4 open until the complete integrated wallet journey is tested.

### Operator handoff

- Read-only public state is available at the staging `/lab` and canonical `/api/v1` routes. `/api/health` only establishes process liveness.
- Check the indexer with `docker inspect --format '{{json .State}}' yieldex-indexer` and bounded `docker logs --tail 50 yieldex-indexer` on the worker host. Do not print its environment. Use `docker restart yieldex-indexer` for the tested graceful restart path; the database retains its checkpoint.
- The worker indexes finalized blocks. It does not sign transactions or classify dividend data automatically. Admin/finalizer actions still require the dedicated locally held keys and reviewed source workflow.
- Sepolia finality can add many minutes to the demonstration. Prepare already-matured demonstration positions beforehand; do not replace finalized coverage with a wall-clock timer or an invented block.
- Changing UI or chatbot code does not require redeploying unchanged contracts or resetting the database. Keep the manifest addresses, canonical DTOs and existing persisted state when integrating teammates' work.

### Completed and finalized onchain scenario

Position 1 used 100 demoSPY shares, 50% income rights, a 90 DemoUSD primary purchase and a 50 DemoUSD whole-right resale. The 30-minute term stayed unchanged after resale. Multipliers progressed from 1 to 1.02 to 1.0404 for two simulated dividends, then to 2.0808 for a split. All 23 lifecycle transactions succeeded; the final receipt is at block `11875166`.

The coverage source was actual finalized block `11875089` (`0x6d52e70d4a3ae37d7e18d59d651d02f890be91256124dcb375738231cf53bd84`, timestamp `1791521748`), later than endAt `1791521436`. The finalizer attested through the position end only after observing this source. Settlement, principal release and all three claims succeeded. The contract reported `RELEASED`, zero claim balances and an empty demoSPY vault; a second claim reverted.

Independent expected balances matched actual state at terminal receipt block `11875166`. These are shares in atomic units (18 decimals), not displayed token amounts after the split. DemoUSD has 6 decimals.

| Actor | DemoUSD balance | Final demoSPY shares atomic |
| ----- | --------------- | --------------------------- |
| Alice | 1090            | `998058439061899269512`     |
| Bob   | 960             | `980392156862745098`        |
| Carol | 950             | `961168781237985390`        |

Total payment tokens remain 3000 DemoUSD; total actor shares remain `1000000000000000000000` (1000 shares). Principal release preserved the income reserve before claims drained it. No mint was used during the lifecycle to repair balances.

Selected actual transactions: [settlement](https://sepolia.etherscan.io/tx/0xb8faf75033395a222466c6870db7fcf7f688ecc48e338811e8426bf4245a2949), [principal release](https://sepolia.etherscan.io/tx/0x240089b4cdfa43c4914cd2bbd6744bbf0f26cb912293897b00cd6e480e6b8f3f), [last income claim](https://sepolia.etherscan.io/tx/0xb1a440f16a8cf8b54636c59667f45207902ef18ed743f12792cdfd0565a55985). Transaction explorer links do not imply Etherscan source verification; source matches were verified through Sourcify.

### Final persisted acceptance — PASS

At `2026-10-09T05:29:18.025Z`, all 23 lifecycle receipts were successful and matched canonical block hashes. Terminal transaction block `11875166` was finalized. The hosted API returned snapshot `11875185`, hash `0x22c2de2f02686d5976835b03302634e2fafe29df6daf270a8388094e32d06a1d`, with `FINALIZED` and `HEALTHY` status.

Supabase and the actual Vercel positions endpoint agreed on `RELEASED` and zero principal shares. Four income allocations totaled `3883121876201460976` shares; all remaining claims were zero. All 34 indexed logs were unique. The independent actor balances above were checked again against the now-finalized terminal block; payment/share conservation passed. Worker remained running with zero automatic restarts and no OOM event.

**Task 7.8 / G7a PASS.** This closes the hosted core lifecycle gate. Tasks 7.4–7.6 remain open for the complete designed UI/chatbot journey, final integrated review and demo acceptance. Source/runtime revisions above are the tested application revisions; later documentation-only commits do not change deployed runtime. The rollout PR requires human review and separate merge approval.
