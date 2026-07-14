begin;

select no_plan();

select has_function('public', 'react_reason', array['uuid', 'text'], 'structured reaction RPC exists');
select has_function('public', 'report_question', array['uuid', 'text'], 'question report RPC exists');
select has_function('public', 'block_question_author', array['uuid'], 'question-scoped block RPC exists');
select hasnt_function('public', 'block_user', array['uuid'], 'raw user-id block RPC is removed');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, is_anonymous)
values
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'moderation-author@example.test', '', false),
  ('90000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trusted-one@example.test', '', false),
  ('90000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trusted-two@example.test', '', false),
  ('90000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trusted-three@example.test', '', false),
  ('90000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', true),
  ('90000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', true),
  ('90000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', true),
  ('90000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', true),
  ('90000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reaction-voter@example.test', '', false),
  ('90000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'blocker@example.test', '', false),
  ('90000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'blocked-author@example.test', '', false),
  ('90000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hour-rate@example.test', '', false),
  ('90000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day-rate@example.test', '', false),
  ('90000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'snapshot-blocker@example.test', '', false);

insert into public.questions (id, author_id, description, category, visibility, stage, created_at)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'moderation target', 'test', 'public', 'active', now() - interval '2 hours'),
  ('91000000-0000-0000-0000-000000000201', '90000000-0000-0000-0000-000000000041', 'blocked author target', 'test', 'public', 'active', now() - interval '1 hour'),
  ('91000000-0000-0000-0000-000000000202', '90000000-0000-0000-0000-000000000001', 'unblocked feed target', 'test', 'public', 'active', now() - interval '1 hour'),
  ('91000000-0000-0000-0000-000000000203', '90000000-0000-0000-0000-000000000040', 'self-authored target', 'test', 'public', 'active', now());

insert into public.questions (id, author_id, description, category, visibility, stage, created_at)
select ('91000000-0000-0000-0000-' || lpad((100 + i)::text, 12, '0'))::uuid,
  '90000000-0000-0000-0000-000000000001', 'veteran vote ' || i, 'test', 'public', 'active', now() - interval '3 hours'
from generate_series(1, 10) i;

insert into public.question_options (question_id, code, body)
select q.id, c.code, q.description || ' ' || c.code
from public.questions q
cross join (values ('A'), ('B')) c(code)
where q.id::text like '91000000-0000-0000-0000-%';

insert into public.votes (question_id, option_id, user_id, client_action_id)
select q.id, qo.id, '90000000-0000-0000-0000-000000000024', gen_random_uuid()
from public.questions q
join public.question_options qo on qo.question_id = q.id and qo.code = 'A'
where q.id::text between '91000000-0000-0000-0000-000000000101' and '91000000-0000-0000-0000-000000000110';

insert into public.votes (question_id, option_id, user_id, client_action_id)
select '91000000-0000-0000-0000-000000000001', qo.id,
  '90000000-0000-0000-0000-000000000030', '92000000-0000-4000-8000-000000000001'
from public.question_options qo
where qo.question_id = '91000000-0000-0000-0000-000000000001' and qo.code = 'A';

insert into public.daily_questions (question_id, active_date)
values ('91000000-0000-0000-0000-000000000201', '2026-07-20');

select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('react_reason', 'report_question', 'block_question_author') and p.prosecdef), 3, 'all moderation RPCs are SECURITY DEFINER');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('react_reason', 'report_question', 'block_question_author') and p.proconfig = array['search_path=""']), 3, 'all moderation RPCs pin an empty search_path');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('react_reason', 'report_question', 'block_question_author') and has_function_privilege('authenticated', p.oid, 'EXECUTE')), 3, 'authenticated can execute all moderation RPCs');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('react_reason', 'report_question', 'block_question_author') and has_function_privilege('anon', p.oid, 'EXECUTE')), 0, 'anon cannot execute moderation RPCs');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('react_reason', 'report_question', 'block_question_author') and has_function_privilege('public', p.oid, 'EXECUTE')), 0, 'PUBLIC cannot execute moderation RPCs');
select ok(position('for share of q' in lower(pg_get_functiondef('public.get_feed(text,integer)'::regprocedure))) > 0, 'feed locks selected question rows against stage updates through exposure');
select ok(position('feed:' in lower(pg_get_functiondef('public.block_question_author(uuid)'::regprocedure))) > 0, 'block RPC shares the caller feed advisory lock');

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000030', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000030","is_anonymous":false}', true);
select lives_ok($$select public.react_reason('91000000-0000-0000-0000-000000000001', 'realistic')$$, 'a voter can react');
select lives_ok($$select public.react_reason('91000000-0000-0000-0000-000000000001', 'emotional')$$, 'a voter can change reaction');
select is((select count(*)::integer from public.reason_reactions where question_id = '91000000-0000-0000-0000-000000000001' and user_id = auth.uid()), 1, 'one active reaction is retained');
select is((select reason_code from public.reason_reactions where question_id = '91000000-0000-0000-0000-000000000001' and user_id = auth.uid()), 'emotional', 'changed reaction replaces the prior code');
select throws_ok($$select public.react_reason('91000000-0000-0000-0000-000000000001', 'free text')$$, '22023', 'invalid reason code', 'free-text reaction is rejected');

