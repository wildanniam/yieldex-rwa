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
