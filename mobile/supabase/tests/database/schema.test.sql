begin;

select no_plan();

select has_table('public', table_name, table_name || ' exists')
from (values
  ('profiles'), ('questions'), ('question_options'), ('votes'), ('question_skips'),
  ('reason_reactions'), ('value_axes'), ('option_value_weights'), ('user_value_scores'),
  ('daily_questions'), ('question_exposures'), ('reports'), ('blocks'), ('push_tokens'),
  ('analytics_events')
) as expected(table_name);

select has_column('public', 'questions', 'visibility', 'visibility exists');
select has_column('public', 'questions', 'stage', 'single lifecycle stage exists');
select hasnt_column('public', 'questions', 'status', 'parallel status column is absent');
select has_column('public', 'votes', 'client_action_id', 'offline replay key exists');
select has_column('public', 'reason_reactions', 'reason_code', 'stable reason code exists');
select hasnt_column('public', 'reason_reactions', 'reason', 'free-form reason is absent');
select hasnt_column('public', 'reason_reactions', 'reaction', 'unrelated reaction type is absent');

select ok(
  not exists (
    select 1 from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in (
        'profiles', 'questions', 'question_options', 'votes', 'question_skips',
        'reason_reactions', 'value_axes', 'option_value_weights', 'user_value_scores',
        'daily_questions', 'question_exposures', 'reports', 'blocks', 'push_tokens',
        'analytics_events'
      )
      and not relrowsecurity
  ),
  'RLS is enabled on every public application table'
);

select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.questions'::regclass and pg_get_constraintdef(oid) like '%visibility%public%link%'),
  'visibility is constrained to public or link'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.questions'::regclass and pg_get_constraintdef(oid) like '%stage%pending%test%active%limited%hidden%'),
  'stage has exactly the distribution lifecycle values'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.question_options'::regclass and pg_get_constraintdef(oid) like '%code%A%B%'),
  'option code is constrained to A or B'
);
select ok(exists (select 1 from pg_constraint where conrelid = 'public.question_options'::regclass and conname = 'question_options_question_id_code_key'), 'one option code per question');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.votes'::regclass and conname = 'votes_question_id_user_id_key'), 'one vote per user and question');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.votes'::regclass and conname = 'votes_user_id_client_action_id_key'), 'one replay action per user');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.question_skips'::regclass and conname = 'question_skips_question_id_user_id_key'), 'one skip per user and question');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.votes'::regclass and conname = 'votes_option_belongs_to_question_fkey'), 'vote option belongs to its question');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.reason_reactions'::regclass and conname = 'reason_reactions_question_id_user_id_key'), 'one mutable reason per user and question');
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.reason_reactions'::regclass and pg_get_constraintdef(oid) like '%realistic%emotional%money%time%neither%undecided%'),
  'reason code has exactly the Task 9 values'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.questions'::regclass
      and confrelid = 'auth.users'::regclass
      and confdeltype = 'n'
  ),
  'deleting an author nulls question ownership'
);

select results_eq(
  $$select id from public.value_axes order by id$$,
  $$values ('efficiency'), ('emotion'), ('freedom'), ('fun'), ('growth'), ('reality'), ('relationship'), ('stability')$$,
  'the exact eight value axes are installed'
);

