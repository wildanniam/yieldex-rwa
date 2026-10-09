import { decodeEventLog, zeroAddress, type Address, type Hex } from 'viem';
import type postgres from 'postgres';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { ChainReader, safeTimestamp } from '@rwa/shared/chain';
import { validateData } from '@rwa/shared/validation';
import type { AssetEvent, ChainSnapshot } from '@rwa/shared';

export type Database = ReturnType<typeof postgres>;
type Db = Database | postgres.TransactionSql;
type StoredLog = {
  block_number: string;
  block_hash: string;
  transaction_hash: string;
  log_index: number;
  transaction_index: number;
  contract_address: string;
  event_signature: string;
  event_name: string;
  decoded: Record<string, string>;
};
const tables = {
  assets: ['chain_id', 'registry_address', 'asset_id'],
  positions: ['chain_id', 'market_address', 'position_id'],
  listings: ['chain_id', 'market_address', 'listing_id'],
  claim_balances: ['chain_id', 'market_address', 'asset_id', 'account'],
  claim_allocations: [
    'chain_id',
    'market_address',
    'position_id',
    'event_sequence',
    'recipient',
  ],
  asset_events: ['chain_id', 'registry_address', 'asset_id', 'sequence'],
} as const;
const json = (v: unknown) =>
  JSON.stringify(v, (_, x: unknown) =>
    typeof x === 'bigint' ? x.toString() : x,
  );
