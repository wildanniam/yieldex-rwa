-- Real PostgreSQL/RLS checks in one rollback-only transaction. No provider auth success is implied.
begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
insert into auth.sessions(id,user_id) values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111'),('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222');
insert into app_private.auth_challenges(id,wallet,chain_id,nonce,message,expires_at,consumed_at) values('55555555-5555-4555-8555-555555555555','0x1111111111111111111111111111111111111111',31337,'local-a','RLS-only fixture',now()+interval '5 minutes',now()),('66666666-6666-4666-8666-666666666666','0x2222222222222222222222222222222222222222',31337,'local-b','RLS-only fixture',now()+interval '5 minutes',now());
insert into app_private.verified_sessions(session_id,user_id,wallet,chain_id,expires_at,challenge_id) values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','0x1111111111111111111111111111111111111111',31337,now()+interval '1 hour','55555555-5555-4555-8555-555555555555'),('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','0x2222222222222222222222222222222222222222',31337,now()+interval '1 hour','66666666-6666-4666-8666-666666666666');
insert into public.conversations(id,user_id,title) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Alice private'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Bob private');
insert into public.messages(conversation_id,user_id,client_message_id,role,content) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc','assistant','{"text":"Alice only"}'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','dddddddd-dddd-4ddd-8ddd-dddddddddddd','user','{"text":"Bob only"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"session_id":"33333333-3333-4333-8333-333333333333"}',true);
do $$ begin
 if (select count(*) from public.conversations)<>1 then raise exception 'RLS conversation isolation failed'; end if;
 if (select title from public.conversations)<>'Alice private' then raise exception 'RLS wrong owner'; end if;
 if (select count(*) from public.messages)<>1 then raise exception 'RLS message isolation failed'; end if;
 begin insert into public.messages(conversation_id,user_id,client_message_id,role,content) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',gen_random_uuid(),'assistant','{}'); raise exception 'client spoofed assistant'; exception when insufficient_privilege then null; end;
 begin perform * from app_private.worker_outbox; raise exception 'private outbox leaked'; exception when insufficient_privilege then null; end;
 begin delete from public.assets; raise exception 'client mutated financial cache'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"session_id":"44444444-4444-4444-8444-444444444444"}',true);
do $$ begin
 if (select title from public.conversations)<>'Bob private' then raise exception 'wallet switch leaked old data'; end if;
 if (select count(*) from public.messages where conversation_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>0 then raise exception 'cross-user message access'; end if;
end $$;
select set_config('request.jwt.claims','{}',true);
do $$ begin if (select count(*) from public.conversations)<>0 then raise exception 'unadmitted provider session bypassed RLS'; end if; end $$;
set local role anon;
do $$ begin
 begin perform * from public.conversations; raise exception 'anon saw private chats'; exception when insufficient_privilege then null; end;
 perform * from public.assets;
end $$;
reset role;
do $$ begin
 begin perform '-1'::public.uint256; raise exception 'negative shares accepted'; exception when check_violation then null; end;
 begin perform '1.5'::public.uint256; raise exception 'fractional shares accepted'; exception when check_violation then null; end;
 begin perform '115792089237316195423570985008687907853269984665640564039457584007913129639936'::public.uint256; raise exception 'overflow accepted'; exception when check_violation then null; end;
 begin perform '18446744073709551616'::public.uint64; raise exception 'uint64 overflow accepted'; exception when check_violation then null; end;
 begin perform '0x0000000000000000000000000000000000000000'::public.evm_address; raise exception 'zero token accepted'; exception when check_violation then null; end;
 begin insert into public.messages(conversation_id,user_id,client_message_id,role,content) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',gen_random_uuid(),'user','{}'); raise exception 'cross-parent message accepted'; exception when foreign_key_violation then null; end;
 begin insert into public.messages(conversation_id,user_id,client_message_id,role,content) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc','assistant','{}'); raise exception 'duplicate message accepted'; exception when unique_violation then null; end;
 if (select count(*) from pg_tables where schemaname in('public','app_private') and tablename in('assets','positions','messages','conversations','worker_outbox','issuer_candidates','transaction_intents') and rowsecurity)<>7 then raise exception 'RLS disabled'; end if;
end $$;
rollback;
select 'PASS: isolated conversations/messages, role protection, private schema, anonymous reads, numeric/address boundaries, parent ownership and duplicate protection' as result;