select ok(not has_table_privilege('authenticated', 'public.questions', 'INSERT'), 'authenticated users cannot bypass create-question RPC');
select ok(not has_table_privilege('authenticated', 'public.questions', 'UPDATE'), 'authenticated users cannot transition question stage directly');
select ok(not has_table_privilege('authenticated', 'public.questions', 'DELETE'), 'authenticated users cannot delete questions directly');
select ok(has_table_privilege('authenticated', 'public.votes', 'SELECT') and not has_table_privilege('authenticated', 'public.votes', 'INSERT,UPDATE,DELETE'), 'votes are client read-only');
select ok(has_table_privilege('authenticated', 'public.user_value_scores', 'SELECT') and not has_table_privilege('authenticated', 'public.user_value_scores', 'INSERT,UPDATE,DELETE'), 'value scores are client read-only');
select ok(
  not exists (
    select 1
    from (values
      ('profiles'), ('questions'), ('question_options'), ('votes'), ('question_skips'),
      ('reason_reactions'), ('value_axes'), ('option_value_weights'), ('user_value_scores'),
      ('daily_questions'), ('question_exposures'), ('reports'), ('blocks'), ('push_tokens'),
      ('analytics_events')
    ) as app_tables(table_name)
    where has_table_privilege('authenticated', 'public.' || table_name, 'TRUNCATE')
  ),
  'authenticated users cannot bypass RLS with truncate'
);
select ok(not has_schema_privilege('anon', 'public', 'USAGE'), 'anon has no Data API schema access');
select ok(has_schema_privilege('service_role', 'public', 'USAGE'), 'service role has public schema usage');
select ok(has_table_privilege('service_role', 'public.questions', 'SELECT,INSERT,UPDATE,DELETE'), 'service role has table administration access');
select ok(not exists (select 1 from information_schema.sequences where sequence_schema = 'public') or has_sequence_privilege('service_role', 'public.' || (select sequence_name from information_schema.sequences where sequence_schema = 'public' limit 1), 'USAGE'), 'service role has sequence access when sequences exist');
select ok(bool_and(has_function_privilege('service_role', p.oid, 'EXECUTE')), 'service role can execute public functions')
from pg_proc p where p.pronamespace = 'public'::regnamespace;
select ok(not has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE'), 'anon cannot execute trigger helpers through PUBLIC');
select ok(not has_function_privilege('authenticated', 'public.set_updated_at()', 'EXECUTE'), 'authenticated cannot execute trigger helpers through PUBLIC');
select ok(not has_function_privilege('authenticated', 'public.provision_user_profile()', 'EXECUTE'), 'authenticated cannot execute profile provisioning directly');
select ok(not has_function_privilege('authenticated', 'public.enforce_active_question_options()', 'EXECUTE'), 'authenticated cannot execute activation enforcement directly');
select ok(not has_function_privilege('anon', 'public.assert_active_question_options(uuid)', 'EXECUTE'), 'anon cannot execute activation helper through PUBLIC');
select ok(not has_function_privilege('authenticated', 'public.assert_active_question_options(uuid)', 'EXECUTE'), 'authenticated cannot execute activation helper directly');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password)
values
  ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'history-author@example.test', ''),
  ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'history-voter@example.test', '');

select is((select count(*)::integer from public.profiles where id in ('71000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002')), 2, 'new auth users receive profiles');

insert into public.questions (id, author_id, description, category, visibility, stage, updated_at)
values ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'history', 'test', 'public', 'active', '2000-01-01');
insert into public.question_options (id, question_id, code, body)
values
  ('73000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', 'A', 'A'),
  ('73000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000001', 'B', 'B');
insert into public.votes (id, question_id, option_id, user_id, client_action_id)
values ('74000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', '75000000-0000-0000-0000-000000000001');

