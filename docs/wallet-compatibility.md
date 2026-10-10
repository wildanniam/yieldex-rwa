# Wallet receipt compatibility

The wallet may submit the reviewed call inside a smart-account execution. Outer `to`/`input` inequality alone does not mean the user cancelled it. Receipt tracking first verifies sender, nonce, canonical block and receipt status. An original reverted hash is `REVERTED`, including when its wrapper is unsupported. Unknown successful execution remains `UNKNOWN`; it does not unlock automatic resubmission or create optimistic ownership.

## Supported wrapped execution

In addition to exact direct calls, the browser recognizes one narrowly scoped MetaMask path on Ethereum Sepolia:

- DelegationManager `0xdb9b1e94b5b69df7e401ddbede43491141047db3`, runtime hash `0x49c7f94924ffb53300b7e8ee613814d5ba587fd886177f1e72b3203bf17da673`.
- EIP7702StatelessDeleGator `0x63c0c19a282a1b52b07dd5a65b58948a07dae32b`, runtime hash `0x9270f73d98e7ed6978677bf0550038289efd510e67e700d024502d62510fc1e4`.
- The sender's EIP-7702 delegation points to that implementation at the receipt block; both runtime hashes are checked at that same block.
- Exactly one canonical `redeemDelegations` execution, one root self-delegation, and mode `SINGLE + DEFAULT` (32 zero bytes). The packed inner target, zero native value and complete calldata must equal the reviewed action. Different modes, batches, delegated callers and noncanonical encodings are unsupported.
- In this pinned implementation, DEFAULT propagates inner-call failure. A successful canonical receipt therefore proves execution of the matched call. Application ownership/listing overlays still come from market logs and direct contract reads; no receipt creates invented balances.

This is receipt interpretation only, not a new wallet send path or permission request. It does not switch off MetaMask protection. Provider failures propagate for retry; they are not treated as proof of mismatch. Future wallet implementations must be reviewed and tested before adding support.

## Evidence and limits

Official source revision: [`bff4b08f8006ad94322a6e3da8d90f274e20325d`](https://github.com/MetaMask/delegation-framework/tree/bff4b08f8006ad94322a6e3da8d90f274e20325d). See its [Sepolia deployment](https://github.com/MetaMask/delegation-framework/blob/bff4b08f8006ad94322a6e3da8d90f274e20325d/broadcast/DeployEIP7702StatelessDeleGator.s.sol/11155111/run-latest.json), [manager](https://github.com/MetaMask/delegation-framework/blob/bff4b08f8006ad94322a6e3da8d90f274e20325d/src/DelegationManager.sol) and [executor](https://github.com/MetaMask/delegation-framework/blob/bff4b08f8006ad94322a6e3da8d90f274e20325d/src/EIP7702/EIP7702DeleGatorCore.sol).

Production Chrome/MetaMask purchase on 2026-10-10: [`0x3994…ac1e`](https://sepolia.etherscan.io/tx/0x3994d0819f112cc57a592a1f02285ba09b0eada85f3c8c0f45568913b14fac1e), block 11884325. It executed before the review deadline, paid exactly 1 DemoUSD, moved position 2 income rights to the buyer and retained principal ownership with the seller. The older client misreported this as cancelled. Runtime hashes above were read from this block. Unit fixtures exercise malformed, changed-code, different-call, TRY, batch and provider-failure boundaries; they are not live transaction evidence.

The MetaMask domain security alert observed during testing remains an independent unresolved issue. Successful testnet execution does not establish that alert is a false positive, nor prove claim/resale/release flows or support for every smart wallet.
