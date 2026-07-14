begin;
select no_plan();
insert into auth.users (id,instance_id,aud,role,encrypted_password,is_anonymous) values
('f1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','',true),
('f1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','',true);
insert into public.questions(id,author_id,category,visibility,stage,closes_at) values
('f2000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','일상','public','active',null),
('f2000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000001','일상','public','active',now()-interval '1 minute');
insert into public.question_options(id,question_id,code,body) values
('f3000000-0000-0000-0000-000000000001','f2000000-0000-0000-0000-000000000001','A','A'),
('f3000000-0000-0000-0000-000000000002','f2000000-0000-0000-0000-000000000001','B','B'),
('f3000000-0000-0000-0000-000000000003','f2000000-0000-0000-0000-000000000002','A','A'),
('f3000000-0000-0000-0000-000000000004','f2000000-0000-0000-0000-000000000002','B','B');
set local role authenticated;
select set_config('request.jwt.claim.sub','f1000000-0000-0000-0000-000000000001',true);
select throws_ok($$insert into public.questions(author_id,category,visibility,stage) values ('f1000000-0000-0000-0000-000000000001','일상','public','test')$$,'42501',null,'direct question insert is denied');
select throws_ok($$insert into public.question_options(question_id,code,body) values ('f2000000-0000-0000-0000-000000000001','A','bypass')$$,'42501',null,'direct option insert is denied');
select throws_ok($$select * from public.create_question(repeat('가',41),'B',null,'일상','public',now()+interval '1 day')$$,'22023',null,'RPC enforces option length');
select throws_ok($$select * from public.create_question('Ａ','A',null,'일상','public',now()+interval '1 day')$$,'22023',null,'RPC rejects Unicode-normalized equivalent options');
select throws_ok($$select * from public.create_question('A','B',repeat('가',121),'일상','public',now()+interval '1 day')$$,'22023',null,'RPC enforces description length');
select throws_ok($$select * from public.create_question('A','B',null,'','public',now()+interval '1 day')$$,'22023',null,'RPC rejects empty category');
select throws_ok($$select * from public.create_question('A','B',null,'일상','public',now()-interval '1 day')$$,'22023',null,'RPC rejects past close time');
select lives_ok($$select * from public.create_question('첫 선택','둘째 선택',null,'일상','public',now()+interval '1 day')$$,'valid question is created through authoritative RPC');
reset role;
select has_table('public','notification_outbox','durable notification outbox exists');
select has_table('public','notification_settings','notification milestone has one database source');
select is((select meaningful_sample_threshold from public.notification_settings where singleton),20,'database owns meaningful sample threshold');
select throws_ok($$select public.enqueue_closed_question_notifications(1)$$,'42501',null,'null JWT role cannot scan closes');
select throws_ok($$select * from public.claim_notification_outbox(1)$$,'42501',null,'null JWT role cannot claim outbox');
select throws_ok($$select public.notification_event_eligible('f1000000-0000-0000-0000-000000000001','question_closed','f2000000-0000-0000-0000-000000000002')$$,'42501',null,'null JWT role cannot inspect notification eligibility');
set local role authenticated;
select set_config('request.jwt.claim.sub','f1000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.cast_vote('f2000000-0000-0000-0000-000000000001','A','f4000000-0000-0000-0000-000000000001')$$,'real first vote succeeds');
select lives_ok($$select public.cast_vote('f2000000-0000-0000-0000-000000000001','A','f4000000-0000-0000-0000-000000000001')$$,'idempotent replay succeeds');
reset role;
select is((select count(*)::integer from public.notification_outbox where question_id='f2000000-0000-0000-0000-000000000001' and event='first_vote'),1,'cast_vote enqueues first vote exactly once');
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select is(public.enqueue_closed_question_notifications(100),1,'close scanner enqueues one new close job');
select is(public.enqueue_closed_question_notifications(100),0,'close scanner is idempotent');
select is((select count(*)::integer from public.claim_notification_outbox(25)),2,'dispatcher atomically claims lifecycle jobs');
reset role;
select * from finish();
rollback;