select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000021', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000021","is_anonymous":true}', true);
select throws_ok($$select public.react_reason('91000000-0000-0000-0000-000000000001', 'realistic')$$, '42501', 'vote required before reaction', 'a non-voter cannot react');

select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000001', 'spam')$$, 'new anonymous report is retained');
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000022', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000022","is_anonymous":true}', true);
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000001', 'harmful')$$, 'second anonymous report is retained');
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000023', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000023","is_anonymous":true}', true);
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000001', 'privacy')$$, 'third anonymous report is retained');

reset role;
select is((select count(*)::integer from public.reports where question_id = '91000000-0000-0000-0000-000000000001'), 3, 'all anonymous reports enter the review queue');
select is((select coalesce(sum(trusted_weight), 0)::integer from public.reports where question_id = '91000000-0000-0000-0000-000000000001' and resolved_at is null), 0, 'new anonymous reports contribute zero automatic weight');
select is((select stage from public.questions where id = '91000000-0000-0000-0000-000000000001'), 'active', 'untrusted reports do not slow distribution');

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000011', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000011","is_anonymous":false}', true);
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000001', 'spam')$$, 'first trusted report is retained');
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000001', 'changed reason is ignored')$$, 'repeat report is idempotent');
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000012', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000012","is_anonymous":false}', true);
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000001', 'harmful')$$, 'second trusted report is retained');

reset role;
select is((select stage from public.questions where id = '91000000-0000-0000-0000-000000000001'), 'active', 'two trusted reports do not reach the threshold');
select is((select count(*)::integer from public.reports where question_id = '91000000-0000-0000-0000-000000000001' and reporter_id = '90000000-0000-0000-0000-000000000011'), 1, 'repeat calls do not create duplicate reports');
select is((select coalesce(sum(trusted_weight), 0)::integer from public.reports where question_id = '91000000-0000-0000-0000-000000000001' and resolved_at is null), 2, 'repeat calls do not increase automatic weight');

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000013', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000013","is_anonymous":false}', true);
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000001', 'privacy')$$, 'third trusted report is retained');

reset role;
select is((select stage from public.questions where id = '91000000-0000-0000-0000-000000000001'), 'limited', 'three distinct trusted reports slow distribution');
select isnt((select stage from public.questions where id = '91000000-0000-0000-0000-000000000001'), 'hidden', 'automatic moderation never hides a question');
select is((select count(*)::integer from public.votes where question_id = '91000000-0000-0000-0000-000000000001'), 1, 'moderation never changes vote counts');

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000021', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000021","is_anonymous":true}', true);
create temporary table moderation_limited_feed as select * from public.get_feed(null, 100);
select is((select count(*)::integer from moderation_limited_feed where question_id = '91000000-0000-0000-0000-000000000001'), 0, 'automatically limited question leaves normal feed allocation');
select is((select count(*)::integer from public.question_exposures where user_id = auth.uid() and question_id = '91000000-0000-0000-0000-000000000001'), 0, 'automatically limited question receives no new exposure');

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000024', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000024","is_anonymous":true}', true);
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000202', 'spam')$$, 'anonymous reporter with ten real votes is trusted');
reset role;
select is((select trusted_weight::integer from public.reports where reporter_id = '90000000-0000-0000-0000-000000000024' and question_id = '91000000-0000-0000-0000-000000000202'), 1, 'ten-vote anonymous report has trusted weight');

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000050', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000050","is_anonymous":false}', true);
select lives_ok($$do $body$ begin for i in 1..10 loop perform public.report_question('91000000-0000-0000-0000-000000000201', 'spam'); end loop; end $body$;$$, 'ten report attempts per hour are accepted');
select throws_ok($$select public.report_question('91000000-0000-0000-0000-000000000201', 'spam')$$, 'P0001', 'REPORT_RATE_LIMITED', 'the eleventh hourly attempt is rejected');

