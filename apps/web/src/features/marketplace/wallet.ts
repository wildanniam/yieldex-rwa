'use client';
import {
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  encodeFunctionData,
  decodeEventLog,
  createPublicClient,
  createWalletClient,
  custom,
  type EIP1193Provider,
  type Address,
  type Hex,
} from 'viem';
import { implementationAbis } from '@rwa/shared/abi';
import { foundry, sepolia } from 'viem/chains';
import { validateData } from '@rwa/shared/validation';
import { ChainReader } from '@rwa/shared/chain';
import { prepareTransaction, readListingAt } from '@rwa/shared/transactions';
import type { DeploymentManifest } from '@rwa/shared/config';
import type {
  PreparedIntent,
  PrepareIntentRequest,
  ListingDetail,
  Position,
} from '@rwa/shared';
export type WalletProvider = EIP1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
};
export type TrackedTransaction = {
  hash: Hex;
  wallet: string;
  chainId: number;
  market: string;
  to: Address;
  data: Hex;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'FINALIZED'
    | 'REVERTED'
    | 'CANCELLED'
    | 'REORGED'
    | 'UNKNOWN';
  replacementHash: Hex | null;
  nonce: number | null;
  submittedAtBlock: string;
};
/** Local storage is untrusted; invalid entries must never become RPC requests. */
export function validJournalEntry(value: unknown): value is TrackedTransaction {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  const address = (v: unknown) =>
    typeof v === 'string' && /^0x[0-9a-f]{40}$/.test(v);
  const hash = (v: unknown) =>
    typeof v === 'string' && /^0x[0-9a-f]{64}$/.test(v);
  return (
    hash(t.hash) &&
    address(t.wallet) &&
    address(t.market) &&
    address(t.to) &&
    [31337, 11155111].includes(t.chainId as number) &&
    typeof t.data === 'string' &&
    /^0x(?:[0-9a-f]{2}){4,4096}$/.test(t.data) &&
    [
      'PENDING',
      'CONFIRMED',
      'FINALIZED',
      'REVERTED',
      'CANCELLED',
      'REORGED',
      'UNKNOWN',
    ].includes(t.status as string) &&
    (t.replacementHash === null || hash(t.replacementHash)) &&
    (t.nonce === null ||
      (Number.isSafeInteger(t.nonce) && (t.nonce as number) >= 0)) &&
    typeof t.submittedAtBlock === 'string' &&
    /^(0|[1-9][0-9]{0,19})$/.test(t.submittedAtBlock)
  );
}
export class MarketplaceWallet {
  readonly reader: ChainReader;
  readonly publicClient;
  private sending = false;
  constructor(
    readonly provider: WalletProvider,
    readonly manifest: DeploymentManifest,
  ) {
    this.publicClient = createPublicClient({
      transport: custom(provider, { retryCount: 0 }),
      pollingInterval: 1000,
    });
    this.reader = new ChainReader(this.publicClient, manifest);
  }
  async identity(request = false) {
    const accounts = await this.provider.request({
      method: request ? 'eth_requestAccounts' : 'eth_accounts',
    });
    return {
      wallet: accounts[0]?.toLowerCase() ?? null,
      chainId: await this.publicClient.getChainId(),
    };
  }
  async prepare(input: PrepareIntentRequest) {
    const who = await this.identity();
    if (!who.wallet || who.chainId !== this.manifest.chainId)
      throw new Error('Hubungkan wallet pada chain marketplace.');
    await this.reader.verify();
    return prepareTransaction(this.reader, input, who.wallet, {
      intentId: crypto.randomUUID(),
      stepId: crypto.randomUUID(),
    });
  }
  async send(
    preview: PreparedIntent,
    onHash: (tracked: TrackedTransaction) => void,
  ) {
    if (this.sending) throw new Error('Permintaan wallet masih berjalan.');
    this.sending = true;
    try {
      if (
        !validateData('api.PreparedIntent', preview).success ||
        preview.deadline !== preview.expiresAt ||
        preview.createdAt !== preview.preparedAtSnapshot.blockTimestamp ||
        preview.expiresAt > preview.createdAt + 120 ||
        preview.preparedAtSnapshot.chainId !== preview.chainId
      )
        throw new Error('Preview tidak valid.');
      const who = await this.identity();
      if (
        who.wallet !== preview.walletAddress ||
        who.chainId !== preview.chainId ||
        preview.marketAddress !== this.manifest.market
      )
        throw new Error('Wallet atau chain berubah. Buat preview baru.');
      if (
        !['READY', 'NEEDS_APPROVAL'].includes(preview.state) ||
        preview.steps.length !== 1
      )
        throw new Error('Preview tidak dapat dikirim.');
      const step = preview.steps[0]!;
      if (
        step.chainId !== preview.chainId ||
        step.from !== preview.walletAddress
      )
        throw new Error('Context step tidak valid.');
      const snapshot = await this.reader.snapshot('latest');
      if (snapshot.blockTimestamp >= preview.expiresAt)
        throw new Error('Preview kedaluwarsa. Buat preview baru.');
      // Fresh canonical re-encoding prevents arbitrary/tampered steps from reaching a wallet.
      const fresh = await prepareTransaction(
        this.reader,
        preview.request,
        preview.walletAddress,
        { intentId: crypto.randomUUID(), stepId: crypto.randomUUID() },
      );
      if (
        fresh.state !== preview.state ||
        fresh.expectedTermsHash !== preview.expectedTermsHash ||
        fresh.expectedAssetHeadHash !== preview.expectedAssetHeadHash ||
        fresh.maxPriceAtomic !== preview.maxPriceAtomic
      )
        throw new Error('Kondisi berubah. Buat preview baru.');
      const f = fresh.steps[0];
      if (
        !f ||
        f.kind !== step.kind ||
        f.to !== step.to ||
        f.from !== step.from ||
        f.valueAtomic !== step.valueAtomic ||
        f.functionName !== step.functionName ||
        f.allowanceAmountAtomic !== step.allowanceAmountAtomic
      )
        throw new Error('Preview berbeda dari aturan transaksi.');
      // Buy calldata includes its ORIGINAL expiry. Rebuild with that original deadline for exact comparison.
      if (preview.request.action === 'BUY_LISTING' && step.kind === 'ACTION') {
        if (
          preview.maxEvents !== 32 ||
          preview.deadline >= fresh.purchaseSummary!.listing.expiresAt ||
          (fresh.purchaseSummary!.listing.kind === 'SECONDARY' &&
            preview.deadline >= fresh.purchaseSummary!.position.endAt!)
        )
          throw new Error('Deadline preview tidak valid.');
        const expected = encodeFunctionData({
          abi: implementationAbis.IncomeRightsMarket,
          functionName: 'buyListing',
          args: [
            {
              listingId: BigInt(preview.request.listingKey.split(':').at(-1)!),
              expectedTermsHash: preview.expectedTermsHash as Hex,
              expectedAssetHeadHash: preview.expectedAssetHeadHash as Hex,
              maxPriceAtomic: BigInt(preview.maxPriceAtomic!),
              deadline: BigInt(preview.deadline),
              maxEvents: 32,
            },
          ],
        });
        if (expected !== step.data)
          throw new Error('Calldata tidak sesuai preview.');
      } else if (f.data !== step.data)
        throw new Error('Calldata tidak sesuai preview.');
      await this.publicClient.call({
        account: preview.walletAddress as Address,
        to: step.to as Address,
        data: step.data as Hex,
        value: 0n,
        blockNumber: BigInt(snapshot.blockNumber),
      });
      const current = await this.identity();
      if (current.wallet !== who.wallet || current.chainId !== who.chainId)
        throw new Error('Wallet berubah saat validasi.');
      const wallet = createWalletClient({
        account: who.wallet as Address,
        chain: who.chainId === 31337 ? foundry : sepolia,
        transport: custom(this.provider, { retryCount: 0 }),
      });
      const hash = await wallet.sendTransaction({
        to: step.to as Address,
        data: step.data as Hex,
        value: 0n,
      });
      const tracked: TrackedTransaction = {
        hash,
        wallet: who.wallet!,
        chainId: who.chainId,
        market: this.manifest.market,
        to: step.to as Address,
        data: step.data as Hex,
        status: 'PENDING',
        replacementHash: null,
        nonce: null,
        submittedAtBlock: snapshot.blockNumber,
      };
      onHash(tracked);
      try {
        const tx = await this.publicClient.getTransaction({ hash });
        tracked.nonce = tx.nonce;
        onHash({ ...tracked });
      } catch {
        /* Hash is already persisted; unavailable tx detail is not send failure. */
      }
      return tracked;
    } finally {
      this.sending = false;
    }
  }
  async track(
    original: TrackedTransaction,
    onUpdate: (tracked: TrackedTransaction) => void,
  ): Promise<{
    tracked: TrackedTransaction;
    listing: ListingDetail | null;
    position: Position | null;
  }> {
    if (
      original.chainId !== this.manifest.chainId ||
      original.market !== this.manifest.market
    )
      throw new Error('Deployment receipt berbeda.');
    let tracked = { ...original };
    if (['CONFIRMED', 'FINALIZED'].includes(tracked.status)) {
      try {
        await this.publicClient.getTransactionReceipt({
          hash: tracked.replacementHash ?? tracked.hash,
        });
      } catch (e) {
        if (e instanceof TransactionReceiptNotFoundError) {
          tracked.status = 'REORGED';
          onUpdate(tracked);
          return { tracked, listing: null, position: null };
        }
        throw e;
      }
    }
    try {
      await this.publicClient.getTransaction({
        hash: tracked.replacementHash ?? tracked.hash,
      });
    } catch (e) {
      if (!(e instanceof TransactionNotFoundError)) throw e;
      if (
        tracked.nonce !== null &&
        tracked.nonce !== undefined &&
        tracked.submittedAtBlock
      ) {
        const latest = await this.publicClient.getBlockNumber(),
          start =
            latest > 128n && latest - 128n > BigInt(tracked.submittedAtBlock)
              ? latest - 128n
              : BigInt(tracked.submittedAtBlock);
        for (let n = latest; n >= start; n--) {
          const block = await this.publicClient.getBlock({
            blockNumber: n,
            includeTransactions: true,
          });
          const replacement = block.transactions.find(
            (t) =>
              t.from.toLowerCase() === tracked.wallet &&
              t.nonce === tracked.nonce,
          );
          if (replacement) {
            tracked.replacementHash = replacement.hash;
            onUpdate(tracked);
            break;
          }
        }
      }
    }
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: tracked.replacementHash ?? tracked.hash,
      timeout: 120000,
      onReplaced: (e) => {
        tracked = {
          ...tracked,
          replacementHash: e.transaction.hash,

          status: e.reason === 'cancelled' ? 'CANCELLED' : 'PENDING',
        };
        onUpdate(tracked);
      },
    });
    const tx = await this.publicClient.getTransaction({
        hash: receipt.transactionHash,
      }),
      block = await this.publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      });
    if (block.hash !== receipt.blockHash) {
      tracked.status = 'REORGED';
      onUpdate(tracked);
      return { tracked, listing: null, position: null };
    }
    const sameSenderAndNonce =
      tx.from.toLowerCase() === tracked.wallet &&
      (tracked.nonce === null
        ? receipt.transactionHash === tracked.hash
        : tx.nonce === tracked.nonce);
    const sameAction =
      tx.to?.toLowerCase() === tracked.to &&
      tx.value === 0n &&
      tx.input === tracked.data;
    // A wallet may wrap the original call (for example, a protected smart-account
    // execution). Its reverted receipt is still a failure, not a cancellation.
    // A successful wrapper is not proof of the reviewed action: keep it unknown.
    if (!sameSenderAndNonce) {
      tracked.status = 'UNKNOWN';
      onUpdate(tracked);
      return { tracked, listing: null, position: null };
    }
    if (!sameAction && receipt.transactionHash !== tracked.hash) {
      tracked.status = 'CANCELLED';
      onUpdate(tracked);
      return { tracked, listing: null, position: null };
    }
    if (receipt.status === 'reverted') {
      tracked.status = 'REVERTED';
      onUpdate(tracked);
      return { tracked, listing: null, position: null };
    }
    if (!sameAction) {
      tracked.status = 'UNKNOWN';
      onUpdate(tracked);
      return { tracked, listing: null, position: null };
    }
    tracked.status = 'CONFIRMED';
    try {
      const final = await this.publicClient.getBlock({ blockTag: 'finalized' });
      if (final.number >= receipt.blockNumber) tracked.status = 'FINALIZED';
    } catch {
      /* keep confirmed */
    }
    onUpdate(tracked);
    let listingId: bigint | undefined, positionId: bigint | undefined;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== this.manifest.market) continue;
      try {
        const event = decodeEventLog({
          abi: implementationAbis.IncomeRightsMarket,
          data: log.data,
          topics: log.topics,
          strict: true,
        });
        if ('listingId' in event.args) listingId = event.args.listingId;
        if ('positionId' in event.args) positionId = event.args.positionId;
      } catch {
        /* Ignore unrelated receipt logs. */
      }
    }
    const snapshot = await this.reader.snapshot(receipt.blockNumber);
    return {
      tracked,
      listing: listingId
        ? await readListingAt(this.reader, listingId, snapshot)
        : null,
      position: positionId
        ? await this.reader.position(positionId, snapshot)
        : null,
    };
  }
}
