-- Immutable per-batch DTO cache lets cursors keep their original pinned block.
-- The normalized tables remain the searchable current projection; old snapshots
-- are retained longer than the 300-second cursor lifetime.
create table app_private.read_snapshots (
 chain_id bigint not null, market_address public.evm_address not null,
 block_number public.uint64 not null, block_hash public.hash32 not null,
 snapshot jsonb not null, payload jsonb not null,
 created_at timestamptz not null default now(),
 primary key(chain_id,market_address,block_number,block_hash)
);
alter table app_private.read_snapshots enable row level security;
grant all on app_private.read_snapshots to service_role;
