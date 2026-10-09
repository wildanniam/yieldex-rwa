-- Native provider verifies signatures. App admission additionally requires a
-- server-issued one-use challenge; direct provider replay cannot bypass RLS.
create table app_private.auth_challenges (
 id uuid primary key, wallet public.evm_address not null, chain_id bigint not null check(chain_id in(31337,11155111)),
 nonce text not null unique, message text not null check(length(message)<=4096),
 expires_at timestamptz not null, consumed_at timestamptz
);
create table app_private.verified_sessions (
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 wallet public.evm_address not null, chain_id bigint not null check(chain_id in(31337,11155111)),
 expires_at timestamptz not null, revoked_at timestamptz,
 challenge_id uuid not null unique references app_private.auth_challenges(id)
);
alter table app_private.auth_challenges enable row level security;
alter table app_private.verified_sessions enable row level security;
grant all on app_private.auth_challenges,app_private.verified_sessions to service_role;
create function public.has_verified_web3_session() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app_private.verified_sessions s
  where s.user_id=auth.uid() and s.session_id::text=auth.jwt()->>'session_id'
  and s.expires_at>now() and s.revoked_at is null)
$$;
revoke all on function public.has_verified_web3_session() from public,anon;
grant execute on function public.has_verified_web3_session() to authenticated;
drop policy own_identity on public.wallet_identities;
drop policy own_conversation on public.conversations;
drop policy own_message on public.messages;
drop policy own_intent on public.transaction_intents;
create policy own_identity on public.wallet_identities for select to authenticated using(auth.uid()=user_id and public.has_verified_web3_session());
create policy own_conversation on public.conversations for select to authenticated using(auth.uid()=user_id and public.has_verified_web3_session());
create policy own_message on public.messages for select to authenticated using(auth.uid()=user_id and public.has_verified_web3_session() and exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=auth.uid()));
create policy own_intent on public.transaction_intents for select to authenticated using(auth.uid()=user_id and public.has_verified_web3_session());
