-- Private idempotency receipt tracking. Never grants financial entitlement.
create table app_private.intent_submissions (
 user_id uuid not null references auth.users on delete cascade,
 idempotency_key uuid not null, intent_id uuid not null references public.transaction_intents on delete cascade,
 request_hash public.hash32 not null, transaction_hash public.hash32 not null,
 created_at timestamptz not null default now(), primary key(user_id,idempotency_key)
);
alter table app_private.intent_submissions enable row level security;
revoke all on app_private.intent_submissions from public,anon,authenticated;
grant all on app_private.intent_submissions to service_role;
