begin;

select no_plan();

insert into auth.users (id, instance_id, aud, role, email, encrypted_password)
values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'functions-one@example.test', ''),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'functions-two@example.test', ''),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'functions-blocked@example.test', ''),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'functions-feed-resume@example.test', '');

insert into public.questions (id, author_id, description, category, visibility, stage, closes_at, created_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'vote target', 'life', 'public', 'active', now() + interval '1 day', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000002', null, 'closed', 'life', 'public', 'active', now() - interval '1 hour', now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000003', null, 'link only', 'life', 'link', 'pending', null, now()),
  ('00000000-0000-0000-0000-000000000004', null, 'skipped', 'life', 'public', 'active', null, now() - interval '4 hours'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000013', 'blocked author', 'life', 'public', 'active', null, now() - interval '5 hours'),
  ('00000000-0000-0000-0000-000000000006', null, 'eligible test', 'life', 'public', 'test', null, now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000000007', null, 'daily', 'life', 'public', 'active', null, now() - interval '7 hours'),
  ('00000000-0000-0000-0000-000000000008', null, 'limited', 'life', 'public', 'limited', null, now()),
  ('00000000-0000-0000-0000-000000000009', null, 'pending', 'life', 'public', 'pending', null, now()),
  ('00000000-0000-0000-0000-000000000010', null, 'zero options', 'life', 'public', 'test', null, now()),
  ('00000000-0000-0000-0000-000000000011', null, 'one option', 'life', 'public', 'test', null, now()),
  ('00000000-0000-0000-0000-000000000012', null, 'quality cap', 'life', 'public', 'test', null, now()),
  ('00000000-0000-0000-0000-000000000020', null, 'close label', 'life', 'public', 'active', null, now()),
  ('00000000-0000-0000-0000-000000000021', null, 'B landslide label', 'life', 'public', 'active', null, now());

insert into public.question_options (id, question_id, code, body)
select gen_random_uuid(), q.id, c.code, q.description || ' ' || c.code
from public.questions q cross join (values ('A'), ('B')) c(code)
where q.id::text like '00000000-0000-0000-0000-%'
  and q.id not in ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000011');

insert into public.question_options (question_id, code, body)
values ('00000000-0000-0000-0000-000000000011', 'A', 'only A');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password)
select ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'fixture-' || i || '@example.test', ''
from generate_series(1, 110) i;

insert into public.votes (question_id, option_id, user_id, client_action_id)
select '00000000-0000-0000-0000-000000000020', qo.id,
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, gen_random_uuid()
from generate_series(1, 98) i
join public.question_options qo on qo.question_id = '00000000-0000-0000-0000-000000000020'
  and qo.code = case when i <= 50 then 'A' else 'B' end;

insert into public.votes (question_id, option_id, user_id, client_action_id)
select '00000000-0000-0000-0000-000000000021', qo.id,
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, gen_random_uuid()
from generate_series(1, 9) i
join public.question_options qo on qo.question_id = '00000000-0000-0000-0000-000000000021'
  and qo.code = case when i = 1 then 'A' else 'B' end;

insert into public.votes (question_id, option_id, user_id, client_action_id)
select '00000000-0000-0000-0000-000000000012', qo.id,
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, gen_random_uuid()
from generate_series(1, 20) i
join public.question_options qo on qo.question_id = '00000000-0000-0000-0000-000000000012' and qo.code = 'A';
insert into public.question_exposures (question_id, user_id, surface)
select '00000000-0000-0000-0000-000000000012',
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'feed'
from generate_series(1, 10) i;

insert into public.option_value_weights (option_id, value_axis_id, weight)
select id, 'freedom', case code when 'A' then 1 else -1 end
from public.question_options where question_id = '00000000-0000-0000-0000-000000000001';

insert into public.daily_questions (question_id, active_date)
values ('00000000-0000-0000-0000-000000000007', '2026-07-15');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);

select is(
  (select to_jsonb(shared) ? 'author_id'
   from public.get_shared_question('00000000-0000-0000-0000-000000000001') shared),
  false,
  'shared question never exposes its author id'
);

