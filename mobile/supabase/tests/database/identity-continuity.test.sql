begin;

select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, is_anonymous, raw_app_meta_data)
values (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', null, '', true, '{"providers":[]}'::jsonb
);
insert into public.questions (id, category, visibility, stage)
values ('70000000-0000-0000-0000-000000000010', 'identity', 'public', 'active');
insert into public.question_options (id, question_id, code, body)
values
  ('70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000010', 'A', 'A'),
  ('70000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000010', 'B', 'B');
insert into public.votes (id, question_id, option_id, user_id, client_action_id)
values (
  '70000000-0000-0000-0000-000000000020',
  '70000000-0000-0000-0000-000000000010',
  '70000000-0000-0000-0000-000000000011',
  '70000000-0000-0000-0000-000000000001',
  '70000000-0000-4000-8000-000000000021'
);
insert into public.user_value_scores (user_id, value_axis_id, score, evidence_count)
values ('70000000-0000-0000-0000-000000000001', 'freedom', 1, 1);

-- These are the persisted Auth mutations performed by updateUser and identity linking:
-- the auth.users row is upgraded in place and provider metadata is attached to that row.
update auth.users
set email = 'continuity@example.test', is_anonymous = false
where id = '70000000-0000-0000-0000-000000000001';
update auth.users
set raw_app_meta_data = jsonb_set(raw_app_meta_data, '{providers}', '["google"]'::jsonb)
where id = '70000000-0000-0000-0000-000000000001';

select is(
  (select id from auth.users where email = 'continuity@example.test'),
  '70000000-0000-0000-0000-000000000001'::uuid,
  'email upgrade keeps the auth uid'
);
select is(
  (select raw_app_meta_data->'providers' from auth.users where id = '70000000-0000-0000-0000-000000000001'),
  '["google"]'::jsonb,
  'linked identity is attached to the same auth user'
);
select is(
  (select user_id from public.votes where id = '70000000-0000-0000-0000-000000000020'),
  '70000000-0000-0000-0000-000000000001'::uuid,
  'persisted vote ownership is unchanged after both upgrades'
);
select is(
  (select user_id from public.user_value_scores where user_id = '70000000-0000-0000-0000-000000000001' and value_axis_id = 'freedom'),
  '70000000-0000-0000-0000-000000000001'::uuid,
  'persisted value score ownership is unchanged after both upgrades'
);

select * from finish();
rollback;
