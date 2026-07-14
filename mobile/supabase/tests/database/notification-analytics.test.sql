begin;

select no_plan();

select has_column('public', 'push_tokens', 'enabled_events', 'push tokens retain per-event preferences');
select has_table('public', 'notification_deliveries', 'notification delivery receipts exist');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.notification_deliveries'::regclass),
  'notification delivery receipts use RLS'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.notification_deliveries'::regclass
      and conname = 'notification_deliveries_idempotency_key'
  ),
  'notification delivery has a stable idempotency key'
);
select ok(
  not has_table_privilege('authenticated', 'public.notification_deliveries', 'SELECT')
    and not has_table_privilege('authenticated', 'public.notification_deliveries', 'INSERT')
    and not has_table_privilege('authenticated', 'public.notification_deliveries', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.notification_deliveries', 'DELETE'),
  'clients cannot inspect or forge notification delivery receipts'
);

select throws_ok(
  $$insert into public.analytics_events (event_name, properties)
    values ('raw_question_text', '{"description":"secret"}')$$,
  '23514', null, 'database rejects unknown analytics events'
);
select throws_ok(
  $$insert into public.analytics_events (event_name, properties)
    values ('question_created', '{"description":"secret"}')$$,
  '23514', null, 'database rejects free-text analytics properties'
);
select lives_ok(
  $$insert into public.analytics_events (event_name, properties)
    values ('question_created', '{"questionId":"72000000-0000-0000-0000-000000000001","source":"ask","timestamp":"2026-07-14T12:00:00.000Z"}')$$,
  'database accepts the analytics event schema allowlist'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, is_anonymous)
values
  ('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', true),
  ('91000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.replace_push_token('95000000-0000-0000-0000-000000000001','ExponentPushToken[allowed]','android',array['first_vote','question_closed'],'abcdefghijklmnopqrstuvwxyzABCDEF012345')$$,
  'user stores approved notification preferences'
);
select throws_ok(
  $$select public.replace_push_token('95000000-0000-0000-0000-000000000002','ExponentPushToken[spam]','android',array['every_vote'],'abcdefghijklmnopqrstuvwxyzABCDEF012345')$$,
  '22023', null, 'unknown notification preferences are rejected'
);
select throws_ok(
  $$insert into public.push_tokens (user_id, token, platform, enabled_events)
    values ('91000000-0000-0000-0000-000000000002', 'ExponentPushToken[other]', 'android', array['first_vote'])$$,
  '42501', null, 'users cannot register another account push token'
);

select * from finish();
rollback;