select throws_ok(
  $$ select public.cast_vote('00000000-0000-0000-0000-000000000001', 'C', '10000000-0000-0000-0000-000000000001') $$,
  '22023',
  'choice must be A or B'
);

select is((public.cast_vote('00000000-0000-0000-0000-000000000001', 'A', '10000000-0000-0000-0000-000000000001')->>'apply_status'), 'applied', 'first vote is applied');
select is((public.cast_vote('00000000-0000-0000-0000-000000000001', 'A', '10000000-0000-0000-0000-000000000001')->>'apply_status'), 'already_applied', 'same action is idempotent');
select is((select count(*)::integer from public.votes where user_id = auth.uid()), 1, 'replay creates one vote');
select is((select evidence_count from public.user_value_scores where user_id = auth.uid() and value_axis_id = 'freedom'), 1, 'replay applies score evidence once');
select throws_ok(
  $$select public.cast_vote('00000000-0000-0000-0000-000000000002', 'A', '10000000-0000-0000-0000-000000000001')$$,
  '22023', 'CLIENT_ACTION_ID_MISMATCH', 'one action ID cannot be replayed against another question'
);
select is(
  ((public.cast_vote('00000000-0000-0000-0000-000000000001', 'A', '10000000-0000-0000-0000-000000000001')->>'percent_a')::integer
   + (public.cast_vote('00000000-0000-0000-0000-000000000001', 'A', '10000000-0000-0000-0000-000000000001')->>'percent_b')::integer),
  100,
  'vote percentages sum to 100'
);
select throws_ok(
  $$select public.cast_vote('00000000-0000-0000-0000-000000000001', 'B', '10000000-0000-0000-0000-000000000002')$$,
  'P0001', 'DUPLICATE_VOTE', 'different action for the same user-question has a stable duplicate error'
);
select throws_ok(
  $$select public.cast_vote('00000000-0000-0000-0000-000000000002', 'A', '10000000-0000-0000-0000-000000000003')$$,
  '55000', 'question is not open for voting', 'closed question rejects votes'
);
select is((public.cast_vote('00000000-0000-0000-0000-000000000020', 'B', '10000000-0000-0000-0000-000000000020')->>'label'), '초접전', '51/49 is an exact close-call label');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select is((public.cast_vote('00000000-0000-0000-0000-000000000021', 'B', '10000000-0000-0000-0000-000000000021')->>'label'), '다수파', 'B landslide is majority for the selected side');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);

select lives_ok($$select public.record_skip('00000000-0000-0000-0000-000000000004')$$, 'skip is recorded through RPC');
reset role;
insert into public.blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000013');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);