async function upsert(
  db: Db,
  table: keyof typeof tables,
  row: Record<string, unknown>,
) {
  const keys: readonly string[] = tables[table];
  const columns = Object.keys(row);
  // Table and column names are authored below, never accepted from HTTP/model data.
  if (!columns.every((k) => /^[a-z_]+$/.test(k)))
    throw new Error('Unsafe SQL identifier');
  await db.unsafe(
    `insert into public.${table} select * from jsonb_populate_record(null::public.${table},$1::jsonb) on conflict (${keys.join(',')}) do update set ${columns
      .filter((k) => !keys.includes(k))
      .map((k) => `${k}=excluded.${k}`)
      .join(',')}`,
    [JSON.parse(json(row))],
  );
}
export class FinalizedIndexer {
  constructor(
    readonly db: Database,
    readonly reader: ChainReader,
    readonly batchSize = 64,
  ) {
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 256)
      throw new Error('Invalid batch size');
  }
  async runOnce(): Promise<{
    status: 'INDEXED' | 'IDLE' | 'REBUILDING';
    through: string;
  }> {
    const { db, reader } = this,
      m = reader.manifest;
    await reader.verify();
    const head = await reader.snapshot('finalized');
    const deployment = BigInt(m.deploymentBlock);
    // A DB advisory lock prevents concurrent workers from committing different cursors.
    return await db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${`${m.chainId}:${m.market}`},0))`;
      await sql`insert into public.chain_cursors(chain_id,contract_address,deployment_block,next_block,finalized_head) values(${m.chainId},${m.market},${m.deploymentBlock},${m.deploymentBlock},0) on conflict do nothing`;
      const [cursor] =
        await sql`select * from public.chain_cursors where chain_id=${m.chainId} and contract_address=${m.market} for update`;
      if (cursor!.state === 'REBUILDING')
        return {
          status: 'REBUILDING' as const,
          through: String(cursor!.next_block),
        };
      const from = BigInt(cursor!.next_block);
      if (from > deployment) {
        const prior = await reader.client.getBlock({ blockNumber: from - 1n });
        if (
          prior.hash !== cursor!.last_block_hash ||
          BigInt(head.blockNumber) < from - 1n
        ) {
          await sql`update public.chain_cursors set state='REBUILDING' where chain_id=${m.chainId}`;
          return {
            status: 'REBUILDING' as const,
            through: (from - 1n).toString(),
          };
        }
      }
      if (from > BigInt(head.blockNumber))
        return { status: 'IDLE' as const, through: (from - 1n).toString() };
      const to =
        from + BigInt(this.batchSize) - 1n < BigInt(head.blockNumber)
          ? from + BigInt(this.batchSize) - 1n
          : BigInt(head.blockNumber);
      // Hydration cannot read pre-deployment addresses. Wait for seed registration too.
      const targetBlock = await reader.client.getBlock({ blockNumber: to });
      const snapshot: ChainSnapshot = {
        ...head,
        blockNumber: to.toString(),
        blockHash: targetBlock.hash!,
        blockTimestamp: safeTimestamp(targetBlock.timestamp),
        indexerStatus:
          to < BigInt(head.blockNumber) || head.indexerStatus === 'LAGGING'
            ? 'LAGGING'
            : 'HEALTHY',
      };
      let parent = cursor!.last_block_hash as string | null;
      for (let n = from; n <= to; n++) {
        const b = await reader.client.getBlock({ blockNumber: n });
        if (!b.hash || (parent !== null && b.parentHash !== parent))
          throw new Error('Non-canonical block ancestry');
        await sql`update public.chain_blocks set canonical=false where chain_id=${m.chainId} and block_number=${n.toString()} and block_hash<>${b.hash}`;
        await sql`insert into public.chain_blocks(chain_id,block_number,block_hash,parent_hash,block_timestamp,canonical) values(${m.chainId},${n.toString()},${b.hash},${b.parentHash},${b.timestamp.toString()},true) on conflict(chain_id,block_number,block_hash) do update set canonical=true`;
        parent = b.hash;
      }
      const logs = await reader.client.getLogs({
        address: [m.registry as Address, m.market as Address],
        fromBlock: from,
        toBlock: to,
      });
      for (const l of logs) {
        if (
          l.removed ||
          l.blockNumber === null ||
          !l.blockHash ||
          !l.transactionHash ||
          l.logIndex === null ||
          l.transactionIndex === null
        )
          throw new Error('Incomplete finalized log');
        const decoded = decodeEventLog({
          abi: [...abi.CorporateActionRegistry, ...abi.IncomeRightsMarket],
          data: l.data,
          topics: l.topics,
          strict: true,
        });
        const [block] =
          await sql`select block_hash from public.chain_blocks where chain_id=${m.chainId} and block_number=${l.blockNumber.toString()} and canonical`;
        if (block?.block_hash !== l.blockHash)
          throw new Error('Log block mismatch');
        await sql`insert into public.chain_logs(chain_id,block_hash,transaction_hash,log_index,block_number,contract_address,transaction_index,event_signature,event_name,decoded,canonical) values(${m.chainId},${l.blockHash},${l.transactionHash},${l.logIndex},${l.blockNumber.toString()},${l.address.toLowerCase()},${l.transactionIndex},${l.topics[0]!},${decoded.eventName},${sql.json(JSON.parse(json(decoded.args)))},true) on conflict(chain_id,block_hash,transaction_hash,log_index) do update set canonical=true,removed=false`;
      }
      const all = await sql<
        StoredLog[]
      >`select * from public.chain_logs where chain_id=${m.chainId} and contract_address in(${m.market},${m.registry}) and canonical and block_number<=${to.toString()} order by block_number,transaction_index,log_index`;
      await this.hydrate(sql, all, snapshot);
      await sql`insert into app_private.read_snapshots(chain_id,market_address,block_number,block_hash,snapshot,payload)
    select ${m.chainId},${m.market},${snapshot.blockNumber},${snapshot.blockHash},${sql.json(JSON.parse(json(snapshot)))},jsonb_build_object(
      'assets',(select coalesce(jsonb_agg(dto),'[]') from public.assets where chain_id=${m.chainId} and registry_address=${m.registry}),
      'positions',(select coalesce(jsonb_agg(dto),'[]') from public.positions where chain_id=${m.chainId} and market_address=${m.market}),
      'listings',(select coalesce(jsonb_agg(dto),'[]') from public.listings where chain_id=${m.chainId} and market_address=${m.market}),
      'events',(select coalesce(jsonb_agg(record),'[]') from public.asset_events where chain_id=${m.chainId} and registry_address=${m.registry}),
      'claims',(select coalesce(jsonb_agg(jsonb_build_object('assetId',asset_id,'account',account,'shares',claim_shares::text)),'[]') from public.claim_balances where chain_id=${m.chainId} and market_address=${m.market})
    ) on conflict do nothing`;
      await sql`delete from app_private.read_snapshots where chain_id=${m.chainId} and market_address=${m.market} and created_at<now()-interval '10 minutes' and block_number<${snapshot.blockNumber}`;
      if (
        (await reader.client.getBlock({ blockNumber: to })).hash !==
        snapshot.blockHash
      )
        throw new Error('Block changed while hydrating');
      await sql`update public.chain_cursors set next_block=${(to + 1n).toString()},last_block_hash=${snapshot.blockHash},finalized_head=${head.blockNumber} where chain_id=${m.chainId} and contract_address=${m.market}`;
      return { status: 'INDEXED' as const, through: to.toString() };
    });
  }
  /** Operator recovery after a verified hash conflict; retains orphaned raw logs.
   * Full replay is intentionally simpler for the bounded hackathon dataset.
   */
  async rebuildFromBaseline() {
    const m = this.reader.manifest;
    await this.db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${`${m.chainId}:${m.market}`},0))`;
      const [c] =
        await sql`select state from public.chain_cursors where chain_id=${m.chainId} and contract_address=${m.market} for update`;
      if (c?.state !== 'REBUILDING')
        throw new Error('Rebuild requires detected conflict');
      for (const t of [
        'claim_allocations',
        'claim_balances',
        'listings',
        'positions',
      ] as const)
        await sql.unsafe(
          `delete from public.${t} where chain_id=$1 and market_address=$2`,
          [m.chainId, m.market],
        );
      await sql`delete from app_private.read_snapshots where chain_id=${m.chainId} and market_address=${m.market}`;
      await sql`delete from public.asset_events where chain_id=${m.chainId} and registry_address=${m.registry}`;
      await sql`delete from public.assets where chain_id=${m.chainId} and registry_address=${m.registry}`;
      await sql`update public.chain_logs set canonical=false,removed=true where chain_id=${m.chainId} and contract_address in(${m.market},${m.registry})`;
      // Replay reconciles each canonical block against RPC without orphaning unrelated valid history.
      await sql`update public.chain_cursors set next_block=deployment_block,last_block_hash=null,finalized_head=0,state='READY' where chain_id=${m.chainId} and contract_address=${m.market}`;
    });
  }
  private async hydrate(
    sql: postgres.TransactionSql,
    logs: StoredLog[],
    s: ChainSnapshot,
  ) {
    const m = this.reader.manifest,
      chain_id = m.chainId,
      market_address = m.market,
      registry_address = m.registry,
      base = { chain_id, block_number: s.blockNumber, block_hash: s.blockHash };
    const registered = new Set(
      logs
        .filter((l) => l.event_name === 'AssetRegistered')
        .map((l) => l.decoded.assetId),
    );
    for (const entry of m.assets.filter((a) => registered.has(a.assetId))) {
      const a = await this.reader.asset(entry.assetId, s);
      await upsert(sql, 'assets', {
        ...base,
        registry_address,
        asset_id: a.assetId,
        token_address: a.token.address,
        adapter_address: a.adapterAddress,
        enabled: a.newPositionsEnabled,
        safety_state: a.safetyState,
        snapshot_hash: a.assetHeadHash,
        event_count: a.eventCount,
        finalized_through: a.finalizedThrough,
        dto: a,
      });
    }
    const createdPositions = logs.filter(
      (l) => l.event_name === 'PositionCreated',
    );
    const accounts = new Set<string>();
    for (const l of createdPositions) {
      const p = await this.reader.position(BigInt(l.decoded.positionId!), s);
      accounts.add(p.principalOwner);
      if (p.rightsOwner) accounts.add(p.rightsOwner);
      await upsert(sql, 'positions', {
        ...base,
        market_address,
        position_id: p.positionId,
        registry_address,
        asset_id: p.assetKey.split(':').at(-1),
        principal_owner: p.principalOwner,
        rights_owner: p.rightsOwner,
        principal_shares: p.principalShares,
        income_bps: p.incomeBps,
        duration_seconds: p.durationSeconds,
        created_at: p.createdAt,
        start_at: p.startAt,
        end_at: p.endAt,
        cancelled_at: p.cancelledAt,
        activation_event_cursor: p.activationEventCursor,
        event_cursor: p.eventCursor,
        current_listing_id: p.currentListingId,
        stored_state: p.storedState,
        dto: p,
      });
    }
    for (const l of logs.filter((l) => l.event_name === 'ListingCreated')) {
      const { listing: p } = await this.reader.listing(
        BigInt(l.decoded.listingId!),
        BigInt(l.block_number),
        s,
      );
      await upsert(sql, 'listings', {
        ...base,
        market_address,
        listing_id: p.listingId,
        position_id: p.positionKey.split(':').at(-1),
        kind: p.kind,
        seller: p.seller,
        payment_token: p.paymentToken.address,
        price_atomic: p.priceAtomic,
        created_at: p.createdAt,
        expires_at: p.expiresAt,
        stored_status: p.storedStatus,
        terms_hash: p.termsHash,
        dto: p,
      });
    }
    for (const l of logs) {
      if (l.event_name === 'IncomeAllocated') {
        const d = l.decoded,
          allocations = new Map<string, { shares: bigint; role: string }>();
        for (const [owner, value, role] of [
          [d.principalOwner, d.principalIncomeShares, 'PRINCIPAL'],
          [d.rightsOwner, d.rightsIncomeShares, 'RIGHTS'],
        ] as const) {
          if (!owner || owner === zeroAddress) continue;
          const who = owner.toLowerCase();
          accounts.add(who);
          const prior = allocations.get(who);
          allocations.set(who, {
            shares: BigInt(value!) + (prior?.shares ?? 0n),
            role: prior ? 'BOTH' : role,
          });
        }
        for (const [recipient, a] of allocations)
          await upsert(sql, 'claim_allocations', {
            chain_id,
            market_address,
            position_id: d.positionId,
            event_sequence: d.sequence,
            recipient,
            shares: a.shares.toString(),
            role: a.role,
          });
      }
      if (l.event_name === 'RightsOwnerChanged')
        for (const k of ['previousOwner', 'newOwner']) {
          const a = l.decoded[k];
          if (a && a !== zeroAddress) accounts.add(a.toLowerCase());
        }
      if (l.event_name === 'IncomeClaimed')
        accounts.add(l.decoded.beneficiary!.toLowerCase());
      if (l.event_name === 'AssetEventFinalized') {
        const d = l.decoded;
        const e = await this.reader.client.readContract({
          address: registry_address as Address,
          abi: abi.CorporateActionRegistry,
          functionName: 'getAssetEvent',
          args: [d.assetId as Hex, BigInt(d.sequence!)],
          blockNumber: BigInt(s.blockNumber),
        });
        const record: AssetEvent = {
          eventId: e.eventId,
          assetKey: `eip155:${chain_id}:${registry_address}:${d.assetId}`,
          sequence: e.sequence.toString(),
          effectiveAt: safeTimestamp(e.effectiveAt),
          kind: (['DIVIDEND', 'SPLIT', 'REVERSE_SPLIT', 'NO_INCOME'] as const)[
            e.kind
          ]!,
          multiplierBefore: e.multiplierBefore.toString(),
          multiplierAfter: e.multiplierAfter.toString(),
          issuerNonceAfter: e.issuerNonceAfter.toString(),
          historyIndex: e.historyIndex.toString(),
          sourceOccurrenceKey: e.sourceOccurrenceKey,
          sourceRevision: e.sourceRevision,
          evidenceHash: e.evidenceHash,
          recordedTransactionHash: l.transaction_hash,
          snapshot: s,
        };
        if (!validateData('domain.AssetEvent', record).success)
          throw new Error('Invalid finalized event');
        await upsert(sql, 'asset_events', {
          ...base,
          registry_address,
          asset_id: d.assetId,
          sequence: d.sequence,
          event_id: e.eventId,
          record,
        });
      }
    }
    for (const a of m.assets.filter((a) => registered.has(a.assetId)))
      for (const account of accounts) {
        const c = await this.reader.claim(a.assetId, account, s);
        await upsert(sql, 'claim_balances', {
          ...base,
          market_address,
          asset_id: a.assetId,
          account,
          claim_shares: c.claimShares,
        });
      }
  }
}