reset role;
insert into public.report_attempts (reporter_id, created_at)
select '90000000-0000-0000-0000-000000000051', now() - interval '2 hours'
from generate_series(1, 29);
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000051', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000051","is_anonymous":false}', true);
select lives_ok($$select public.report_question('91000000-0000-0000-0000-000000000202', 'spam')$$, 'thirtieth daily attempt is accepted');
select throws_ok($$select public.report_question('91000000-0000-0000-0000-000000000202', 'spam')$$, 'P0001', 'REPORT_RATE_LIMITED', 'the thirty-first daily attempt is rejected');

select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000060', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000060","is_anonymous":false}', true);
create temporary table moderation_snapshot_first as select * from public.get_feed(null, 1);
select is((select count(*)::integer from public.question_exposures where user_id = auth.uid() and question_id = '91000000-0000-0000-0000-000000000201'), 0, 'future block target remains unseen in the existing snapshot');
select lives_ok($$select public.block_question_author('91000000-0000-0000-0000-000000000201')$$, 'block applies after snapshot creation');
create temporary table moderation_snapshot_after_block as
  select * from public.get_feed((select next_cursor from moderation_snapshot_first), 100);
select is((select count(*)::integer from moderation_snapshot_after_block where question_id = '91000000-0000-0000-0000-000000000201'), 0, 'existing snapshot excludes a newly blocked author');
select is((select count(*)::integer from public.question_exposures where user_id = auth.uid() and question_id = '91000000-0000-0000-0000-000000000201'), 0, 'existing snapshot records no blocked exposure');
select is((select count(*)::integer from public.get_shared_question('91000000-0000-0000-0000-000000000201')), 0, 'shared lookup respects the block');
select is((select count(*)::integer from public.get_daily_question('2026-07-20')), 0, 'daily lookup respects the block');

select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000040', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000040","is_anonymous":false}', true);
select lives_ok($$select public.block_question_author('91000000-0000-0000-0000-000000000201')$$, 'a user can block a question author');
select lives_ok($$select public.block_question_author('91000000-0000-0000-0000-000000000201')$$, 'blocking by question is idempotent');
select throws_ok($$select public.block_question_author('91000000-0000-0000-0000-000000000203')$$, '22023', 'cannot block yourself', 'self-authored question cannot be blocked');
create temporary table moderation_blocked_feed as select * from public.get_feed(null, 100);
select is((select count(*)::integer from moderation_blocked_feed where question_id = '91000000-0000-0000-0000-000000000201'), 0, 'blocked author is excluded from future feed results');
select is((select count(*)::integer from public.question_exposures where user_id = auth.uid() and question_id = '91000000-0000-0000-0000-000000000201'), 0, 'blocked content receives no exposure');

select throws_ok($$insert into public.reports (reporter_id, question_id, reason) values (auth.uid(), '91000000-0000-0000-0000-000000000202', 'bypass')$$, '42501', null, 'direct report writes cannot bypass rate and trust rules');
select throws_ok($$insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), '90000000-0000-0000-0000-000000000001')$$, '42501', null, 'direct block writes cannot bypass the RPC');
select throws_ok($$insert into public.reason_reactions (question_id, user_id, reason_code) values ('91000000-0000-0000-0000-000000000202', auth.uid(), 'money')$$, '42501', null, 'direct reactions cannot bypass the vote requirement');
select throws_ok($$update public.reports set trusted_weight = 1$$, '42501', null, 'direct report updates are denied');
select throws_ok($$delete from public.reports$$, '42501', null, 'direct report deletes are denied');
select throws_ok($$update public.blocks set blocked_id = '90000000-0000-0000-0000-000000000001'$$, '42501', null, 'direct block updates are denied');
select throws_ok($$delete from public.blocks$$, '42501', null, 'direct block deletes are denied');
select throws_ok($$update public.reason_reactions set reason_code = 'money'$$, '42501', null, 'direct reaction updates are denied');
select throws_ok($$delete from public.reason_reactions$$, '42501', null, 'direct reaction deletes are denied');

reset role;
select is((select count(*)::integer from public.blocks where blocker_id = '90000000-0000-0000-0000-000000000040' and blocked_id = '90000000-0000-0000-0000-000000000041'), 1, 'one private block row is stored');
select is((select count(*)::integer from public.questions where stage = 'hidden' and id::text like '91000000-0000-0000-0000-%'), 0, 'no moderation RPC produced a hidden transition');

select * from finish();
rollback;
