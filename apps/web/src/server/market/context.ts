import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { createPublicClient, http } from 'viem';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { Cursors } from './cursor';
import { MarketReads } from './reads';
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
      CURSOR_SECRET,
    } = process.env;
    if (
      !DATABASE_URL ||
      !MARKETPLACE_RPC_URL ||
      !DEPLOYMENT_MANIFEST ||
      !CURSOR_SECRET
    )
      throw new ApiFailure(
        503,
        'INDEXER_UNAVAILABLE',
        'Deployment backend belum dikonfigurasi.',
      );
    const client = createPublicClient({
      transport: http(MARKETPLACE_RPC_URL, { retryCount: 0, timeout: 8000 }),
    });
    const manifest = validateDeploymentManifest(
      JSON.parse(await readFile(DEPLOYMENT_MANIFEST, 'utf8')),
      await client.getChainId(),
    );
    const reader = new ChainReader(client, manifest);
    await reader.verify();
    const db = postgres(DATABASE_URL, {
      max: 4,
      prepare: false,
      connect_timeout: 8,
      onnotice: () => undefined,
    });
    return {
      reader,
      db,
      reads: new MarketReads(db, manifest, new Cursors(CURSOR_SECRET)),
    };
  })().catch((e) => {
    pending = undefined;
    throw e;
  });
  return pending;
}
