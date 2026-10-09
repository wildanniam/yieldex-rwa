# Hosted core rollout

Scope: issue #3, Sepolia simulation + hosted Supabase + Vercel + isolated Hostinger indexer. Deployment is authorized; merge is separate. UI Afer/chatbot Rafi retain their own workstreams. No mainnet backing or production financial safety claim.

## Configuration

- Web: normal `.env.example` fields; `DATABASE_SSL_CA` contains the official Supabase root PEM. Missing CA for remote databases fails closed. Local loopback PostgreSQL still supports the isolated test suite.
- Web `DEPLOYMENT_MANIFEST_JSON`: public validated manifest, used in preference to local `DEPLOYMENT_MANIFEST`. Keep one identical manifest for web and worker.
- Worker: session pooler connection, TLS CA, Sepolia RPC, release-local manifest. Indexer has no signing key. Reviewed finalization is a separate explicit command with finalizer role; never enable autonomous dividend classification.
- Deployer/admin and dedicated finalizer keys remain in ignored local configuration. Demo Alice/Bob/Carol keys are generated once in `.local/sepolia/actors.json`, mode0600, never committed or placed in Vercel.

## Deployment and recovery

Build with the pinned toolchain and pass `pnpm check`, then commit runtime/source changes before broadcasting. Unrelated research-note formatting is excluded from the deployment dirty check and never treated as deployed code. Load the local web env and separate signer env into the process, then run `node --import tsx scripts/deployment/sepolia.mts` for preflight and add `--broadcast` to deploy. Requires observed chain11155111, distinct valid signers and sufficient balance. The deployment spend cap is0.03SepoliaETH including3x0.003demo-account gas transfers; this is a hard cap, not a fee promise. Every transaction is estimated before signing.

The private journal stores signed bytes/hash before broadcasting. On interruption, rerun the exact source revision and configuration; it reconciles/rebroadcasts the same bytes instead of minting or deploying twice. Never delete the journal, reset nonce or copy a rehearsal journal onto a live run. Public evidence omits signed bytes and keys. A separate ignored output directory can be specified with SEPOLIA_DEPLOYMENT_DIR for an isolated Anvil rehearsal (chain ID11155111); such evidence is simulation, not testnet proof.

Migrations run in timestamp order after checking the target project and existing state. Use the session pooler and TLS verify-full/official CA for CLI migrations; dry-run first. No reset/drop/down migration. Review any existing unknown schema before proceeding. Subsequent app rollback keeps additive migration007 and existing rows.

Vercel uses apps/web as root with workspace packages available. Secrets are supplied to the project via environment variables, never CLI literal arguments or source. Hostinger gets a dedicated release and service; unrelated services and firewall remain untouched. Rollback points the service at the previous tested release and redeploys the prior Vercel revision; non-upgradeable contracts retain their original addresses/state.

## Verification gates

- Local config TLS guards, generation/spec parity, tests/lint/types/build and isolated deployment rehearsal.
- Hosted schema history/RLS, native two-wallet auth, API contracts and denied cross-user access.
- Sepolia receipts, verified source/code/roles, full lifecycle with real wall-clock time and finalized blocks. No Anvil mining or time travel in testnet scripts.
- Indexer finalized cursor, replay/restart and unavailable-RPC recovery. Reviewed metadata must preserve the approved trust boundary.
- Real web `/lab` loading/refresh, requests/console, wallet/auth and available lifecycle. Final designed UI/chatbot acceptance remains open.

This runbook describes the operational plan. Actual addresses, URLs, tested revisions and PASS/FAIL/BLOCKED results are appended only after execution. Task7.3/7.8 are not complete merely because scripts exist.

## Live checkpoint — 9 October 2026

