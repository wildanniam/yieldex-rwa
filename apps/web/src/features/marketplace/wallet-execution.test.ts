import { describe, expect, it, vi } from 'vitest';
import {
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  parseAbi,
  parseAbiParameters,
  zeroHash,
  type Hex,
} from 'viem';
import { matchesReviewedWalletExecution } from './wallet-execution';

// Controlled bytecode identities; actual deployed bytecode is checked separately
// by the read-only Sepolia receipt reproduction. No wallet RPC is mocked as live.
vi.mock('viem', async (original) => {
  const actual = await original<typeof import('viem')>();
  return {
    ...actual,
    keccak256: (data: Hex) =>
      data === '0x11'
        ? '0x49c7f94924ffb53300b7e8ee613814d5ba587fd886177f1e72b3203bf17da673'
        : data === '0x22'
          ? '0x9270f73d98e7ed6978677bf0550038289efd510e67e700d024502d62510fc1e4'
          : actual.keccak256(data),
  };
});

const manager = '0xdb9b1e94b5b69df7e401ddbede43491141047db3';
const delegator = '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b';
const wallet = `0x${'33'.repeat(20)}` as const;
const target = `0x${'44'.repeat(20)}` as const;
const data = '0x63985bc400000001';
const abi = parseAbi([
  'function redeemDelegations(bytes[] permissionContexts, bytes32[] modes, bytes[] executionCallDatas)',
]);
const parameters = parseAbiParameters(
  '(address delegate, address delegator, bytes32 authority, (address enforcer, bytes terms, bytes args)[] caveats, uint256 salt, bytes signature)[]',
);
const permission = {
  delegate: wallet,
  delegator: wallet,
  authority: `0x${'ff'.repeat(32)}` as Hex,
  caveats: [],
  salt: 0n,
  signature: '0x' as Hex,
};
function fixture({
  contexts = [encodeAbiParameters(parameters, [[permission]])],
  modes = [zeroHash],
  executions = [concatHex([target, zeroHash, data])],
}: { contexts?: Hex[]; modes?: Hex[]; executions?: Hex[] } = {}) {
  const getCode = vi.fn(async ({ address }: { address: string }) =>
    address === wallet
      ? concatHex(['0xef0100', delegator])
      : address === manager
        ? ('0x11' as Hex)
        : ('0x22' as Hex),
  );
  const input: Parameters<typeof matchesReviewedWalletExecution>[1] = {
    chainId: 11155111,
    wallet,
    to: target,
    data: data as Hex,
    transaction: {
      to: manager,
      value: 0n,
      input: encodeFunctionData({
        abi,
        functionName: 'redeemDelegations',
        args: [contexts, modes, executions],
      }),
    },
    blockNumber: 123n,
  };
  return { input, getCode };
}

describe('pinned MetaMask single execution receipt', () => {
  it('verifies the exact self-delegated call and bytecode at the receipt block', async () => {
    const { input, getCode } = fixture();
    expect(await matchesReviewedWalletExecution({ getCode }, input)).toBe(true);
    expect(getCode).toHaveBeenCalledTimes(3);
    for (const [query] of getCode.mock.calls)
      expect(query).toEqual(expect.objectContaining({ blockNumber: 123n }));
  });
  it.each([
    { chainId: 31337 },
    { transaction: { to: target } },
    { transaction: { value: 1n } },
    { transaction: { input: '0xcef6d209' as Hex } },
  ])(
    'rejects unsupported outer context case %# without RPC',
    async (change) => {
      const { input, getCode } = fixture();
      expect(
        await matchesReviewedWalletExecution(
          { getCode },
          {
            ...input,
            ...change,
            transaction: { ...input.transaction, ...change.transaction },
          },
        ),
      ).toBe(false);
      expect(getCode).not.toHaveBeenCalled();
    },
  );
  it.each([
    { modes: [`0x01${'00'.repeat(31)}` as Hex] }, // batch
    { modes: [`0x0001${'00'.repeat(30)}` as Hex] }, // single + TRY
    { modes: [] },
    { executions: [concatHex([target, zeroHash, data]), '0x' as Hex] },
    { executions: [concatHex([wallet, zeroHash, data])] },
    { executions: [concatHex([target, `0x${'00'.repeat(31)}01`, data])] },
    { executions: [concatHex([target, zeroHash, data, '0xff'])] },
    { contexts: ['0x' as Hex] },
    { contexts: [encodeAbiParameters(parameters, [[]])] },
    { contexts: [encodeAbiParameters(parameters, [[permission, permission]])] },
    {
      contexts: [
        encodeAbiParameters(parameters, [
          [{ ...permission, delegator: target }],
        ]),
      ],
    },
    {
      contexts: [
        encodeAbiParameters(parameters, [
          [{ ...permission, delegate: target }],
        ]),
      ],
    },
    {
      contexts: [
        encodeAbiParameters(parameters, [
          [{ ...permission, authority: zeroHash }],
        ]),
      ],
    },
  ])(
    'rejects ambiguous or different inner execution case %#',
    async (change) => {
      const { input, getCode } = fixture(change);
      expect(await matchesReviewedWalletExecution({ getCode }, input)).toBe(
        false,
      );
      expect(getCode).not.toHaveBeenCalled();
    },
  );
  it('rejects trailing noncanonical calldata', async () => {
    const { input, getCode } = fixture();
    input.transaction.input = concatHex([input.transaction.input, '0x00']);
    expect(await matchesReviewedWalletExecution({ getCode }, input)).toBe(
      false,
    );
  });
  it.each([wallet, manager, delegator])(
    'rejects changed code at %s',
    async (address) => {
      const { input, getCode } = fixture();
      const read = getCode.getMockImplementation()!;
      getCode.mockImplementation(async (query) =>
        query.address === address ? '0x99' : read(query),
      );
      expect(await matchesReviewedWalletExecution({ getCode }, input)).toBe(
        false,
      );
    },
  );
  it('propagates provider failures without inventing a cancellation', async () => {
    const { input, getCode } = fixture();
    getCode.mockRejectedValue(new Error('RPC unavailable'));
    await expect(
      matchesReviewedWalletExecution({ getCode }, input),
    ).rejects.toThrow('RPC unavailable');
  });
});
