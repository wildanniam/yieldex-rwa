# Sumber dan Batas Riset Baseline

Diakses atau direview pada 8 Oktober 2026. Keputusan implementasi di dokumen ini adalah rancangan; dokumentasi provider bukan pengganti tes runtime. Snapshot token lama tetap terikat blok dan commit pada evidence, tidak diklaim sebagai state chain terbaru.

| Sumber primer | Dipakai untuk | Batas |
| --- | --- | --- |
| [OpenSpec quickstart](https://openspec.dev/docs/quickstart), [setup](https://openspec.dev/docs/setup), [CLI](https://openspec.dev/docs/cli), [config](https://openspec.dev/docs/project-config) | Proposal/spec/design/tasks, active vs archive, strict validation, context rules | Web docs lebih baru; actual CLI 1.3.1 help/instructions dipakai untuk command dan syntax |
| [xStocks developers](https://docs.xstocks.fi/developers), [multipliers](https://docs.xstocks.fi/developers/multipliers), [corporate actions](https://docs.xstocks.fi/apis/openapi/corporate-actions) | Shares/rebase, effective event, classification | Metadata does not prove immutable issuer finality; team role remains trusted |
| [Backed source](https://github.com/backed-fi/backed-token-contract), [Sourcify](https://sourcify.dev/) | Prior source verification and pinned bytecode evidence | Exact references/hashes in technical report; not contract product audit |
| [Uniswap quoting](https://developers.uniswap.org/docs/sdks/v3/guides/swapping/quoting) | Amount-aware pool simulation without transaction | Pool quote gas estimate may omit total wallet/router/approval costs |
| [0x getPrice](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getprice), [supported chains](https://docs.0x.org/docs/introduction/supported-chains) | Exact-input/output read-only quotes, fees/routes/provider keys | Live access/response mapper needs spike; provider quote not global cheapest guarantee |
| [LI.FI quote](https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer) | Cross-chain fee/time relevance | Not an initial execution dependency; no bridge transaction built |
| [CopilotKit quickstart](https://docs.copilotkit.ai/quickstart), [models](https://docs.copilotkit.ai/model-selection), [render tool](https://docs.copilotkit.ai/reference/hooks/useRenderTool) | Single built-in runtime, server tools/card renderer | Dependency version pin and full runtime validation remain tasks |
| [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling) | Structured tool roles and validation boundary | CopilotKit controls runtime loop; no duplicate custom loop |
| [Supabase Web3 auth](https://supabase.com/docs/guides/auth/auth-web3), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Verified wallet login, session/private data access | Authentication/replay/provider setup requires runtime tests |
| [Viem simulateContract](https://viem.sh/docs/contract/simulateContract), [receipt](https://viem.sh/docs/actions/public/waitForTransactionReceipt) | Simulate before sign, confirmation/replacement handling | Simulation is state-specific, not future success guarantee |
| [OpenZeppelin Math](https://docs.openzeppelin.com/contracts/5.x/api/utils), [access](https://docs.openzeppelin.com/contracts/5.x/access-control) | mulDiv rounding and constrained roles | Pin/audit actual installed contract version during implementation |
| [JSON Schema 2020-12](https://json-schema.org/draft/2020-12) | Wire validation with offline local refs | Cannot enforce all financial/authorization semantics |

Provider-specific detailed sources are also kept near the affected design in accounting, data/API and AI/quote appendices. If a runtime differs from docs, record captured response/version and revise the contract before coding consumers around invented fields.
