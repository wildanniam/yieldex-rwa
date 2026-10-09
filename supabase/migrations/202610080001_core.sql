-- Canonical read model is a cache of chain state; no client can mutate financial projections.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to service_role;
create domain public.evm_address as text check(value ~ '^0x[0-9a-f]{40}$' and value <> '0x0000000000000000000000000000000000000000');
create domain public.hash32 as text check(value ~ '^0x[0-9a-f]{64}$');
create domain public.uint256 as numeric check(value >= 0 and value = trunc(value) and value <= 115792089237316195423570985008687907853269984665640564039457584007913129639935);
create domain public.uint64 as numeric check(value >= 0 and value = trunc(value) and value <= 18446744073709551615);

create table public.chain_cursors (
 chain_id bigint not null check(chain_id>0), contract_address public.evm_address not null,
 deployment_block public.uint64 not null, next_block public.uint64 not null, last_block_hash public.hash32,
 finalized_head public.uint64 not null, state text not null default 'READY' check(state in('READY','REBUILDING')),
 primary key(chain_id,contract_address), check(next_block>=deployment_block)
);
create table public.chain_blocks (
 chain_id bigint not null check(chain_id>0), block_number public.uint64 not null, block_hash public.hash32 not null,
 parent_hash public.hash32 not null, block_timestamp public.uint64 not null, canonical boolean not null,
 primary key(chain_id,block_number,block_hash)
);
create unique index chain_blocks_canonical on public.chain_blocks(chain_id,block_number) where canonical;
create table public.chain_logs (
 chain_id bigint not null check(chain_id>0), block_hash public.hash32 not null, transaction_hash public.hash32 not null,
 log_index integer not null check(log_index>=0), block_number public.uint64 not null, contract_address public.evm_address not null,
 transaction_index integer not null check(transaction_index>=0), event_signature public.hash32 not null, event_name text not null,
 decoded jsonb not null, removed boolean not null default false, canonical boolean not null,
 primary key(chain_id,block_hash,transaction_hash,log_index),
 foreign key(chain_id,block_number,block_hash) references public.chain_blocks(chain_id,block_number,block_hash)
);
create unique index chain_logs_canonical on public.chain_logs(chain_id,transaction_hash,log_index) where canonical;
create table public.assets (
 chain_id bigint not null check(chain_id>0), registry_address public.evm_address not null, asset_id public.hash32 not null,
 token_address public.evm_address not null, adapter_address public.evm_address not null, enabled boolean not null,
 safety_state text not null check(safety_state in('NORMAL','ACCOUNTING_QUARANTINED','TRANSFER_QUARANTINED')),
 snapshot_hash public.hash32 not null, event_count public.uint64 not null, finalized_through public.uint64 not null,
 block_number public.uint64 not null, block_hash public.hash32 not null, dto jsonb not null,
 primary key(chain_id,registry_address,asset_id), unique(chain_id,registry_address,token_address)
);
create table public.asset_events (
 chain_id bigint not null, registry_address public.evm_address not null, asset_id public.hash32 not null,
 sequence public.uint64 not null check(sequence>0), event_id public.hash32 not null, record jsonb not null,
 block_number public.uint64 not null, block_hash public.hash32 not null,
 primary key(chain_id,registry_address,asset_id,sequence), unique(chain_id,registry_address,event_id),
 foreign key(chain_id,registry_address,asset_id) references public.assets
);
create table public.positions (
 chain_id bigint not null, market_address public.evm_address not null, position_id public.uint256 not null check(position_id>0),
 registry_address public.evm_address not null, asset_id public.hash32 not null,
 principal_owner public.evm_address not null, rights_owner public.evm_address,
 principal_shares public.uint256 not null, income_bps integer not null check(income_bps between 1 and 10000),
 duration_seconds public.uint64 not null check(duration_seconds between 60 and 31536000),
 created_at public.uint64 not null, start_at public.uint64, end_at public.uint64, cancelled_at public.uint64,
 activation_event_cursor public.uint64 not null, event_cursor public.uint64 not null,
 current_listing_id public.uint256 not null check(current_listing_id>0),
 stored_state text not null check(stored_state in('OFFERED','ACTIVE','SETTLED','CANCELLED','RELEASED')),
 block_number public.uint64 not null, block_hash public.hash32 not null, dto jsonb not null,
 primary key(chain_id,market_address,position_id), foreign key(chain_id,registry_address,asset_id) references public.assets,
 check(event_cursor>=activation_event_cursor),
 check((start_at is null and end_at is null and rights_owner is null) or (start_at is not null and end_at=start_at+duration_seconds and rights_owner is not null)),
 check(stored_state not in('ACTIVE','SETTLED') or start_at is not null),
 check(stored_state not in('OFFERED','CANCELLED') or start_at is null),
 check(stored_state<>'CANCELLED' or cancelled_at is not null),
 check(stored_state<>'RELEASED' or principal_shares=0)
);
create table public.listings (
 chain_id bigint not null, market_address public.evm_address not null, listing_id public.uint256 not null check(listing_id>0),
 position_id public.uint256 not null, kind text not null check(kind in('PRIMARY','SECONDARY')),
 seller public.evm_address not null, payment_token public.evm_address not null, price_atomic public.uint256 not null check(price_atomic>0),
 created_at public.uint64 not null, expires_at public.uint64 not null check(expires_at>created_at),
 stored_status text not null check(stored_status in('OPEN','FILLED','CANCELLED')), terms_hash public.hash32 not null,
 block_number public.uint64 not null, block_hash public.hash32 not null, dto jsonb not null,
 primary key(chain_id,market_address,listing_id), foreign key(chain_id,market_address,position_id) references public.positions
);
create index listings_search on public.listings(chain_id,market_address,kind,stored_status,payment_token,price_atomic,listing_id);
create table public.claim_balances (
 chain_id bigint not null, market_address public.evm_address not null, asset_id public.hash32 not null,
 account public.evm_address not null, claim_shares public.uint256 not null,
 block_number public.uint64 not null, block_hash public.hash32 not null,
 primary key(chain_id,market_address,asset_id,account)
);
create table public.claim_allocations (
 chain_id bigint not null, market_address public.evm_address not null, position_id public.uint256 not null,
 event_sequence public.uint64 not null check(event_sequence>0), recipient public.evm_address not null,
 shares public.uint256 not null, role text not null check(role in('PRINCIPAL','RIGHTS','BOTH')),
 primary key(chain_id,market_address,position_id,event_sequence,recipient),
 foreign key(chain_id,market_address,position_id) references public.positions
);
create table public.wallet_identities (
 user_id uuid not null references auth.users on delete cascade, chain_namespace text not null check(chain_namespace='eip155'),
 wallet_address public.evm_address not null, primary key(user_id,chain_namespace,wallet_address), unique(chain_namespace,wallet_address)
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 created_at timestamptz not null default now(), title text not null default '', unique(id,user_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null, user_id uuid not null,
 client_message_id uuid not null, role text not null check(role in('user','assistant','tool','system')),
 content jsonb not null, tool_result_refs jsonb not null default '[]', created_at timestamptz not null default now(),
 foreign key(conversation_id,user_id) references public.conversations(id,user_id) on delete cascade,
 unique(conversation_id,client_message_id)
);
create table public.transaction_intents (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 idempotency_key uuid not null, wallet public.evm_address not null, action text not null,
 request_hash public.hash32 not null, preview jsonb not null, expires_at timestamptz not null,
 transaction_hash public.hash32, unique(user_id,idempotency_key)
);
create table app_private.issuer_candidates (
 asset_key text not null, source_event_id text not null, source_revision integer not null check(source_revision>0),
 status text not null check(status in('READY','HELD','COMMITTED')), evidence_hash public.hash32 not null,
 payload jsonb not null, observed_at timestamptz not null default now(),
 primary key(asset_key,source_event_id,source_revision)
);
create table app_private.worker_outbox (
 job_id uuid primary key default gen_random_uuid(), idempotency_key text not null unique, command_hash public.hash32 not null,
 chain_id bigint not null check(chain_id>0), token public.evm_address not null, status text not null check(status in('READY','SUBMITTING','PENDING','CONFIRMED','HELD')),
 nonce public.uint64, transaction_hash public.hash32, retry_count integer not null default 0 check(retry_count>=0), payload jsonb not null
);
create table app_private.quote_cache (
 request_hash public.hash32 primary key, provider_version text not null, received_at public.uint64 not null,
 expires_at public.uint64 not null, result jsonb not null, check(expires_at>received_at and expires_at<=received_at+10)
);

-- Explicit privileges; financial caches read-only for browsers, all writes via trusted server/worker.
do $$ declare t text; begin
 foreach t in array array['chain_cursors','chain_blocks','chain_logs','assets','asset_events','positions','listings','claim_balances','claim_allocations','wallet_identities','conversations','messages','transaction_intents'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
 foreach t in array array['assets','asset_events','positions','listings','claim_balances','claim_allocations'] loop
  execute format('grant select on public.%I to anon, authenticated',t);
  execute format('create policy public_read on public.%I for select to anon, authenticated using (true)',t);
 end loop;
end $$;
grant select on public.wallet_identities,public.conversations,public.messages,public.transaction_intents to authenticated;
create policy own_identity on public.wallet_identities for select to authenticated using(auth.uid()=user_id);
create policy own_conversation on public.conversations for select to authenticated using(auth.uid()=user_id);
create policy own_message on public.messages for select to authenticated using(auth.uid()=user_id and exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=auth.uid()));
create policy own_intent on public.transaction_intents for select to authenticated using(auth.uid()=user_id);
-- Message roles, tool results and prepared intents are server authored. No direct client INSERT policy.
grant all on all tables in schema app_private to service_role;
alter table app_private.issuer_candidates enable row level security;
alter table app_private.worker_outbox enable row level security;
alter table app_private.quote_cache enable row level security;
