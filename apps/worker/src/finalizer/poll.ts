import { createDatabase } from '../database.js';
import { pollIssuer, recordObservations } from './issuer.js';
// Observation-only CLI: no signer imported or transaction constructed.
const symbol = process.argv[2];
if (!['SPYx', 'AAPLx', 'MSFTx'].includes(symbol ?? ''))
  throw new Error('Use an allowlisted xStock symbol');
const assetKey = process.env.ISSUER_ASSET_KEY;
if (
  !process.env.DATABASE_URL ||
  !assetKey ||
  !/^eip155:[1-9][0-9]*:0x[0-9a-f]{40}:0x[0-9a-f]{64}$/.test(assetKey)
)
  throw new Error('Explicit database and asset mapping required');
const db = createDatabase(process.env.DATABASE_URL);
try {
  const rows = await pollIssuer(symbol as 'SPYx' | 'AAPLx' | 'MSFTx');
  console.log(JSON.stringify(await recordObservations(db, assetKey, rows)));
} catch {
  console.error('Issuer observation failed; no coverage advanced.');
  process.exitCode = 1;
} finally {
  await db.end();
}
