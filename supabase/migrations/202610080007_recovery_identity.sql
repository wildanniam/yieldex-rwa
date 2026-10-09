-- Preserve obsolete unsigned work without blocking newer reviewed reports.
alter table app_private.worker_outbox drop constraint worker_outbox_status_check;
alter table app_private.worker_outbox add constraint worker_outbox_status_check
 check(status in('READY','SUBMITTING','PENDING','CONFIRMED','HELD','SUPERSEDED'));
alter table app_private.worker_outbox add constraint superseded_must_be_unsigned
 check(status<>'SUPERSEDED' or (signer is null and nonce is null and transaction_hash is null and signed_transaction is null));
alter table app_private.worker_outbox drop constraint worker_outbox_idempotency_key_key;
create unique index worker_active_idempotency_key on app_private.worker_outbox(idempotency_key)
 where status<>'SUPERSEDED';

-- Only populated after RPC identity checks; null preserves legacy/unsubmitted rows.
alter table public.transaction_intents add column transaction_nonce public.uint64;
