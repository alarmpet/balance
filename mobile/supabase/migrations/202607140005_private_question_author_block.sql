drop function public.get_shared_question(uuid);

create function public.get_shared_question(target_question_id uuid)
returns table (
  question_id uuid, option_a text, option_b text, description text, category text,
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
  select q.id,
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

drop function public.block_user(uuid);

create function public.block_question_author(question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_author_id uuid;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select q.author_id into target_author_id
  from public.questions q
  where q.id = block_question_author.question_id;
  if not found or target_author_id is null then
    raise exception 'question author unavailable' using errcode = 'P0002';
  end if;
  if target_author_id = caller_id then
    raise exception 'cannot block yourself' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('feed:' || caller_id::text || ':feed', 0));
  perform pg_advisory_xact_lock(
    hashtextextended('user-block:' || caller_id::text || ':' || target_author_id::text, 0)
  );

  insert into public.blocks (blocker_id, blocked_id)
  values (caller_id, target_author_id)
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

revoke all on function public.block_question_author(uuid) from public, anon, authenticated;
grant execute on function public.block_question_author(uuid) to authenticated, service_role;

create function public.can_read_question(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = can_read_question.target_question_id
      and ((q.visibility = 'public' and q.stage = 'active') or q.author_id = auth.uid())
  );
$$;

create function public.owns_question(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = owns_question.target_question_id
      and q.author_id = auth.uid()
  );
$$;

revoke all on function public.can_read_question(uuid) from public, anon, authenticated;
revoke all on function public.owns_question(uuid) from public, anon, authenticated;
grant execute on function public.can_read_question(uuid) to authenticated, service_role;
grant execute on function public.owns_question(uuid) to authenticated, service_role;

drop policy "read options for readable questions" on public.question_options;
create policy "read options for readable questions"
on public.question_options for select
using (public.can_read_question(question_id));

drop policy "authors manage their question options" on public.question_options;
create policy "authors manage their question options"
on public.question_options for all
using (public.owns_question(question_id))
with check (public.owns_question(question_id));

drop policy "active daily questions are readable" on public.daily_questions;
create policy "active daily questions are readable"
on public.daily_questions for select
using (public.can_read_question(question_id));

revoke select on public.questions from authenticated;
grant select (id, description, category, visibility, stage, closes_at, created_at, updated_at)
on public.questions to authenticated;
