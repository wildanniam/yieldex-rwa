import {
  decodeEventLog,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  type Hex,
} from 'viem';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { ChainReader, entityKey } from '@rwa/shared/chain';
import type { TransactionStatus } from '@rwa/shared';
import { ApiFailure } from '../http';
export async function transactionStatus(
  reader: ChainReader,
  hash: string,
): Promise<TransactionStatus> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash))
    throw new ApiFailure(
      400,
      'VALIDATION_ERROR',
      'Hash transaksi tidak valid.',
    );
  const h = hash.toLowerCase() as Hex,
    m = reader.manifest;
  const result: TransactionStatus = {
    chainId: m.chainId,
    transactionHash: h,
    replacementTransactionHash: null,
    status: 'UNKNOWN',
    blockNumber: null,
    blockHash: null,
    observedAt: Math.floor(Date.now() / 1000),
    intentId: null,
    listingKey: null,
    positionKey: null,
    reasonCode: null,
  };
  try {
    await reader.client.getTransaction({ hash: h });
  } catch (e) {
    if (e instanceof TransactionNotFoundError) return result;
    throw e;
  }
  result.status = 'PENDING';
  let receipt;
  try {
    receipt = await reader.client.getTransactionReceipt({ hash: h });
  } catch (e) {
    if (e instanceof TransactionReceiptNotFoundError) return result;
    throw e;
  }
  const block = await reader.client.getBlock({
    blockNumber: receipt.blockNumber,
  });
  if (block.hash !== receipt.blockHash) {
    result.status = 'REORGED';
    return result;
  }
  result.blockNumber = receipt.blockNumber.toString();
  result.blockHash = receipt.blockHash;
  if (receipt.status === 'reverted') {
    result.status = 'REVERTED';
    result.reasonCode = 'TRANSACTION_REVERTED';
    return result;
  }
  result.status = 'CONFIRMED';
  // An unavailable finalized tag must never upgrade a receipt to FINALIZED.
  try {
    const finalized = await reader.client.getBlock({ blockTag: 'finalized' });
    if (finalized.number >= receipt.blockNumber) result.status = 'FINALIZED';
  } catch {
    result.reasonCode = 'FINALITY_UNAVAILABLE';
  }
  for (const l of receipt.logs) {
    if (l.address.toLowerCase() !== m.market) continue;
    try {
      const e = decodeEventLog({
        abi: abi.IncomeRightsMarket,
        data: l.data,
        topics: l.topics,
        strict: true,
      });
      if ('positionId' in e.args)
        result.positionKey = entityKey(
          m.chainId,
          m.market,
          e.args.positionId.toString(),
        );
      if ('listingId' in e.args)
        result.listingKey = entityKey(
          m.chainId,
          m.market,
          e.args.listingId.toString(),
        );
    } catch {
      /* unrelated log must not invent success metadata */
    }
  }
  return result;
}
