alter table public.question_exposures
  add constraint question_exposures_question_id_user_id_surface_key
  unique (question_id, user_id, surface);

create table public.feed_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface = 'feed'),
  next_ordinal bigint not null default 1 check (next_ordinal > 0),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);

create table public.feed_session_items (
  session_id uuid not null references public.feed_sessions(id) on delete cascade,
  ordinal bigint not null check (ordinal > 0),
  question_id uuid not null references public.questions(id) on delete cascade,
  quality_score numeric not null check (quality_score between 0 and 1),
  feed_score numeric not null,
  primary key (session_id, ordinal),
  unique (session_id, question_id)
);

create index feed_sessions_expiry_idx on public.feed_sessions (expires_at);
delete from public.feed_sessions where expires_at <= now();
delete from public.feed_sessions older
using public.feed_sessions newer
where older.user_id = newer.user_id and older.surface = newer.surface
  and (older.created_at, older.id) < (newer.created_at, newer.id);
alter table public.feed_sessions
  add constraint feed_sessions_user_id_surface_key unique (user_id, surface);
alter table public.feed_sessions enable row level security;
alter table public.feed_session_items enable row level security;
revoke all privileges on public.feed_sessions, public.feed_session_items from public, anon, authenticated;
grant all privileges on public.feed_sessions, public.feed_session_items to service_role;

create function public.cast_vote(question_id uuid, choice text, client_action_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  selected_option_id uuid;
  selected_choice text;
  existing_vote public.votes%rowtype;
  target_question public.questions%rowtype;
  vote_status text := 'applied';
  a_count integer;
  b_count integer;
  a_percent integer;
  scores jsonb;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if choice not in ('A', 'B') then
    raise exception 'choice must be A or B' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('vote-action:' || caller_id::text || ':' || client_action_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('vote-question:' || caller_id::text || ':' || question_id::text, 0));

  select v.* into existing_vote
  from public.votes v
  where v.user_id = caller_id and v.client_action_id = cast_vote.client_action_id;

  if found then
    if existing_vote.question_id <> cast_vote.question_id then
      raise exception 'CLIENT_ACTION_ID_MISMATCH' using errcode = '22023';
    end if;
    selected_option_id := existing_vote.option_id;
    vote_status := 'already_applied';
  else
    select q.* into target_question
    from public.questions q
    where q.id = cast_vote.question_id
    for update;

    if not found
      or (target_question.closes_at is not null and target_question.closes_at <= now())
      or not ((target_question.visibility = 'public' and target_question.stage in ('active', 'test'))
        or (target_question.visibility = 'link' and target_question.stage = 'pending')) then
      raise exception 'question is not open for voting' using errcode = '55000';
    end if;

    if exists (select 1 from public.votes v where v.question_id = cast_vote.question_id and v.user_id = caller_id) then
      raise exception 'DUPLICATE_VOTE' using errcode = 'P0001';
    end if;

    select qo.id into selected_option_id
    from public.question_options qo
    where qo.question_id = cast_vote.question_id and qo.code = cast_vote.choice;
    if selected_option_id is null then
      raise exception 'question does not have the selected option' using errcode = '55000';
    end if;

    insert into public.votes (question_id, option_id, user_id, client_action_id)
    values (cast_vote.question_id, selected_option_id, caller_id, cast_vote.client_action_id);

    insert into public.user_value_scores (user_id, value_axis_id, score, evidence_count)
    select caller_id, ovw.value_axis_id, ovw.weight, 1
    from public.option_value_weights ovw
    where ovw.option_id = selected_option_id
    on conflict (user_id, value_axis_id) do update
      set score = public.user_value_scores.score + excluded.score,
          evidence_count = public.user_value_scores.evidence_count + 1,
          updated_at = now();
  end if;

  select
    count(*) filter (where qo.code = 'A')::integer,
    count(*) filter (where qo.code = 'B')::integer
  into a_count, b_count
  from public.votes v
  join public.question_options qo on qo.id = v.option_id
  where v.question_id = cast_vote.question_id;

  a_percent := case when a_count + b_count = 0 then 0
    else round(a_count * 100.0 / nullif(a_count + b_count, 0))::integer end;
  select qo.code into selected_choice from public.question_options qo where qo.id = selected_option_id;

  select jsonb_object_agg(va.id, coalesce(uvs.score, 0) order by va.sort_order)
  into scores
  from public.value_axes va
  left join public.user_value_scores uvs
    on uvs.value_axis_id = va.id and uvs.user_id = caller_id;

  return jsonb_build_object(
    'apply_status', vote_status,
    'selected', selected_choice,
    'count_a', a_count,
    'count_b', b_count,
    'percent_a', a_percent,
    'percent_b', 100 - a_percent,
    'label', case
      when a_percent between 48 and 52 then '초접전'
      when (case selected_choice when 'A' then a_percent else 100 - a_percent end) >= 50 then '다수파'
      else '소수파'
    end,
    'axis_scores', scores
  );
end;
$$;

create function public.get_daily_question(day date)
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
    q.description, q.category, q.visibility, q.closes_at, true, q.stage,
    coalesce(jsonb_object_agg(ovw.value_axis_id, ovw.weight) filter (where qo.code = 'A' and ovw.value_axis_id is not null), '{}'::jsonb),
    coalesce(jsonb_object_agg(ovw.value_axis_id, ovw.weight) filter (where qo.code = 'B' and ovw.value_axis_id is not null), '{}'::jsonb)
  from caller_lock
  join public.daily_questions dq on true
  join public.questions q on q.id = dq.question_id
  join public.question_options qo on qo.question_id = q.id
  left join public.option_value_weights ovw on ovw.option_id = qo.id
  where auth.uid() is not null and dq.active_date = day and q.visibility = 'public' and q.stage = 'active'
    and (q.closes_at is null or q.closes_at > now())
    and not exists (select 1 from public.votes v where v.question_id = q.id and v.user_id = auth.uid())
    and not exists (select 1 from public.question_skips s where s.question_id = q.id and s.user_id = auth.uid())
    and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = q.author_id)
  group by q.id;
