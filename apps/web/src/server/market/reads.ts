import type postgres from 'postgres';
import type {
  Asset,
  Listing,
  Position,
  AssetEvent,
  ClaimBalance,
  ListingDetail,
  ChainSnapshot,
  SearchListingsQuery,
} from '@rwa/shared';
import type { DeploymentManifest } from '@rwa/shared/config';
import { normalizeAddress } from '@rwa/shared/config';
import { validateData, type SchemaName } from '@rwa/shared/validation';
import { ApiFailure } from '../http';
import { Cursors, queryHash, type PageCursor } from './cursor';
type Payload = {
  assets: Asset[];
  positions: Position[];
  listings: Listing[];
  events: AssetEvent[];
  claims: { assetId: string; account: string; shares: string }[];
};
const invalid = () =>
  new ApiFailure(400, 'VALIDATION_ERROR', 'Parameter tidak valid.');
const missing = () => new ApiFailure(404, 'NOT_FOUND', 'Data tidak ditemukan.');
const integer = (v: string | null, def: number, max: number) => {
  if (v === null) return def;
  if (!/^[1-9]\d*$/.test(v) || Number(v) > max) throw invalid();
  return Number(v);
};
function params(q: URLSearchParams, allowed: string[]) {
  for (const key of q.keys()) {
    if (
      !allowed.includes(key) ||
      (key !== 'assetId' && q.getAll(key).length > 1)
    )
      throw invalid();
  }
}
const cmp = (a: bigint, b: bigint) => (a === b ? 0 : a < b ? -1 : 1);
export class MarketReads {
  constructor(
    private db: ReturnType<typeof postgres>,
    readonly manifest: DeploymentManifest,
    private cursors: Cursors,
    private now = () => Math.floor(Date.now() / 1000),
  ) {}
  async read(
    path: string[],
    q: URLSearchParams,
    requestId: string,
  ): Promise<unknown> {
    const m = this.manifest,
      meta = {
        schemaVersion: '1.0' as const,
        requestId,
        observedAt: this.now(),
      };
    if (path.join('/') === 'deployments') {
      params(q, []);
      return this.checked('api.DeploymentManifestResponse', {
        meta,
        data: {
          marketplaceChainId: m.chainId,
          marketAddress: m.market,
          registryAddress: m.registry,
          paymentToken: {
            chainId: m.chainId,
            kind: 'ERC20',
            address: m.paymentToken.address,
            name: 'Simulated USD',
            symbol: 'DemoUSD',
            decimals: 6,
            isDemo: true,
          },
          assets: m.assets.map(
            (a) => `eip155:${m.chainId}:${m.registry}:${a.assetId}`,
          ),
          abiVersion: '1.0',
          deploymentBlock: m.deploymentBlock,
        },
      });
    }
    if (path[0] !== 'chains' || path[1] !== String(m.chainId))
      throw new ApiFailure(
        400,
        'UNSUPPORTED_DEPLOYMENT',
        'Chain tidak didukung.',
      );
    const registry = path[2] === 'registries';
    let address: string;
    try {
      address = normalizeAddress(path[3]!);
    } catch {
      throw invalid();
    }
    if (
      address !== (registry ? m.registry : m.market) ||
      (!registry && path[2] !== 'markets')
    )
      throw new ApiFailure(
        400,
        'UNSUPPORTED_DEPLOYMENT',
        'Kontrak tidak didukung.',
      );
    const kind = path[4];
    let search: SearchListingsQuery | undefined;
    if (kind === 'listings' && path.length === 5) {
      params(q, [
        'assetId',
        'market',
        'maxPriceAtomic',
        'maxRemainingDurationSeconds',
        'incomeBpsMin',
        'sort',
        'limit',
        'cursor',
      ]);
      const parsed = validateData('api.SearchListingsQuery', {
        assetIds: q.getAll('assetId'),
        market: q.get('market') ?? 'ANY',
        maxPriceAtomic: q.get('maxPriceAtomic'),
        maxRemainingDurationSeconds: q.has('maxRemainingDurationSeconds')
          ? integer(
              q.get('maxRemainingDurationSeconds'),
              0,
              Number.MAX_SAFE_INTEGER,
            )
          : null,
        incomeBpsMin: q.has('incomeBpsMin')
          ? integer(q.get('incomeBpsMin'), 0, 10000)
          : null,
        sort: q.get('sort') ?? 'NEWEST',
        limit: integer(q.get('limit'), 20, 20),
        cursor: q.get('cursor'),
      });
      if (!parsed.success) throw invalid();
      search = parsed.data;
      if (
        new Set(search.assetIds).size !== search.assetIds.length ||
        search.assetIds.some((id) => !m.assets.some((a) => a.assetId === id))
      )
        throw invalid();
    } else if (kind === 'assets' && path.length === 5)
      params(q, ['limit', 'cursor', 'enabledOnly']);
    else if (kind === 'assets' && path.length === 7 && path[6] === 'events')
      params(q, ['limit', 'cursor']);
    else if (kind === 'accounts' && path.length === 7)
      params(
        q,
        path[6] === 'positions'
          ? ['limit', 'cursor', 'role']
          : ['limit', 'cursor'],
      );
    else params(q, []);
    const normalized = [
      path.map((v, i) => (i === 3 ? address : v)),
      [...q.entries()]
        .filter(([k]) => k !== 'cursor')
        .sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv)),
    ];
    const hash = queryHash(normalized),
      cursor = q.get('cursor')
        ? this.cursors.decode(q.get('cursor')!, hash)
        : null;
    const { payload: p, snapshot: s } = await this.load(cursor);
    const assetByKey = new Map(p.assets.map((a) => [a.assetKey, a])),
      positionByKey = new Map(p.positions.map((a) => [a.positionKey, a]));
    const detail = (l: Listing): ListingDetail => {
      const position = positionByKey.get(l.positionKey),
        asset = position && assetByKey.get(position.assetKey);
      if (!position || !asset)
        throw new ApiFailure(
          503,
          'INDEXER_UNAVAILABLE',
          'Indeks belum lengkap.',
        );
      return { listing: l, position, asset };
    };
    const one = (schema: SchemaName, data: unknown) => {
      if (!data) throw missing();
      return this.checked(schema, { meta, data });
    };
    const page = <T>(
      schema: SchemaName,
      items: T[],
      limit: number,
      key: (x: T) => string[],
    ) => {
      let start = 0;
      if (cursor) {
        start =
          items.findIndex(
            (x) => JSON.stringify(key(x)) === JSON.stringify(cursor.key),
          ) + 1;
        if (start === 0)
          throw new ApiFailure(
            409,
            'CURSOR_INVALIDATED',
            'Urutan cursor tidak tersedia; mulai ulang.',
          );
      }
      const chosen = items.slice(start, start + limit),
        hasMore = start + limit < items.length,
        last = chosen.at(-1);
      const nextCursor =
        hasMore && last
          ? this.cursors.encode({
              v: 1,
              queryHash: hash,
              blockNumber: s.blockNumber,
              blockHash: s.blockHash,
              key: key(last),
              id: key(last).at(-1)!,
              expiresAt: cursor?.expiresAt ?? this.now() + 300,
            })
          : null;
      return this.checked(schema, {
        meta,
        items: chosen,
        pagination: { hasMore, nextCursor },
        snapshot: s,
      });
    };
    if (registry && kind === 'assets') {
      if (path.length === 5) {
        const enabled = q.get('enabledOnly');
        if (enabled !== null && !['true', 'false'].includes(enabled))
          throw invalid();
        return page(
          'api.AssetsPage',
          p.assets
            .filter((a) => enabled !== 'true' || a.newPositionsEnabled)
            .sort((a, b) => a.assetId.localeCompare(b.assetId)),
          integer(q.get('limit'), 100, 100),
          (a) => [a.assetId],
        );
      }
      const a = p.assets.find((a) => a.assetId === path[5]);
      if (!a) throw missing();
      if (path.length === 6) return one('api.AssetResponse', a);
      if (path.length === 7 && path[6] === 'events')
        return page(
          'api.AssetEventsPage',
          p.events
            .filter((e) => e.assetKey === a.assetKey)
            .sort((a, b) => cmp(BigInt(a.sequence), BigInt(b.sequence))),
          integer(q.get('limit'), 100, 100),
          (e) => [e.sequence],
        );
    }
    if (!registry && kind === 'listings') {
      if (path.length === 6) {
        const l = p.listings.find((l) => l.listingId === path[5]);
        return one('api.ListingResponse', l ? detail(l) : null);
      }
      if (search) {
        const f = search;
        const duration = (d: ListingDetail) =>
          d.listing.kind === 'PRIMARY'
            ? d.position.durationSeconds
            : Math.max(0, d.position.endAt! - s.blockTimestamp);
        const items = p.listings
          .filter((l) => l.displayStatus === 'OPEN')
          .map(detail)
          .filter(
            (d) =>
              (f.market === 'ANY' || f.market === d.listing.kind) &&
              (!f.assetIds.length || f.assetIds.includes(d.asset.assetId)) &&
              (f.maxPriceAtomic === null ||
                BigInt(d.listing.priceAtomic) <= BigInt(f.maxPriceAtomic)) &&
              (f.maxRemainingDurationSeconds === null ||
                duration(d) <= f.maxRemainingDurationSeconds) &&
              (f.incomeBpsMin === null ||
                d.position.incomeBps >= f.incomeBpsMin),
          );
        const key = (d: ListingDetail) => [
          f.sort === 'NEWEST'
            ? d.listing.createdBlockNumber
            : f.sort === 'PRICE_ASC'
              ? d.listing.priceAtomic
              : String(duration(d)),
          d.listing.listingId,
        ];
        items.sort((a, b) => {
          const x = key(a),
            y = key(b);
          return (
            (cmp(BigInt(x[0]!), BigInt(y[0]!)) ||
              cmp(BigInt(x[1]!), BigInt(y[1]!))) *
            (f.sort === 'NEWEST' ? -1 : 1)
          );
        });
        return page('api.ListingsPage', items, f.limit, key);
      }
    }
    if (!registry && kind === 'positions' && path.length === 6)
      return one(
        'api.PositionResponse',
        p.positions.find((p) => p.positionId === path[5]),
      );
    if (!registry && kind === 'accounts' && path.length === 7) {
      let who: string;
      try {
        who = normalizeAddress(path[5]!);
      } catch {
        throw invalid();
      }
      if (path[6] === 'positions') {
        const role = q.get('role') ?? 'ANY';
        if (!['ANY', 'PRINCIPAL', 'RIGHTS'].includes(role)) throw invalid();
        return page(
          'api.PositionsPage',
          p.positions
            .filter(
              (p) =>
                (role !== 'RIGHTS' && p.principalOwner === who) ||
                (role !== 'PRINCIPAL' && p.rightsOwner === who),
            )
            .sort((a, b) => cmp(BigInt(a.positionId), BigInt(b.positionId))),
          integer(q.get('limit'), 20, 20),
          (p) => [p.positionId],
        );
      }
      if (path[6] === 'claims') {
        const claims: ClaimBalance[] = p.assets.map((a) => {
          const shares =
            p.claims.find((c) => c.assetId === a.assetId && c.account === who)
              ?.shares ?? '0';
          return {
            assetKey: a.assetKey,
            marketAddress: m.market,
            account: who,
            claimShares: shares,
            claimTokenAmountAtomic:
              a.currentMultiplier === null
                ? null
                : (
                    (BigInt(shares) * BigInt(a.currentMultiplier)) /
                    BigInt(a.multiplierScale)
                  ).toString(),
            snapshot: s,
          };
        });
        return page(
          'api.ClaimsPage',
          claims.sort((a, b) => a.assetKey.localeCompare(b.assetKey)),
          integer(q.get('limit'), 100, 100),
          (c) => [c.assetKey],
        );
      }
    }
    throw missing();
  }
  private checked(schema: SchemaName, value: unknown) {
    if (!validateData(schema, value).success)
      throw new ApiFailure(
        503,
        'INDEXER_UNAVAILABLE',
        'Data indeks tidak valid.',
      );
    return value;
  }
  private async load(
    cursor: PageCursor | null,
  ): Promise<{ payload: Payload; snapshot: ChainSnapshot }> {
    const m = this.manifest;
    return await this.db.begin(
      'isolation level repeatable read read only',
      async (sql) => {
        const [c] =
          await sql`select state from public.chain_cursors where chain_id=${m.chainId} and contract_address=${m.market}`;
        if (!c)
          throw new ApiFailure(
            503,
            'INDEXER_UNAVAILABLE',
            'Indeks belum tersedia.',
          );
        if (c.state === 'REBUILDING')
          throw new ApiFailure(
            503,
            'REBUILDING',
            'Indeks sedang direkonsiliasi.',
          );
        const rows = cursor
          ? await sql`select r.* from app_private.read_snapshots r join public.chain_blocks b using(chain_id,block_number,block_hash) where r.chain_id=${m.chainId} and market_address=${m.market} and r.block_number=${cursor.blockNumber} and r.block_hash=${cursor.blockHash} and b.canonical limit 1`
          : await sql`select r.* from app_private.read_snapshots r join public.chain_blocks b using(chain_id,block_number,block_hash) where r.chain_id=${m.chainId} and market_address=${m.market} and b.canonical order by r.block_number desc limit 1`;
        const row = rows[0];
        if (!row)
          throw new ApiFailure(
            cursor ? 409 : 503,
            cursor ? 'CURSOR_INVALIDATED' : 'INDEXER_UNAVAILABLE',
            'Snapshot tidak tersedia.',
          );
        const snapshot = row.snapshot as ChainSnapshot,
          payload = row.payload as Payload;
        if (
          !validateData('domain.ChainSnapshot', snapshot).success ||
          snapshot.chainId !== m.chainId
        )
          throw new ApiFailure(
            503,
            'INDEXER_UNAVAILABLE',
            'Snapshot tidak valid.',
          );
        // Keep the chain time/source observation; time passing only worsens health.
        if (this.now() - snapshot.blockTimestamp > 1800)
          snapshot.indexerStatus = 'LAGGING';
        for (const [key, schema] of [
          ['assets', 'domain.Asset'],
          ['positions', 'domain.Position'],
          ['listings', 'domain.Listing'],
          ['events', 'domain.AssetEvent'],
        ] as const)
          for (const item of payload[key]) {
            if (
              item.snapshot.blockHash !== snapshot.blockHash ||
              !validateData(schema, item).success
            )
              throw new ApiFailure(
                503,
                'INDEXER_UNAVAILABLE',
                'Snapshot campuran.',
              );
            item.snapshot = snapshot;
          }
        return { payload, snapshot };
      },
    );
  }
}