update public.questions set description = 'history updated' where id = '72000000-0000-0000-0000-000000000001';
select cmp_ok((select updated_at from public.questions where id = '72000000-0000-0000-0000-000000000001'), '>', '2000-01-01'::timestamptz, 'question updated_at advances automatically');
update public.profiles set updated_at = '2000-01-01' where id = '71000000-0000-0000-0000-000000000002';
update public.profiles set display_name = 'updated' where id = '71000000-0000-0000-0000-000000000002';
select cmp_ok((select updated_at from public.profiles where id = '71000000-0000-0000-0000-000000000002'), '>', '2000-01-01'::timestamptz, 'profile updated_at advances automatically');
insert into public.user_value_scores (id, user_id, value_axis_id, score, updated_at)
values ('76000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', 'freedom', 1, '2000-01-01');
update public.user_value_scores set score = 2 where id = '76000000-0000-0000-0000-000000000001';
select cmp_ok((select updated_at from public.user_value_scores where id = '76000000-0000-0000-0000-000000000001'), '>', '2000-01-01'::timestamptz, 'value score updated_at advances automatically');
insert into public.push_tokens (id, user_id, token, platform, updated_at)
values ('76000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'test-push-token', 'android', '2000-01-01');
update public.push_tokens set token = 'updated-test-push-token' where id = '76000000-0000-0000-0000-000000000002';
select cmp_ok((select updated_at from public.push_tokens where id = '76000000-0000-0000-0000-000000000002'), '>', '2000-01-01'::timestamptz, 'push token updated_at advances automatically');

delete from auth.users where id = '71000000-0000-0000-0000-000000000001';
select is((select author_id from public.questions where id = '72000000-0000-0000-0000-000000000001'), null::uuid, 'author identity is cleared on deletion');
select is((select count(*)::integer from public.votes where question_id = '72000000-0000-0000-0000-000000000001'), 1, 'cross-user vote history survives author deletion');

select throws_ok(
  $$insert into public.questions (id, description, category, visibility, stage)
    values ('72000000-0000-0000-0000-000000000002', 'incomplete', 'test', 'public', 'active');
    set constraints all immediate$$,
  '23514',
  null,
  'an active question must have exactly one A and one B'
);

insert into public.questions (id, author_id, description, category, visibility, stage)
values ('72000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000002', 'option move target', 'test', 'public', 'test');
insert into public.question_options (id, question_id, code, body)
values ('73000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000003', 'A', 'target A');
set constraints all immediate;
set constraints all deferred;

select throws_ok(
  $$update public.question_options
    set question_id = '72000000-0000-0000-0000-000000000003'
    where id = '73000000-0000-0000-0000-000000000002';
    set constraints all immediate$$,
  '23514', null,
  'moving B validates and protects the OLD active question'
);
update public.question_options
set question_id = '72000000-0000-0000-0000-000000000001'
where id = '73000000-0000-0000-0000-000000000002';
set constraints all deferred;

select throws_ok(
  $$delete from public.question_options where id = '73000000-0000-0000-0000-000000000002';
    set constraints all immediate$$,
  '23514', null,
  'deleting B cannot leave an active question incomplete'
);
select throws_ok(
  $$delete from public.question_options where id = '73000000-0000-0000-0000-000000000002';
    update public.question_options set code = 'B' where id = '73000000-0000-0000-0000-000000000001';
    set constraints all immediate$$,
  '23514', null,
  'changing A to B cannot leave an active question without A'
);
select lives_ok(
  $$delete from public.question_options where id = '73000000-0000-0000-0000-000000000002';
    insert into public.question_options (id, question_id, code, body)
    values ('73000000-0000-0000-0000-000000000004', '72000000-0000-0000-0000-000000000001', 'B', 'replacement B');
    set constraints all immediate$$,
  'valid atomic B replacement remains possible'
);
select is(
  (select string_agg(code, '' order by code) from public.question_options where question_id = '72000000-0000-0000-0000-000000000001'),
  'AB',
  'active question remains exactly A and B after replacement'
);

select cmp_ok(
  (
    select count(*)
    from public.questions q
    where q.visibility = 'public'
      and q.id::text like '60000000-%'
      and q.stage in ('active', 'test')
      and (q.closes_at is null or q.closes_at > now())
      and (select string_agg(o.code, '' order by o.code) from public.question_options o where o.question_id = q.id) = 'AB'
  ),
  '>=',
  10::bigint,
  'seed provides at least ten eligible A/B cards for the primary Maestro flow'
);

select ok(
  not exists (
    select 1
    from public.questions q
    join public.question_options o on o.question_id = q.id
    where q.visibility = 'public'
      and q.id::text like '60000000-%'
      and q.stage in ('active', 'test')
      and (q.closes_at is null or q.closes_at > now())
      and not exists (
        select 1 from public.option_value_weights w where w.option_id = o.id
      )
  ),
  'every eligible seeded A/B option has a value-axis weight'
);

select * from finish();
rollback;