$$;

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

create function public.get_feed(cursor text, page_size integer)
returns table (
  question_id uuid, option_a text, option_b text, description text, category text,
  visibility text, closes_at timestamptz, is_daily boolean, stage text,
  weights_a jsonb, weights_b jsonb, quality_score numeric, feed_score numeric,
  next_cursor text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  cursor_payload jsonb;
  active_session_id uuid;
  requested_ordinal bigint;
  stored_ordinal bigint;
  candidate_ordinals bigint[];
  delivered_ordinals bigint[];
  last_ordinal bigint;
  has_more boolean;
  next_cursor_value text;
  created_session boolean := false;
begin
  if caller_id is null then raise exception 'authentication required' using errcode = '28000'; end if;
  perform pg_advisory_xact_lock(hashtextextended('feed:' || caller_id::text || ':feed', 0));
  delete from public.feed_sessions fs where fs.expires_at <= now();

  if cursor is null then
    select fs.id, fs.next_ordinal into active_session_id, requested_ordinal
    from public.feed_sessions fs
    where fs.user_id = caller_id and fs.surface = 'feed' and fs.expires_at > now()
    for update;

    if not found then
      insert into public.feed_sessions (user_id, surface)
      values (caller_id, 'feed')
      on conflict (user_id, surface) do nothing
      returning id, next_ordinal into active_session_id, requested_ordinal;
      created_session := found;

      if not created_session then
        select fs.id, fs.next_ordinal into active_session_id, requested_ordinal
        from public.feed_sessions fs
        where fs.user_id = caller_id and fs.surface = 'feed' and fs.expires_at > now()
        for update;
        if not found then
          raise exception 'feed session creation conflict' using errcode = '40001';
        end if;
      end if;
    end if;

    if created_session then
    insert into public.feed_session_items (session_id, ordinal, question_id, quality_score, feed_score)
    with candidate_metrics as materialized (
      select q.*,
        count(distinct e.id)::integer as exposures,
        count(distinct v.id)::integer as votes,
        case
          when q.stage = 'test' and count(distinct e.id) < 10 then 0.5
          else least(1, greatest(0,
            coalesce(count(distinct v.id)::numeric / nullif(count(distinct e.id), 0), 0.5)
          ))
        end as quality,
        greatest(0, 1 - extract(epoch from (now() - q.created_at)) / 2592000.0) as freshness,
        case when q.stage = 'test' then greatest(0, (10 - count(distinct e.id)) / 10.0) else 0 end as test_need,
        case when q.closes_at is not null then greatest(0, 1 - extract(epoch from (q.closes_at - now())) / 604800.0) else 0 end as deadline,
        case
          when q.closes_at is not null and q.closes_at < now() + interval '7 days' then 0
          when q.stage = 'active' and q.author_id is null then 1
          when q.stage = 'active' then 2
          else 3
        end as bucket
      from public.questions q
      left join public.question_exposures e on e.question_id = q.id
      left join public.votes v on v.question_id = q.id
      where q.visibility = 'public' and q.stage in ('active', 'test')
        and (q.closes_at is null or q.closes_at > now())
        and (select count(*) from public.question_options complete where complete.question_id = q.id) = 2
      group by q.id
    ), raw_scored as materialized (
      select cm.*,
        cm.quality * 0.40 + cm.freshness * 0.25 + cm.test_need * 0.25 + cm.deadline * 0.10 as score
      from candidate_metrics cm
    ), scored as materialized (
      select rs.*,
        row_number() over (partition by rs.bucket order by rs.score desc, rs.id) as bucket_position
      from raw_scored rs
    ), eligible as materialized (
      select s.* from scored s
      where not exists (select 1 from public.votes mine where mine.question_id = s.id and mine.user_id = caller_id)
        and not exists (select 1 from public.question_skips skip where skip.question_id = s.id and skip.user_id = caller_id)
        and not exists (select 1 from public.blocks b where b.blocker_id = caller_id and b.blocked_id = s.author_id)
        and not exists (select 1 from public.question_exposures seen where seen.question_id = s.id and seen.user_id = caller_id and seen.surface = 'feed')
    ), snapshot_order as (
      select row_number() over (order by e.bucket_position, e.bucket, e.score desc, e.id) as ordinal,
        e.id, e.quality, e.score
      from eligible e
    )
    select active_session_id, so.ordinal, so.id, so.quality, so.score
    from snapshot_order so;
    end if;
  else
    begin
      cursor_payload := convert_from(decode(cursor, 'base64'), 'UTF8')::jsonb;
      active_session_id := (cursor_payload->>'session_id')::uuid;
      requested_ordinal := (cursor_payload->>'ordinal')::bigint;
      if active_session_id is null or requested_ordinal is null then raise exception 'invalid cursor'; end if;
    exception when others then
      raise exception 'invalid feed cursor' using errcode = '22023';
    end;

    select fs.next_ordinal into stored_ordinal
    from public.feed_sessions fs
    where fs.id = active_session_id and fs.user_id = caller_id and fs.surface = 'feed'
      and fs.expires_at > now()
    for update;
    if not found or stored_ordinal <> requested_ordinal then
      raise exception 'invalid or expired feed cursor' using errcode = '22023';
    end if;
  end if;

  select array_agg(page.ordinal order by page.ordinal) into candidate_ordinals
  from (
    select fsi.ordinal
    from public.feed_session_items fsi
    join public.questions q on q.id = fsi.question_id
    where fsi.session_id = active_session_id and fsi.ordinal >= requested_ordinal
      and q.visibility = 'public' and q.stage in ('active', 'test')
      and (q.closes_at is null or q.closes_at > now())
      and (select count(*) from public.question_options complete where complete.question_id = q.id) = 2
      and not exists (select 1 from public.votes mine where mine.question_id = q.id and mine.user_id = caller_id)
      and not exists (select 1 from public.question_skips skip where skip.question_id = q.id and skip.user_id = caller_id)
      and not exists (select 1 from public.blocks b where b.blocker_id = caller_id and b.blocked_id = q.author_id)
      and not exists (select 1 from public.question_exposures seen where seen.question_id = q.id and seen.user_id = caller_id and seen.surface = 'feed')
    order by fsi.ordinal
    limit greatest(least(coalesce(page_size, 20), 50), 1)
    for share of q
  ) page;

  if candidate_ordinals is null then
    delete from public.feed_sessions fs where fs.id = active_session_id;
    return;
  end if;

  last_ordinal := candidate_ordinals[array_length(candidate_ordinals, 1)];
  with inserted as (
    insert into public.question_exposures (question_id, user_id, surface)
    select fsi.question_id, caller_id, 'feed'
    from public.feed_session_items fsi
    join public.questions q on q.id = fsi.question_id
    where fsi.session_id = active_session_id and fsi.ordinal = any(candidate_ordinals)
      and q.visibility = 'public' and q.stage in ('active', 'test')
      and (q.closes_at is null or q.closes_at > now())
      and (select count(*) from public.question_options complete where complete.question_id = q.id) = 2
      and not exists (select 1 from public.votes mine where mine.question_id = q.id and mine.user_id = caller_id)
      and not exists (select 1 from public.question_skips skip where skip.question_id = q.id and skip.user_id = caller_id)
      and not exists (select 1 from public.blocks b where b.blocker_id = caller_id and b.blocked_id = q.author_id)
      and not exists (select 1 from public.question_exposures seen where seen.question_id = q.id and seen.user_id = caller_id and seen.surface = 'feed')
    on conflict on constraint question_exposures_question_id_user_id_surface_key do nothing
    returning public.question_exposures.question_id as exposed_question_id
  )
  select array_agg(fsi.ordinal order by fsi.ordinal) into delivered_ordinals
  from inserted i
  join public.feed_session_items fsi on fsi.session_id = active_session_id and fsi.question_id = i.exposed_question_id;

  select exists (
    select 1 from public.feed_session_items future
    join public.questions q on q.id = future.question_id
    where future.session_id = active_session_id and future.ordinal > last_ordinal
      and q.visibility = 'public' and q.stage in ('active', 'test')
      and (q.closes_at is null or q.closes_at > now())
      and (select count(*) from public.question_options complete where complete.question_id = q.id) = 2
      and not exists (select 1 from public.votes mine where mine.question_id = q.id and mine.user_id = caller_id)
      and not exists (select 1 from public.question_skips skip where skip.question_id = q.id and skip.user_id = caller_id)
      and not exists (select 1 from public.blocks b where b.blocker_id = caller_id and b.blocked_id = q.author_id)
      and not exists (select 1 from public.question_exposures seen where seen.question_id = q.id and seen.user_id = caller_id and seen.surface = 'feed')
  ) into has_more;

  if has_more then
    update public.feed_sessions fs set next_ordinal = last_ordinal + 1 where fs.id = active_session_id;
    next_cursor_value := replace(encode(convert_to(jsonb_build_object(
      'session_id', active_session_id, 'ordinal', last_ordinal + 1
    )::text, 'UTF8'), 'base64'), E'\n', '');
  end if;

  return query
  select fsi.question_id,
    max(qo.body) filter (where qo.code = 'A'), max(qo.body) filter (where qo.code = 'B'),
    q.description, q.category, q.visibility, q.closes_at,
    exists (select 1 from public.daily_questions dq where dq.question_id = q.id), q.stage,
    coalesce(jsonb_object_agg(ovw.value_axis_id, ovw.weight) filter (where qo.code = 'A' and ovw.value_axis_id is not null), '{}'::jsonb),
    coalesce(jsonb_object_agg(ovw.value_axis_id, ovw.weight) filter (where qo.code = 'B' and ovw.value_axis_id is not null), '{}'::jsonb),
    fsi.quality_score, fsi.feed_score, next_cursor_value
  from public.feed_session_items fsi
  join public.questions q on q.id = fsi.question_id
  join public.question_options qo on qo.question_id = q.id
  left join public.option_value_weights ovw on ovw.option_id = qo.id
  where fsi.session_id = active_session_id and fsi.ordinal = any(delivered_ordinals)
    and q.visibility = 'public' and q.stage in ('active', 'test')
    and (q.closes_at is null or q.closes_at > now())
    and (select count(*) from public.question_options complete where complete.question_id = q.id) = 2
    and not exists (select 1 from public.votes mine where mine.question_id = q.id and mine.user_id = caller_id)
    and not exists (select 1 from public.question_skips skip where skip.question_id = q.id and skip.user_id = caller_id)
    and not exists (select 1 from public.blocks b where b.blocker_id = caller_id and b.blocked_id = q.author_id)
  group by fsi.session_id, fsi.ordinal, fsi.question_id, fsi.quality_score, fsi.feed_score,
    q.id, next_cursor_value
  order by fsi.ordinal;

  if not has_more then
    delete from public.feed_sessions fs where fs.id = active_session_id;
  end if;
end;
$$;

create function public.record_skip(question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if not exists (select 1 from public.questions q where q.id = record_skip.question_id) then
    raise exception 'question not found' using errcode = 'P0002';
  end if;
  insert into public.question_skips (question_id, user_id)
  values (record_skip.question_id, auth.uid())
  on conflict on constraint question_skips_question_id_user_id_key do nothing;
end;
$$;

create function public.create_question(
  p_option_a text, p_option_b text, p_description text, p_category text, p_visibility text, p_closes_at timestamptz
)
returns table (
  question_id uuid, option_a text, option_b text, description text, category text,
  visibility text, closes_at timestamptz, is_daily boolean, stage text,
  weights_a jsonb, weights_b jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  created_id uuid;
  created_stage text;
begin
  if caller_id is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_visibility not in ('public', 'link') then raise exception 'invalid visibility' using errcode = '22023'; end if;
  if length(btrim(p_option_a)) = 0 or length(btrim(p_option_b)) = 0 or btrim(lower(p_option_a)) = btrim(lower(p_option_b)) then
    raise exception 'options must be non-empty and different' using errcode = '22023';
  end if;
  created_stage := case p_visibility when 'public' then 'test' else 'pending' end;
  insert into public.questions (author_id, description, category, visibility, stage, closes_at)
  values (caller_id, p_description, p_category, p_visibility, created_stage, p_closes_at)
  returning id into created_id;
  insert into public.question_options (question_id, code, body)
  values (created_id, 'A', btrim(p_option_a)), (created_id, 'B', btrim(p_option_b));
  return query select created_id, btrim(p_option_a), btrim(p_option_b), p_description,
    p_category, p_visibility, p_closes_at, false,
    created_stage, '{}'::jsonb, '{}'::jsonb;
end;
$$;

create function public.get_vote_evidence()
returns table (question_id uuid, choice text, weights jsonb, category text)
language sql
security definer
set search_path = ''
as $$
  select v.question_id, qo.code,
    coalesce(jsonb_object_agg(ovw.value_axis_id, ovw.weight) filter (where ovw.value_axis_id is not null), '{}'::jsonb),
    q.category
  from public.votes v
  join public.questions q on q.id = v.question_id
  join public.question_options qo on qo.id = v.option_id
  left join public.option_value_weights ovw on ovw.option_id = qo.id
  where auth.uid() is not null and v.user_id = auth.uid()
  group by v.question_id, qo.code, q.category, v.created_at
  order by v.created_at;
$$;

revoke all on function public.cast_vote(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.get_daily_question(date) from public, anon, authenticated;
revoke all on function public.get_feed(text, integer) from public, anon, authenticated;
revoke all on function public.record_skip(uuid) from public, anon, authenticated;
revoke all on function public.get_shared_question(uuid) from public, anon, authenticated;
revoke all on function public.create_question(text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.get_vote_evidence() from public, anon, authenticated;

grant execute on function public.cast_vote(uuid, text, uuid) to authenticated, service_role;
grant execute on function public.get_daily_question(date) to authenticated, service_role;
grant execute on function public.get_feed(text, integer) to authenticated, service_role;
grant execute on function public.record_skip(uuid) to authenticated, service_role;
grant execute on function public.get_shared_question(uuid) to authenticated, service_role;
grant execute on function public.create_question(text, text, text, text, text, timestamptz) to authenticated, service_role;
grant execute on function public.get_vote_evidence() to authenticated, service_role;
