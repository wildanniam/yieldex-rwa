import { readFile } from 'node:fs/promises';
import { createPublicClient, http } from 'viem';
import { ChainReader } from '@rwa/shared/chain';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { createDatabase } from '../database.js';
import { FinalizedIndexer } from './index.js';
async function main() {
  const { DATABASE_URL, MARKETPLACE_RPC_URL, DEPLOYMENT_MANIFEST } =
    process.env;
  if (!DATABASE_URL || !MARKETPLACE_RPC_URL || !DEPLOYMENT_MANIFEST)
    throw new Error('Indexer configuration missing; no jobs executed');
  const client = createPublicClient({
    transport: http(MARKETPLACE_RPC_URL, { retryCount: 0, timeout: 8000 }),
  });
  const manifest = validateDeploymentManifest(
    JSON.parse(await readFile(DEPLOYMENT_MANIFEST, 'utf8')),
    await client.getChainId(),
  );
  const db = createDatabase(DATABASE_URL),
    indexer = new FinalizedIndexer(db, new ChainReader(client, manifest));
  let stopped = false;
  process.once('SIGINT', () => {
    stopped = true;
  });
  process.once('SIGTERM', () => {
    stopped = true;
  });
  try {
    do {
      try {
        const result = await indexer.runOnce();
        console.log(
          JSON.stringify({ service: 'finalized-indexer', ...result }),
        );
        if (result.status === 'REBUILDING') break;
      } catch {
        console.error(
          'Indexer batch failed; cursor was not advanced. Check RPC/DB availability.',
        );
        if (process.argv.includes('--once')) {
          process.exitCode = 1;
          break;
        }
      }
      if (!process.argv.includes('--watch')) break;
      await new Promise((resolve) => setTimeout(resolve, 4000));
    } while (!stopped);
  } finally {
    await db.end();
  }
}
void main().catch(() => {
  console.error(
    'Indexer startup failed; check private configuration and RPC/DB availability.',
  );
  process.exitCode = 1;
});
