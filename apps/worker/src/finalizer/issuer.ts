import { keccak256, toHex, parseUnits } from 'viem';
import type postgres from 'postgres';
export type IssuerNode = {
  eventId: string;
  version: number;
  xstockSymbol: string;
  caType: string;
  effectiveTimeUtc: string;
  multiplierOld: string;
  multiplierNew: string;
  status: string;
  [key: string]: unknown;
};
export type IssuerObservation = {
  node: IssuerNode;
  payloadHash: string;
  pageHash: string;
  sourceUrl: string;
  observedAt: number;
};
const base = 'https://api.xstocks.fi/api/v2/public/corporate-actions/history';
export function parseIssuerNode(input: unknown, symbol: string): IssuerNode {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('ISSUER_SCHEMA');
  const n = input as IssuerNode;
  if (
    typeof n.eventId !== 'string' ||
    n.eventId.length > 200 ||
    !n.eventId.length ||
    !Number.isSafeInteger(n.version) ||
    n.version < 1 ||
    n.version > 4294967295 ||
    n.xstockSymbol !== symbol ||
    typeof n.caType !== 'string' ||
    typeof n.status !== 'string' ||
    typeof n.effectiveTimeUtc !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(n.effectiveTimeUtc) ||
    !Number.isFinite(Date.parse(n.effectiveTimeUtc))
  )
    throw new Error('ISSUER_SCHEMA');
  for (const v of [n.multiplierOld, n.multiplierNew])
    if (
      typeof v !== 'string' ||
      !/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(v) ||
      parseUnits(v, 18) <= 0n ||
      parseUnits(v, 18) > 2n ** 256n - 1n
    )
      throw new Error('ISSUER_MULTIPLIER');
  return n;
}
export function classification(n: IssuerNode): 'DIVIDEND' | 'HELD' {
  // Only this enum has runtime proof. Unknown, cancelled and unsupported actions stay held.
  return ['Initial', 'Corrected'].includes(n.status) &&
    n.caType === 'CashDividend' &&
    parseUnits(n.multiplierNew, 18) > parseUnits(n.multiplierOld, 18)
    ? 'DIVIDEND'
    : 'HELD';
}
function canonical(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object')
    return (
      '{' +
      Object.entries(v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => JSON.stringify(k) + ':' + canonical(x))
        .join(',') +
      '}'
    );
  return JSON.stringify(v);
}
/** Read-only official source poll. Never turns HTTP Initial/Corrected into issuer finality. */
export async function pollIssuer(
  symbol: 'SPYx' | 'AAPLx' | 'MSFTx',
  fetcher: typeof fetch = fetch,
): Promise<IssuerObservation[]> {
  if (!['SPYx', 'AAPLx', 'MSFTx'].includes(symbol))
    throw new Error('UNSUPPORTED_ISSUER_SYMBOL');
  const all: IssuerObservation[] = [],
    seen = new Set<string>();
  let count: number | undefined,
    firstHash = '';
  async function page(page: number) {
    const u = new URL(base);
    u.search = new URLSearchParams({
      page: String(page),
      pageSize: '100',
      symbol,
      sortBy: 'createdTimeUtc',
      sortOrder: 'asc',
    }).toString();
    const r = await fetcher(u, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RWA-Income-Rights-Hackathon/1.0',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'error',
    });
    if (!r.ok) throw new Error('ISSUER_UNAVAILABLE');
    if (!r.body) throw new Error('ISSUER_SCHEMA');
    let length = 0;
    const parts: Uint8Array[] = [];
    const reader = r.body.getReader();
    for (;;) {
      const v = await reader.read();
      if (v.done) break;
      length += v.value.length;
      if (length > 1048576) {
        await reader.cancel();
        throw new Error('ISSUER_BODY_LIMIT');
      }
      parts.push(v.value);
    }
    const raw = Buffer.concat(parts),
      body = JSON.parse(raw.toString()) as {
        page: {
          currentPage: number;
          pageSize: number;
          totalPages: number;
          totalNodes: number;
          hasNextPage: boolean;
        };
        nodes: unknown[];
      };
    if (
      !body.page ||
      body.page.currentPage !== page ||
      body.page.pageSize !== 100 ||
      !Number.isSafeInteger(body.page.totalNodes) ||
      body.page.totalNodes < 0 ||
      !Number.isSafeInteger(body.page.totalPages) ||
      body.page.totalPages > 10 ||
      typeof body.page.hasNextPage !== 'boolean' ||
      !Array.isArray(body.nodes) ||
      body.nodes.length > 100
    )
      throw new Error('ISSUER_PAGINATION');
    return { body, url: u.href, hash: keccak256(raw) };
  }
  for (let number = 1; number <= 10; number++) {
    const p = await page(number);
    if (count !== undefined && p.body.page.totalNodes !== count)
      throw new Error('ISSUER_SNAPSHOT_CHANGED');
    count = p.body.page.totalNodes;
    if (number === 1) firstHash = p.hash;
    for (const input of p.body.nodes) {
      const node = parseIssuerNode(input, symbol),
        identity = node.eventId + ':' + node.version;
      if (seen.has(identity)) throw new Error('ISSUER_DUPLICATE_PAGE');
      seen.add(identity);
      all.push({
        node,
        payloadHash: keccak256(toHex(canonical(node))),
        pageHash: p.hash,
        sourceUrl: p.url,
        observedAt: Math.floor(Date.now() / 1000),
      });
    }
    if (!p.body.page.hasNextPage) {
      if (all.length !== count) throw new Error('ISSUER_INCOMPLETE');
      if (number > 1 && (await page(1)).hash !== firstHash)
        throw new Error('ISSUER_SNAPSHOT_CHANGED');
      return all;
    }
  }
  throw new Error('ISSUER_PAGE_LIMIT');
}
/** Immutable raw revisions, including same-version changes. Candidates remain held until review. */
export async function recordObservations(
  db: ReturnType<typeof postgres>,
  assetKey: string,
  items: IssuerObservation[],
) {
  return db.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtextextended(${assetKey + ':issuer'},0))`;
    let changes = 0;
    for (const item of items) {
      const n = item.node;
      const inserted =
        await sql`insert into app_private.issuer_observations(asset_key,source_event_id,source_revision,payload_hash,source_url,payload) values(${assetKey},${n.eventId},${n.version},${item.payloadHash},${item.sourceUrl},${sql.json(JSON.parse(JSON.stringify(item)))}) on conflict do nothing returning payload_hash`;
      if (!inserted.length) continue;
      changes++;
      const old =
        await sql`select source_revision,evidence_hash,status from app_private.issuer_candidates where asset_key=${assetKey} and source_event_id=${n.eventId}`;
      if (old.length)
        await sql`update app_private.issuer_candidates set status='HELD' where asset_key=${assetKey} and source_event_id=${n.eventId}`;
      // Original candidate payload is not overwritten if its revision is corrected in place.
      await sql`insert into app_private.issuer_candidates(asset_key,source_event_id,source_revision,status,evidence_hash,payload) values(${assetKey},${n.eventId},${n.version},'HELD',${item.payloadHash},${sql.json(JSON.parse(JSON.stringify(item)))}) on conflict do nothing`;
    }
    return { observed: items.length, newObservations: changes };
  });
}
