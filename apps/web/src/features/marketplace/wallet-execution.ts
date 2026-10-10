import {
  concatHex,
  decodeAbiParameters,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  parseAbi,
  zeroHash,
  type Address,
  type Hex,
} from 'viem';

// Sepolia deployments and bytecode reviewed in docs/wallet-compatibility.md.
const manager = '0xdb9b1e94b5b69df7e401ddbede43491141047db3';
const delegator = '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b';
const managerHash =
  '0x49c7f94924ffb53300b7e8ee613814d5ba587fd886177f1e72b3203bf17da673';
const delegatorHash =
  '0x9270f73d98e7ed6978677bf0550038289efd510e67e700d024502d62510fc1e4';
const redemptionAbi = parseAbi([
  'function redeemDelegations(bytes[] permissionContexts, bytes32[] modes, bytes[] executionCallDatas)',
]);
const delegationParameters = [
  {
    type: 'tuple[]',
    components: [
      { name: 'delegate', type: 'address' },
      { name: 'delegator', type: 'address' },
      { name: 'authority', type: 'bytes32' },
      {
        name: 'caveats',
        type: 'tuple[]',
        components: [
          { name: 'enforcer', type: 'address' },
          { name: 'terms', type: 'bytes' },
          { name: 'args', type: 'bytes' },
        ],
      },
      { name: 'salt', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
  },
] as const;

/** Only proves the exact inner call of the pinned, revert-on-failure wallet path.
 * Sender/nonce, canonical receipt, status and resulting state are checked by track.
 * Unsupported smart accounts remain UNKNOWN; this never constructs a wallet call.
 */
export async function matchesReviewedWalletExecution(
  client: {
    getCode: (input: {
      address: Address;
      blockNumber: bigint;
    }) => Promise<Hex | undefined>;
  },
  input: {
    chainId: number;
    wallet: string;
    to: Address;
    data: Hex;
    transaction: { to: Address | null; input: Hex; value: bigint };
    blockNumber: bigint;
  },
): Promise<boolean> {
  const { transaction: tx } = input;
  if (
    input.chainId !== 11155111 ||
    tx.to?.toLowerCase() !== manager ||
    tx.value !== 0n
  )
    return false;
  try {
    const decoded = decodeFunctionData({ abi: redemptionAbi, data: tx.input });
    const [contexts, modes, executions] = decoded.args;
    if (
      contexts.length !== 1 ||
      modes.length !== 1 ||
      executions.length !== 1 ||
      // SINGLE + DEFAULT. TRY can return success after an inner failure.
      modes[0] !== zeroHash ||
      executions[0]?.toLowerCase() !==
        concatHex([input.to, zeroHash, input.data]).toLowerCase() ||
      encodeFunctionData({
        abi: redemptionAbi,
        functionName: decoded.functionName,
        args: decoded.args,
      }).toLowerCase() !== tx.input.toLowerCase()
    )
      return false;
    const permissions = decodeAbiParameters(delegationParameters, contexts[0]!);
    const self = permissions[0][0];
    if (
      permissions[0].length !== 1 ||
      !self ||
      self.delegate.toLowerCase() !== input.wallet ||
      self.delegator.toLowerCase() !== input.wallet ||
      self.authority !== `0x${'ff'.repeat(32)}` ||
      encodeAbiParameters(delegationParameters, permissions).toLowerCase() !==
        contexts[0]!.toLowerCase()
    )
      return false;
  } catch {
    // Malformed/unsupported calldata is not evidence of the reviewed action.
    return false;
  }
  // Read errors must propagate: a provider outage is not an identity mismatch.
  const [accountCode, managerCode, delegatorCode] = await Promise.all([
    client.getCode({
      address: input.wallet as Address,
      blockNumber: input.blockNumber,
    }),
    client.getCode({ address: manager, blockNumber: input.blockNumber }),
    client.getCode({ address: delegator, blockNumber: input.blockNumber }),
  ]);
  return (
    accountCode?.toLowerCase() === concatHex(['0xef0100', delegator]) &&
    !!managerCode &&
    keccak256(managerCode) === managerHash &&
    !!delegatorCode &&
    keccak256(delegatorCode) === delegatorHash
  );
}