The deployment source is `f82cb0d9ef26141a39bdf187f1e02f5d7451f0fc`, on issue [#3](https://github.com/wildanniam/yieldex-rwa/issues/3). Public addresses and deployment block are in [the Sepolia manifest](../deployments/sepolia.json). Deploy/seed submitted 23 successful transactions. The deployer spent `9074536138363962` wei including `0.009` Sepolia ETH transferred to three dedicated demo wallets. This excludes subsequent lifecycle-test gas.

All seven deployed contracts have Sourcify creation and runtime matches. [Market source](https://repo.sourcify.dev/11155111/0x25e2288d8fa689a1d9895a31b26130153f2dc76f); use the same chain/address URL pattern for the other manifest contracts. Sourcify's additional Etherscan/Blockscout submissions hit provider quotas; do not describe them as Etherscan verified. See the [official verification API](https://docs.sourcify.dev/docs/api/) for source-only submission and lookup.

| Scenario                                | Result           | Scope                                                                                                                                  |
| --------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Local full check at deployment revision | PASS             | 111 Vitest, 46 Foundry, lint/types/spec/generated artifacts/build                                                                      |
| Deployment rehearsal and resume         | PASS, simulation | Separate Anvil chain; second run retains nonce23, no duplicate transactions                                                            |
| Seven Sepolia contracts and demo seed   | PASS, live       | Actual receipts/code; distinct admin/finalizer permissions; unprivileged actor has neither role                                        |
| Supabase migrations and RLS             | PASS, hosted     | Seven migrations, 22 application tables with RLS; official CA verification and server SSL enforcement enabled                          |
| Native hosted auth/RLS                  | PASS, hosted     | Two wallets; one-use/racing challenge; invalid signature/origin/browser/expiry; provider replay and foreign-chain denial; revocation   |
| Vercel build and `/lab` response        | PASS, hosted     | [Staging lab](https://yieldex-rwa.vercel.app/lab), functional harness; final UI/chatbot not integrated                                 |
| Hosted HTTP session/history/intent flow | PASS, hosted     | Real HTTPS cookies; login/replay/origin denial, private conversation lifecycle, tombstones, blocked intent preview/idempotency, logout |
| Hostinger image                         | PASS, build      | Pinned Node24.18.0, isolated image; service running and actual finalized blocks indexed after entrypoint/permissions/RPC-range fixes   |
| Sepolia complete lifecycle              | IN PROGRESS      | Primary listing/buy mined; awaits real finalized dividend source; task7.8 stays open                                                   |
| Final product UI/AI acceptance          | NOT TESTED       | Tasks7.4–7.6 depend on Afer/Rafi integration                                                                                           |

`/api/health` is process liveness, not integration readiness. Its new `CORE_BASELINE` / `NOT_PROBED` labels avoid claiming unimplemented integrations or successful readiness. Use actual API responses, finalized indexer progress and scenario checks for readiness.

### Worker operation

Build `infra/worker/Dockerfile` from the repository root. Its build context excludes secrets and generated outputs. Runtime uses a dedicated container with no published ports and no signing keys. Provide `DATABASE_URL` (session pooler), `MARKETPLACE_RPC_URL`, `DEPLOYMENT_MANIFEST` and `DATABASE_SSL_CA_FILE`; mount the identical public manifest and official public CA read-only. The entrypoint loads the PEM into `DATABASE_SSL_CA` before starting the indexer. The env file must be mode0600 outside the release. Run non-root, read-only root filesystem, dropped capabilities, memory/CPU/log limits and `unless-stopped` restart policy. Use graceful stop/restart; cursor and unique chain-event keys live in Supabase.

Do not copy local Supabase auth configuration onto the hosted project. In the installed CLI, `config push --workdir` ignored the requested directory; running from the dedicated staging config directory applied the intended origin. A later Storage-config read error did not roll back the successful auth update. Verify the actual login and SSL enforcement afterward. Only the exact staging domain is allowed, and unrelated auth/API defaults were restored.

Hosted provider correction: the configured RPC rejected a22-block eth_getLogs range and accepted10. The worker entrypoint now uses10-block batches; persisted cursor/finality rules are unchanged. Public mounted manifest and CA must be mode0644 for the non-root container; only the private env file remains0600. The first image also required changing cwd to apps/worker so production-only dependencies resolve correctly. Both failures were observed before claiming service readiness.

Additional live checks: four deployed unauthorized operations reverted with Unauthorized via eth_call (outsider metadata, admin finalization, outsider principal withdrawal, finalizer resume). Official-token fork regression passed4tests again. Hosted quote request returned AVAILABLE for Ethereum/Arbitrum/Base; one bounded read-only comparison does not establish sustained quote-only provider entitlement.
