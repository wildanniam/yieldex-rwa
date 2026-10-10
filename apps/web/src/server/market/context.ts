import { readFile } from 'node:fs/promises';
import type postgres from 'postgres';
import { createDatabase } from '../database';
import { createPublicClient } from 'viem';
import { marketTransport } from './transport';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { Cursors } from './cursor';
import { MarketReads } from './reads';
import { LiveMarket } from './live';
import { ApiFailure } from '../http';
let pending:
  | Promise<{
      reads: MarketReads;
      reader: ChainReader;
      db: ReturnType<typeof postgres>;
    }>
  | undefined;
export function marketContext() {
  pending ??= (async () => {
    const {
      DATABASE_URL,
      MARKETPLACE_RPC_URL,
      DEPLOYMENT_MANIFEST,
      DEPLOYMENT_MANIFEST_JSON,
      CURSOR_SECRET,
    } = process.env;
    if (
      !DATABASE_URL ||
      !MARKETPLACE_RPC_URL ||
      (!DEPLOYMENT_MANIFEST && !DEPLOYMENT_MANIFEST_JSON) ||
      !CURSOR_SECRET
    )
      throw new ApiFailure(
        503,
        'INDEXER_UNAVAILABLE',
        'Deployment backend belum dikonfigurasi.',
      );
    const rawManifest = JSON.parse(
      DEPLOYMENT_MANIFEST_JSON ||
        (await readFile(DEPLOYMENT_MANIFEST!, 'utf8')),
    );
    const client = createPublicClient({
      transport: marketTransport(
        MARKETPLACE_RPC_URL,
        fetch,
        rawManifest.chainId === 11155111
          ? 'https://ethereum-sepolia-rpc.publicnode.com'
          : undefined,
      ),
    });
    const manifest = validateDeploymentManifest(
      rawManifest,
      await client.getChainId(),
    );
    const reader = new ChainReader(client, manifest);
    await reader.verify();
    const db = createDatabase(DATABASE_URL);
    return {
      reader,
      db,
      reads: new MarketReads(
        db,
        manifest,
        new Cursors(CURSOR_SECRET),
        undefined,
        new LiveMarket(reader).load,
      ),
    };
  })().catch((e) => {
    pending = undefined;
    throw e;
  });
  return pending;
}
