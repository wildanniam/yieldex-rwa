alter table public.conversations add column updated_at timestamptz not null default now();
update public.conversations set updated_at=created_at;
alter table public.conversations add constraint conversation_title_bounds check(length(title) between 1 and 120) not valid;
create table app_private.conversation_requests (
 user_id uuid not null references auth.users on delete cascade, idempotency_key uuid not null,
 conversation_id uuid references public.conversations on delete set null,
 request_hash text not null, created_at timestamptz not null default now(),primary key(user_id,idempotency_key)
);
alter table app_private.conversation_requests enable row level security;
revoke all on app_private.conversation_requests from public,anon,authenticated;
grant all on app_private.conversation_requests to service_role;
create index conversations_owner_order on public.conversations(user_id,updated_at desc,id desc);
create index messages_conversation_order on public.messages(conversation_id,created_at,id);
