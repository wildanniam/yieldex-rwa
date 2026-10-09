alter table app_private.worker_outbox add column signer public.evm_address;
alter table app_private.worker_outbox add column signed_transaction text;
alter table app_private.worker_outbox add column receipt_block public.uint64;
alter table app_private.worker_outbox add column receipt_hash public.hash32;
alter table app_private.worker_outbox add column reason_code text;
create unique index worker_nonce_unique on app_private.worker_outbox(chain_id,signer,nonce) where nonce is not null;
-- Immutable observations preserve same-version HTTP changes as well as new issuer revisions.
create table app_private.issuer_observations (
 asset_key text not null, source_event_id text not null, source_revision integer not null check(source_revision>0),
 payload_hash public.hash32 not null, source_url text not null, payload jsonb not null,
 observed_at timestamptz not null default now(), primary key(asset_key,source_event_id,source_revision,payload_hash)
);
alter table app_private.issuer_observations enable row level security;
revoke all on app_private.issuer_observations from public,anon,authenticated;
grant all on app_private.issuer_observations to service_role;
