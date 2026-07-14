drop function public.get_shared_question(uuid);

create function public.get_shared_question(target_question_id uuid)
returns table (
  question_id uuid, author_id uuid, option_a text, option_b text, description text, category text,
  visibility text, closes_at timestamptz, is_daily boolean, stage text,
  weights_a jsonb, weights_b jsonb
)
language sql
security definer
set search_path = ''
as $$
  with caller_lock as materialized (
    select pg_advisory_xact_lock(hashtextextended('feed:' || auth.uid()::text || ':feed', 0))
    where auth.uid() is not null
  )
  select q.id, q.author_id,
    max(qo.body) filter (where qo.code = 'A'), max(qo.body) filter (where qo.code = 'B'),
    q.description, q.category, q.visibility, q.closes_at,
    exists (select 1 from public.daily_questions dq where dq.question_id = q.id), q.stage,
    coalesce(jsonb_object_agg(ovw.value_axis_id, ovw.weight) filter (where qo.code = 'A' and ovw.value_axis_id is not null), '{}'::jsonb),
    coalesce(jsonb_object_agg(ovw.value_axis_id, ovw.weight) filter (where qo.code = 'B' and ovw.value_axis_id is not null), '{}'::jsonb)
  from caller_lock
  join public.questions q on true
  join public.question_options qo on qo.question_id = q.id
  left join public.option_value_weights ovw on ovw.option_id = qo.id
  where auth.uid() is not null and q.id = get_shared_question.target_question_id
    and ((q.visibility = 'public' and q.stage in ('active', 'test')) or (q.visibility = 'link' and q.stage = 'pending'))
    and q.stage not in ('hidden', 'limited')
    and (q.closes_at is null or q.closes_at > now())
    and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = q.author_id)
  group by q.id;
$$;

revoke all on function public.get_shared_question(uuid) from public, anon, authenticated;
grant execute on function public.get_shared_question(uuid) to authenticated, service_role;
