begin;

select no_plan();

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, is_anonymous)
values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-one@example.test', '', false),
  ('81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-two@example.test', '', false),
  ('81000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', true);

insert into public.questions (id, author_id, description, category, visibility, stage)
values
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'visible public', 'test', 'public', 'active'),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', 'hidden link', 'test', 'link', 'pending'),
  ('82000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000001', 'public test', 'test', 'public', 'test');
insert into public.question_options (id, question_id, code, body)
values
  ('83000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', 'A', 'public A'),
  ('83000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', 'B', 'public B'),
  ('83000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000002', 'A', 'link A'),
  ('83000000-0000-0000-0000-000000000004', '82000000-0000-0000-0000-000000000002', 'B', 'link B'),
  ('83000000-0000-0000-0000-000000000005', '82000000-0000-0000-0000-000000000003', 'A', 'test A'),
  ('83000000-0000-0000-0000-000000000006', '82000000-0000-0000-0000-000000000003', 'B', 'test B');
insert into public.option_value_weights (id, option_id, value_axis_id, weight)
values ('84000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000003', 'freedom', 1);
insert into public.votes (id, question_id, option_id, user_id, client_action_id)
values
  ('85000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '86000000-0000-0000-0000-000000000001'),
  ('85000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', '86000000-0000-0000-0000-000000000002');
insert into public.user_value_scores (id, user_id, value_axis_id, score)
values
  ('87000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'freedom', 2),
  ('87000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', 'freedom', 3);

set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);

select is((select count(*)::integer from public.questions where id = '82000000-0000-0000-0000-000000000001'), 1, 'active public question is readable');
select throws_ok(
  $$select author_id from public.questions where id = '82000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'authenticated clients cannot select raw question author ids'
);
select is((select count(*)::integer from public.questions where id = '82000000-0000-0000-0000-000000000002'), 0, 'another users link question is hidden');
select is((select count(*)::integer from public.questions where id = '82000000-0000-0000-0000-000000000003'), 0, 'another users public test question is feed-hidden');
select is((select count(*)::integer from public.question_options where question_id = '82000000-0000-0000-0000-000000000002'), 0, 'hidden link options do not leak');
select is((select count(*)::integer from public.option_value_weights where option_id = '83000000-0000-0000-0000-000000000003'), 0, 'hidden link weights do not leak');
select is((select count(*)::integer from public.votes), 1, 'users read only their own votes');
select is((select count(*)::integer from public.user_value_scores), 1, 'users read only their own scores');
select is((select count(*)::integer from public.profiles), 1, 'users read only their own profile');

select throws_ok(
  $$insert into public.questions (id, author_id, description, category, visibility, stage)
    values ('82000000-0000-0000-0000-000000000010', '81000000-0000-0000-0000-000000000002', 'valid public', 'test', 'public', 'test')$$,
  '42501', null, 'direct own-question insert cannot bypass create RPC'
);
select throws_ok(
  $$insert into public.questions (id, author_id, description, category, visibility, stage)
    values ('82000000-0000-0000-0000-000000000011', '81000000-0000-0000-0000-000000000002', 'valid link', 'test', 'link', 'pending')$$,
  '42501', null, 'direct link insert cannot bypass create RPC'
);
select throws_ok(
  $$insert into public.questions (id, author_id, description, category, visibility, stage)
    values ('82000000-0000-0000-0000-000000000012', '81000000-0000-0000-0000-000000000002', 'bypass', 'test', 'public', 'active')$$,
  '42501', null, 'clients cannot create active public questions'
);
select throws_ok(
  $$update public.questions set stage = 'active' where id = '82000000-0000-0000-0000-000000000010'$$,
  '42501', null, 'clients cannot transition their own question stage'
);
select throws_ok(
  $$update public.questions set description = 'hijacked' where id = '82000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'a visible question from another author cannot be updated'
);
select throws_ok(
  $$delete from public.questions where id = '82000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'a visible question from another author cannot be deleted'
);
select is((select description from public.questions where id = '82000000-0000-0000-0000-000000000001'), 'visible public', 'visible question remains unchanged');

select throws_ok(
  $$insert into public.votes (question_id, option_id, user_id, client_action_id)
    values ('82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000002', '86000000-0000-0000-0000-000000000010')$$,
  '42501', null, 'clients cannot insert votes directly'
);
select throws_ok($$update public.votes set option_id = '83000000-0000-0000-0000-000000000001'$$, '42501', null, 'clients cannot update votes directly');
select throws_ok($$delete from public.votes$$, '42501', null, 'clients cannot delete votes directly');
select throws_ok($$truncate public.votes$$, '42501', null, 'clients cannot truncate votes around RLS');
select throws_ok($$insert into public.user_value_scores (user_id, value_axis_id, score) values ('81000000-0000-0000-0000-000000000002', 'fun', 1)$$, '42501', null, 'clients cannot insert scores directly');
select throws_ok($$update public.user_value_scores set score = 99$$, '42501', null, 'clients cannot update scores directly');
select throws_ok($$delete from public.user_value_scores$$, '42501', null, 'clients cannot delete scores directly');
select throws_ok($$truncate public.user_value_scores$$, '42501', null, 'clients cannot truncate scores around RLS');

select throws_ok(
  $$insert into public.reason_reactions (question_id, user_id, reason_code)
    values ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000002', 'money')$$,
  '42501', null, 'direct reason writes cannot bypass vote-gated RPC rules'
);
select lives_ok($$select public.react_reason('82000000-0000-0000-0000-000000000001', 'money')$$, 'reason RPC accepts a voters choice');
select lives_ok($$select public.react_reason('82000000-0000-0000-0000-000000000001', 'time')$$, 'reason RPC permits changing the choice');
select is((select reason_code from public.reason_reactions where question_id = '82000000-0000-0000-0000-000000000001' and user_id = '81000000-0000-0000-0000-000000000002'), 'time', 'changed reason is retained');

select set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.questions where id in ('82000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000003')), 2, 'author reads their own non-active questions');

reset role;
set local role anon;
select throws_ok($$select * from public.questions$$, '42501', null, 'anon role cannot read questions');
select throws_ok($$select * from public.value_axes$$, '42501', null, 'anon role cannot read reference data');

reset role;
set local role service_role;
select lives_ok($$select * from public.questions$$, 'service role can read all questions');
select lives_ok($$insert into public.questions (id, description, category, visibility, stage) values ('82000000-0000-0000-0000-000000000020', 'admin', 'test', 'link', 'pending')$$, 'service role can insert administrative rows');
select lives_ok($$update public.questions set description = 'admin updated' where id = '82000000-0000-0000-0000-000000000020'$$, 'service role can update administrative rows');
select lives_ok($$delete from public.questions where id = '82000000-0000-0000-0000-000000000020'$$, 'service role can delete administrative rows');

select * from finish();
rollback;
