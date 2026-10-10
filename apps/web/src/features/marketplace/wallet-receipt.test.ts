import { describe, expect, it, vi } from 'vitest';
import {
  validateDeploymentManifest,
  type DeploymentManifest,
} from '@rwa/shared/config';
import type { Address } from 'viem';
import deployment from '../../../../../deployments/sepolia.json';
import { MarketplaceWallet, type TrackedTransaction } from './wallet';

const manifest = validateDeploymentManifest(
  deployment as DeploymentManifest,
  11155111,
);
const original: TrackedTransaction = {
  hash: `0x${'11'.repeat(32)}`,
  wallet: `0x${'22'.repeat(20)}`,
  chainId: 11155111,
  market: manifest.market,
  to: manifest.market as Address,
  data: '0x12345678',
  status: 'PENDING',
  replacementHash: null,
  nonce: 27,
  submittedAtBlock: '100',
};
const blockHash = `0x${'33'.repeat(32)}`;
const replacementHash = `0x${'44'.repeat(32)}` as const;
const wrapper = `0x${'55'.repeat(20)}`;

function fixture({
  receiptStatus = 'success',
  hash = original.hash,
  from = original.wallet,
  to = original.to as string,
  input = original.data,
  nonce = original.nonce,
  canonical = true,
} = {}) {
  const request = vi.fn(() => {
    throw new Error('Unexpected RPC request');
  });
  const wallet = new MarketplaceWallet({ request } as never, manifest);
  vi.spyOn(wallet.publicClient, 'getTransaction').mockResolvedValue({
    hash,
    from,
    to,
    input,
    nonce,
    value: 0n,
  } as never);
  vi.spyOn(wallet.publicClient, 'waitForTransactionReceipt').mockResolvedValue({
    transactionHash: hash,
    status: receiptStatus,
    blockHash,
    blockNumber: 101n,
    logs: [],
  } as never);
  vi.spyOn(wallet.publicClient, 'getBlock').mockResolvedValue({
    hash: canonical ? blockHash : `0x${'66'.repeat(32)}`,
    number: 101n,
  } as never);
  const snapshot = vi.spyOn(wallet.reader, 'snapshot').mockResolvedValue({
    chainId: 11155111,
    blockNumber: '101',
    blockHash,
    blockTimestamp: 1,
  } as never);
  return { wallet, request, snapshot };
}

describe('receipt identity and wallet wrapping', () => {
  it.each(['PENDING', 'CANCELLED'] as const)(
    'repairs %s to reverted for the original wallet-wrapped hash without optimistic state',
    async (status) => {
      const { wallet, request, snapshot } = fixture({
        receiptStatus: 'reverted',
        to: wrapper,
        input: '0xcef6d209',
      });
      const update = vi.fn();
      const result = await wallet.track({ ...original, status }, update);
      expect(result.tracked.status).toBe('REVERTED');
      expect(result.listing).toBeNull();
      expect(result.position).toBeNull();
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'REVERTED' }),
      );
      expect(snapshot).not.toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled();
    },
  );
  it('keeps a successful modified original transaction unknown instead of permitting an unsafe retry', async () => {
    const { wallet, snapshot } = fixture({ to: wrapper, input: '0xcef6d209' });
    const result = await wallet.track(original, () => {});
    expect(result.tracked.status).toBe('UNKNOWN');
    expect(result.position).toBeNull();
    expect(snapshot).not.toHaveBeenCalled();
  });
  it.each(['success', 'reverted'])(
    'does not trust a %s receipt from a different sender',
    async (receiptStatus) => {
      const { wallet } = fixture({ receiptStatus, from: wrapper });
      expect((await wallet.track(original, () => {})).tracked.status).toBe(
        'UNKNOWN',
      );
    },
  );
  it('does not trust a different nonce', async () => {
    const { wallet } = fixture({ receiptStatus: 'reverted', nonce: 28 });
    expect((await wallet.track(original, () => {})).tracked.status).toBe(
      'UNKNOWN',
    );
  });
  it('holds an unverified replacement when the legacy journal has no nonce', async () => {
    const { wallet } = fixture({ hash: replacementHash });
    expect(
      (
        await wallet.track(
          { ...original, replacementHash, nonce: null },
          () => {},
        )
      ).tracked.status,
    ).toBe('UNKNOWN');
  });
  it.each(['success', 'reverted'])(
    'reports a different-action replacement as cancelled even when %s',
    async (receiptStatus) => {
      const { wallet } = fixture({
        receiptStatus,
        hash: replacementHash,
        to: original.wallet,
        input: '0x',
      });
      expect(
        (await wallet.track({ ...original, replacementHash }, () => {})).tracked
          .status,
      ).toBe('CANCELLED');
    },
  );
  it.each([null, replacementHash])(
    'accepts only the exact successful action for hash replacement %s',
    async (replacement) => {
      const { wallet } = fixture({ hash: replacement ?? original.hash });
      expect(
        (
          await wallet.track(
            { ...original, replacementHash: replacement },
            () => {},
          )
        ).tracked.status,
      ).toBe('FINALIZED');
    },
  );
  it('reports an exact direct revert', async () => {
    const { wallet } = fixture({ receiptStatus: 'reverted' });
    expect((await wallet.track(original, () => {})).tracked.status).toBe(
      'REVERTED',
    );
  });
  it('rejects an orphaned receipt before interpreting its status', async () => {
    const { wallet } = fixture({ receiptStatus: 'reverted', canonical: false });
    expect((await wallet.track(original, () => {})).tracked.status).toBe(
      'REORGED',
    );
  });
});
