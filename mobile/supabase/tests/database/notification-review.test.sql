begin;
select no_plan();

select has_column('public', 'push_tokens', 'installation_id', 'push token has installation identity');
select has_column('public', 'push_tokens', 'revocation_key_hash', 'push token has revocation proof');
select has_column('public', 'notification_deliveries', 'lease_expires_at', 'delivery claim has a lease');
select has_column('public', 'notification_deliveries', 'attempts', 'delivery claim counts attempts');
select has_column('public', 'notification_deliveries', 'ticket_id', 'delivery stores Expo ticket IDs');
select has_function('public', 'replace_push_token', array['uuid','text','text','text[]','text'], 'atomic token replacement RPC exists');
select has_function('public', 'revoke_push_token', array['uuid','text'], 'proof-based revocation RPC exists');
select has_function('public', 'claim_notification_delivery', array['uuid','uuid','text','text'], 'lease claim RPC exists');
select has_function('public', 'get_closed_question_result', array['uuid'], 'closed result RPC exists');

insert into auth.users (id, instance_id, aud, role, encrypted_password, is_anonymous) values
  ('b1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','',true),
  ('b1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','',true),
  ('b1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','',true);
insert into public.questions (id, author_id, category, visibility, stage, closes_at) values
  ('b2000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','test','public','active','2026-07-13T00:00:00Z');
insert into public.question_options (id,question_id,code,body) values
  ('b3000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','A','A'),
  ('b3000000-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000001','B','B');
insert into public.votes (question_id,option_id,user_id,client_action_id) values
  ('b2000000-0000-0000-0000-000000000001','b3000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002','b4000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-0000-0000-000000000001',true);
select lives_ok(
  $$select public.replace_push_token('b5000000-0000-0000-0000-000000000001','ExponentPushToken[first]','android',array['first_vote'],'abcdefghijklmnopqrstuvwxyzABCDEF012345')$$,
  'first account registers an installation token'
);
select is((select enabled_events from public.push_tokens where installation_id='b5000000-0000-0000-0000-000000000001'), array['first_vote']::text[], 'explicit opt-in is retained');
select throws_ok(
  $$insert into public.push_tokens(user_id,token,platform) values ('b1000000-0000-0000-0000-000000000001','ExponentPushToken[bypass]','android')$$,
  '42501', null, 'direct token writes are denied'
);

select set_config('request.jwt.claim.sub','b1000000-0000-0000-0000-000000000002',true);
select lives_ok(
  $$select public.replace_push_token('b5000000-0000-0000-0000-000000000001','ExponentPushToken[second]','android',array['question_closed'],'abcdefghijklmnopqrstuvwxyzABCDEF012345')$$,
  'account switch atomically replaces installation ownership'
);
select is((select count(*)::integer from public.push_tokens where installation_id='b5000000-0000-0000-0000-000000000001'),1,'one installation has one token');
select is((select user_id from public.push_tokens where installation_id='b5000000-0000-0000-0000-000000000001'),'b1000000-0000-0000-0000-000000000002'::uuid,'new account owns installation');
select lives_ok(
  $$select public.replace_push_token('b5000000-0000-0000-0000-000000000001','ExponentPushToken[rolled]','android',array['question_closed'],'abcdefghijklmnopqrstuvwxyzABCDEF012345')$$,
  'token roll replaces the old token without a uniqueness deadlock'
);
select is((select token from public.push_tokens where installation_id='b5000000-0000-0000-0000-000000000001'),'ExponentPushToken[rolled]','rolled token is current');
select throws_ok(
  $$select public.replace_push_token('b5000000-0000-0000-0000-000000000001','ExponentPushToken[hijack]','android',array['first_vote'],'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef012345')$$,
  '42501', null, 'installation ownership cannot be replaced without its revocation proof'
);

reset role;
select ok(public.revoke_push_token('b5000000-0000-0000-0000-000000000001','abcdefghijklmnopqrstuvwxyzABCDEF012345'),'service-side logout revokes with installation proof');
select is((select count(*)::integer from public.push_tokens where installation_id='b5000000-0000-0000-0000-000000000001'),0,'revoked token is removed');

select ok(public.claim_notification_delivery('b1000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','question_closed','ExponentPushToken[claim]'),'new delivery claim succeeds');
select isnt(public.claim_notification_delivery('b1000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','question_closed','ExponentPushToken[claim]'),true,'live claim cannot be duplicated');
update public.notification_deliveries set lease_expires_at=now()-interval '1 second' where token='ExponentPushToken[claim]';
select ok(public.claim_notification_delivery('b1000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','question_closed','ExponentPushToken[claim]'),'stale crash claim is reclaimed');
select is((select attempts from public.notification_deliveries where token='ExponentPushToken[claim]'),2,'reclaim increments attempts');
update public.notification_deliveries set status='dispatch_started', lease_expires_at=now()-interval '1 second' where token='ExponentPushToken[claim]';
select isnt(public.claim_notification_delivery('b1000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','question_closed','ExponentPushToken[claim]'),true,'dispatch-started claim is never automatically resent');
update public.notification_deliveries set status='delivery_unknown' where token='ExponentPushToken[claim]';
select isnt(public.claim_notification_delivery('b1000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','question_closed','ExponentPushToken[claim]'),true,'unknown external delivery is never automatically resent');

set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from public.get_closed_question_result('b2000000-0000-0000-0000-000000000001')),1,'author reads closed result');
select set_config('request.jwt.claim.sub','b1000000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from public.get_closed_question_result('b2000000-0000-0000-0000-000000000001')),1,'voter reads closed result');
select set_config('request.jwt.claim.sub','b1000000-0000-0000-0000-000000000003',true);
select throws_ok(
  $$select * from public.get_closed_question_result('b2000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'unrelated caller cannot read closed result'
);

reset role;
select throws_ok(
  $$insert into public.analytics_events(event_name,properties) values ('question_impression','{"questionId":"person@example.com"}')$$,
  '23514', null, 'database rejects email as question identifier'
);
select throws_ok(
  $$insert into public.analytics_events(event_name,properties) values ('app_opened','{"sessionId":"raw text"}')$$,
  '23514', null, 'database rejects raw text as session identifier'
);

update public.notification_deliveries set status='retry_pending', next_attempt_at=now()-interval '1 second', last_error_code='MessageRateExceeded'
where token='ExponentPushToken[claim]';
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select is((select count(*)::integer from public.claim_notification_retries(25)),1,'due retry is durably claimed once');
select is((select last_error_code from public.notification_deliveries where token='ExponentPushToken[claim]'),null,'retry claim clears the prior transient error atomically');
update public.notification_deliveries set lease_expires_at=now()-interval '1 second', last_error_code='prior-error'
where token='ExponentPushToken[claim]';
select is((select count(*)::integer from public.claim_notification_retries(25)),0,'expired dispatch-started retry with prior error cannot be dispatched twice');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select throws_ok(
  $$select * from public.claim_notification_retries(25)$$,
  '42501', null, 'authenticated clients cannot claim notification retries'
);
reset role;

select * from finish();
rollback;