create temporary table tested_feed as select * from public.get_feed(null, 20);
select results_eq(
  $$select question_id from tested_feed where question_id::text like '00000000-0000-0000-0000-%' order by question_id$$,
  $$values ('00000000-0000-0000-0000-000000000006'::uuid), ('00000000-0000-0000-0000-000000000007'::uuid), ('00000000-0000-0000-0000-000000000012'::uuid), ('00000000-0000-0000-0000-000000000021'::uuid)$$,
  'feed excludes voted, skipped, blocked, link, hidden, limited, pending, and closed questions'
);
select is((select count(*)::integer from public.question_exposures where user_id = auth.uid()), (select count(*)::integer from tested_feed), 'only returned feed rows create exposures');
select is((select quality_score from tested_feed where question_id = '00000000-0000-0000-0000-000000000006'), 0.5::numeric, 'cold-start test quality is neutral below ten exposures');
select is((select quality_score from tested_feed where question_id = '00000000-0000-0000-0000-000000000012'), 1::numeric, 'quality rates are capped at one');
select is((select count(*)::integer from tested_feed where question_id in ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000011')), 0, 'feed requires exactly one A and one B');
select is((select count(*)::integer from public.question_exposures where user_id = auth.uid() and question_id in ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000011')), 0, 'incomplete questions never receive exposures');
select ok(position('nullif' in lower(pg_get_functiondef('public.get_feed(text,integer)'::regprocedure))) > 0, 'feed rate denominators are protected');
select ok(position('category_match' in lower(pg_get_functiondef('public.get_feed(text,integer)'::regprocedure))) = 0, 'P0 feed has no category_match');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
create temporary table tested_page_one as select * from public.get_feed(null, 1);
create temporary table tested_page_two as select * from public.get_feed((select next_cursor from tested_page_one), 1);
select is((select count(*)::integer from tested_page_one), 1, 'page size is respected');
select is((select count(*)::integer from tested_page_one p1 join tested_page_two p2 using (question_id)), 0, 'cursor pages contain no duplicate rows');
select isnt((select (convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'session_id')::uuid from tested_page_one), null::uuid, 'cursor identifies a server-side snapshot');
select is((select (convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'ordinal')::bigint from tested_page_one), 2::bigint, 'cursor continues at the next immutable ordinal');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000014', true);
create temporary table reuse_null_first as select * from public.get_feed(null, 1);
reset role;
create temporary table reuse_session_metrics as
select fs.id as session_id, count(fsi.*)::integer as item_count
from public.feed_sessions fs
join public.feed_session_items fsi on fsi.session_id = fs.id
where fs.user_id = '00000000-0000-0000-0000-000000000014' and fs.surface = 'feed'
group by fs.id;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000014', true);
create temporary table reuse_null_second as select * from public.get_feed(null, 1);
reset role;
select is((select count(*)::integer from public.feed_sessions where user_id = '00000000-0000-0000-0000-000000000014' and surface = 'feed'), 1, 'repeated null cursor keeps one active feed session');
select is((select (convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'session_id')::uuid from reuse_null_second), (select session_id from reuse_session_metrics), 'null cursor resumes the current snapshot');
select is((select count(*)::integer from public.feed_session_items where session_id = (select session_id from reuse_session_metrics)), (select item_count from reuse_session_metrics), 'resuming null cursor does not amplify snapshot items');
select is((select count(*)::integer from reuse_null_first a join reuse_null_second b using (question_id)), 0, 'repeated null cursor advances without duplicate rows');
update public.feed_sessions set expires_at = now() - interval '1 second' where id = (select session_id from reuse_session_metrics);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000014', true);
create temporary table reuse_after_expiry as select * from public.get_feed(null, 1);
reset role;
select is((select count(*)::integer from public.feed_sessions where user_id = '00000000-0000-0000-0000-000000000014' and surface = 'feed'), 1, 'expired abandoned snapshot is replaced by one fresh session');
select isnt((select (convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'session_id')::uuid from reuse_after_expiry), (select session_id from reuse_session_metrics), 'fresh session receives a new identity after expiry');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
select is((select count(*)::integer from public.get_daily_question('2026-07-15')), 1, 'eligible active public daily is returned');
select is((select count(*)::integer from public.get_shared_question('00000000-0000-0000-0000-000000000003')), 1, 'link question can be fetched explicitly');
select is((select count(*)::integer from public.get_shared_question('00000000-0000-0000-0000-000000000002')), 0, 'expired shared question is excluded');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000013', true);
create temporary table snapshot_page_one as select * from public.get_feed(null, 1);
reset role;
create temporary table expected_snapshot as
select fsi.question_id
from public.feed_session_items fsi
where fsi.session_id = (
  select (convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'session_id')::uuid
  from snapshot_page_one
);
grant select on expected_snapshot to authenticated;
insert into public.question_exposures (question_id, user_id, surface)
select '00000000-0000-0000-0000-000000000006',
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'feed'
from generate_series(1, 10) i
on conflict on constraint question_exposures_question_id_user_id_surface_key do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000013', true);
create temporary table snapshot_rest as
select * from public.get_feed((select next_cursor from snapshot_page_one), 50);
select is(
  (select count(*)::integer from (select question_id from snapshot_page_one union all select question_id from snapshot_rest) returned),
  (select count(*)::integer from expected_snapshot),
  'ranking mutation does not omit snapshot candidates'
);
select is(
  (select count(*)::integer - count(distinct question_id)::integer from (select question_id from snapshot_page_one union all select question_id from snapshot_rest) returned),
  0,
  'ranking mutation does not duplicate snapshot candidates'
);
select is((select count(*)::integer from snapshot_rest where question_id = '00000000-0000-0000-0000-000000000006'), 1, 'mutated unseen candidate remains in its immutable snapshot position');
reset role;
select is((select count(*)::integer from public.feed_sessions where id = (select (convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'session_id')::uuid from snapshot_page_one)), 0, 'completed snapshot is cleaned up');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select throws_ok(
  $$select public.get_feed('not-a-valid-cursor', 1)$$,
  '22023', 'invalid feed cursor', 'malformed cursor is rejected'
);
create temporary table protected_cursor as select * from public.get_feed(null, 1);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
select throws_ok(
  format($sql$select public.get_feed(%L, 1)$sql$, (select next_cursor from protected_cursor)),
  '22023', 'invalid or expired feed cursor', 'cursor cannot cross users'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select throws_ok(
  format(
    $sql$select public.get_feed(%L, 1)$sql$,
    (select replace(encode(convert_to((jsonb_set(convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb, '{ordinal}', to_jsonb(((convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'ordinal')::bigint + 1))))::text, 'UTF8'), 'base64'), E'\n', '') from protected_cursor)
  ),
  '22023', 'invalid or expired feed cursor', 'cursor ordinal tampering is rejected'
);
reset role;
update public.feed_sessions
set expires_at = now() - interval '1 second'
where id = (select (convert_from(decode(next_cursor, 'base64'), 'UTF8')::jsonb->>'session_id')::uuid from protected_cursor);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select throws_ok(
  format($sql$select public.get_feed(%L, 1)$sql$, (select next_cursor from protected_cursor)),
  '22023', 'invalid or expired feed cursor', 'expired cursor is rejected'
);

select throws_ok($$insert into public.votes (question_id, option_id, user_id, client_action_id) select '00000000-0000-0000-0000-000000000006', id, auth.uid(), gen_random_uuid() from public.question_options where question_id = '00000000-0000-0000-0000-000000000006' and code = 'A'$$, '42501', null, 'direct vote inserts remain denied');
select throws_ok($$update public.user_value_scores set score = 999 where user_id = auth.uid()$$, '42501', null, 'direct score writes remain denied');

select ok(has_function_privilege('authenticated', 'public.cast_vote(uuid,text,uuid)', 'EXECUTE'), 'authenticated can cast votes');
select ok(not has_function_privilege('anon', 'public.cast_vote(uuid,text,uuid)', 'EXECUTE'), 'anon cannot cast votes');
select ok(not has_function_privilege('public', 'public.cast_vote(uuid,text,uuid)', 'EXECUTE'), 'PUBLIC cannot cast votes');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.question_exposures'::regclass and conname = 'question_exposures_question_id_user_id_surface_key'), 'exposures are unique per user question and surface');
select ok(not has_table_privilege('authenticated', 'public.feed_sessions', 'SELECT,INSERT,UPDATE,DELETE'), 'feed sessions are RPC-only');
select ok(not has_table_privilege('authenticated', 'public.feed_session_items', 'SELECT,INSERT,UPDATE,DELETE'), 'feed session items are RPC-only');
select ok((select relrowsecurity from pg_class where oid = 'public.feed_sessions'::regclass) and (select relrowsecurity from pg_class where oid = 'public.feed_session_items'::regclass), 'feed snapshot tables have RLS enabled');
select ok(has_table_privilege('service_role', 'public.feed_sessions', 'SELECT,INSERT,UPDATE,DELETE') and has_table_privilege('service_role', 'public.feed_session_items', 'SELECT,INSERT,UPDATE,DELETE'), 'service role administers feed snapshots');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.feed_sessions'::regclass and conname = 'feed_sessions_user_id_surface_key'), 'database enforces one active session per user and surface');

select * from finish();
rollback;
