import { describe, expect, it } from 'vitest';
import { encodeErrorResult } from 'viem';
import { implementationAbis } from '../generated/abis';
import { revertCode } from './prepare';
const foreignError = (name: string, props: Record<string, unknown> = {}) =>
  Object.assign(new Error('not user-facing'), { name }, props);
describe('revert mapping across duplicate viem peer instances', () => {
  it('decodes a nested RPC claim revert without relying on class identity', () => {
    const data = encodeErrorResult({
      abi: implementationAbis.IncomeRightsMarket,
      errorName: 'InsufficientClaimShares',
      args: [0n, 123n],
    });
    const rpc = foreignError('RpcRequestError', { code: 3, data });
    expect(
      revertCode(
        foreignError('CallExecutionError', {
          cause: foreignError('ExecutionRevertedError', { cause: rpc }),
        }),
      ),
    ).toBe('InsufficientClaimShares');
  });
  it('maps explicit unknown revert to a bounded code and never prints arbitrary error data', () => {
    expect(
      revertCode(foreignError('RawContractError', { data: '0xffffffff' })),
    ).toBe('SIMULATION_REVERTED');
    expect(
      revertCode(
        foreignError('ContractFunctionRevertedError', {
          data: { errorName: 'https://rpc.invalid/secret' },
        }),
      ),
    ).toBe('SIMULATION_REVERTED');
  });
  it('preserves transport, rate limits and timeouts as service failures', () => {
    expect(
      revertCode(
        foreignError('RpcRequestError', { code: -32005, data: '0xffffffff' }),
      ),
    ).toBeNull();
    expect(revertCode(foreignError('HttpRequestError'))).toBeNull();
    const cyclic = foreignError('BaseError');
    Object.assign(cyclic, { cause: cyclic });
    expect(revertCode(cyclic)).toBeNull();
  });
});
