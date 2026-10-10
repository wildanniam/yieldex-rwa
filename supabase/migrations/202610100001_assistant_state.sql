-- Private, expiring assistant state. Never exposed through PostgREST or guest history.
create table app_private.assistant_threads (
 id uuid primary key,
 principal text not null,
 conversation_id uuid unique references public.conversations(id) on delete cascade,
 messages jsonb not null default '[]',
 expires_at timestamptz not null,
 run_id uuid,
 lease_until timestamptz,
 stop_requested boolean not null default false,
 version bigint not null default 0,
 check(jsonb_typeof(messages)='array'),
 check(octet_length(messages::text) <= 1048576)
);
create index assistant_threads_expiry on app_private.assistant_threads(expires_at);
create table app_private.assistant_budgets (
 bucket text primary key,
 window_start timestamptz not null,
 requests integer not null
);
alter table app_private.assistant_threads enable row level security;
alter table app_private.assistant_budgets enable row level security;
revoke all on app_private.assistant_threads,app_private.assistant_budgets from public,anon,authenticated;
grant all on app_private.assistant_threads,app_private.assistant_budgets to service_role;
