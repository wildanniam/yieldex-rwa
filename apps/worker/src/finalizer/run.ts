import { readFile } from 'node:fs/promises';
import { createPublicClient, createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry, sepolia } from 'viem/chains';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { createDatabase } from '../database.js';
import { RegistryOutbox } from './outbox.js';
import { ReviewedReconciler } from './reconcile.js';
import { parseReviewedFile } from './review-file.js';
async function main() {
  const {
    DATABASE_URL,
    MARKETPLACE_RPC_URL,
    DEPLOYMENT_MANIFEST,
    FINALIZER_PRIVATE_KEY,
  } = process.env;
  if (
    !DATABASE_URL ||
    !MARKETPLACE_RPC_URL ||
    !DEPLOYMENT_MANIFEST ||
    !FINALIZER_PRIVATE_KEY ||
    !/^0x[0-9a-fA-F]{64}$/.test(FINALIZER_PRIVATE_KEY)
  )
    throw new Error('Finalizer requires explicit private server configuration');
  const publicClient = createPublicClient({
      transport: http(MARKETPLACE_RPC_URL, { retryCount: 0, timeout: 8000 }),
    }),
    manifest = validateDeploymentManifest(
      JSON.parse(await readFile(DEPLOYMENT_MANIFEST, 'utf8')),
      await publicClient.getChainId(),
    );
  if (![31337, 11155111].includes(manifest.chainId))
    throw new Error('Only demo chains allowed');
  const db = createDatabase(DATABASE_URL),
    wallet = createWalletClient({
      account: privateKeyToAccount(FINALIZER_PRIVATE_KEY as Hex),
      chain: manifest.chainId === 31337 ? foundry : sepolia,
      transport: http(MARKETPLACE_RPC_URL, { retryCount: 0, timeout: 8000 }),
    }),
    worker = new RegistryOutbox(
      db,
      new ChainReader(publicClient, manifest),
      wallet,
    );
  try {
    await worker.verify();
    const reviewPath = process.argv[2];
    if (reviewPath) {
      const { policy, report } = parseReviewedFile(
        await readFile(reviewPath, 'utf8'),
      );
      const status = await new ReviewedReconciler(
        new ChainReader(publicClient, manifest),
        worker,
        policy,
      ).step(report);
      console.log(JSON.stringify({ assetId: report.assetId, status }));
      return;
    }
    const jobs =
      await db`select job_id from app_private.worker_outbox where chain_id=${manifest.chainId} and payload->>'registry'=${manifest.registry} and status in('READY','PENDING','SUBMITTING') order by nonce nulls last,job_id limit 20`;
    for (const job of jobs) {
      try {
        const status = await worker.run(job.job_id);
        console.log(JSON.stringify({ jobId: job.job_id, status }));
      } catch {
        console.error(
          JSON.stringify({ jobId: job.job_id, status: 'HELD_FOR_REVIEW' }),
        );
        process.exitCode = 1;
        break;
      }
    }
  } finally {
    await db.end();
  }
}
void main().catch(() => {
  console.error(
    'Finalizer stopped; check private configuration/source and durable outbox. No coverage completion assumed.',
  );
  process.exitCode = 1;
});
