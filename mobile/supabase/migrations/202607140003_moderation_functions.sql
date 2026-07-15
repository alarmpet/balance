alter table public.reports
  add column trusted_weight smallint not null default 0 check (trusted_weight in (0, 1)),
  add column resolved_at timestamptz,
  add column resolved_by uuid references auth.users(id) on delete set null;

create table public.report_attempts (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index report_attempts_reporter_created_at_idx
  on public.report_attempts (reporter_id, created_at desc);
create index reports_unresolved_trusted_idx
  on public.reports (question_id)
  where resolved_at is null and trusted_weight = 1;

alter table public.report_attempts enable row level security;
revoke all privileges on public.report_attempts from public, anon, authenticated;
grant all privileges on public.report_attempts to service_role;

revoke insert, update, delete, truncate on public.reason_reactions, public.reports, public.blocks from authenticated;
grant select on public.reason_reactions, public.reports, public.blocks to authenticated;

create function public.react_reason(question_id uuid, reason_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if react_reason.reason_code not in ('realistic', 'emotional', 'money', 'time', 'neither', 'undecided') then
    raise exception 'invalid reason code' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('reason-reaction:' || caller_id::text || ':' || react_reason.question_id::text, 0)
  );

  if not exists (
    select 1
    from public.votes v
    where v.question_id = react_reason.question_id and v.user_id = caller_id
  ) then
    raise exception 'vote required before reaction' using errcode = '42501';
  end if;

  insert into public.reason_reactions (question_id, user_id, reason_code)
  values (react_reason.question_id, caller_id, react_reason.reason_code)
  on conflict on constraint reason_reactions_question_id_user_id_key do update
    set reason_code = excluded.reason_code,
        updated_at = now();
end;
$$;

create function public.report_question(question_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  attempted_at timestamptz := clock_timestamp();
  is_trusted boolean;
  inserted_report_id uuid;
  unresolved_trusted_weight integer;
  target_stage text;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if report_question.reason is null
    or length(btrim(report_question.reason)) = 0
    or length(report_question.reason) > 100 then
    raise exception 'invalid report reason' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('report-rate:' || caller_id::text, 0));

  if (select count(*) from public.report_attempts a
      where a.reporter_id = caller_id and a.created_at > attempted_at - interval '1 hour') >= 10
    or (select count(*) from public.report_attempts a
        where a.reporter_id = caller_id and a.created_at > attempted_at - interval '1 day') >= 30 then
    raise exception 'REPORT_RATE_LIMITED' using errcode = 'P0001';
  end if;

  insert into public.report_attempts (reporter_id, created_at)
  values (caller_id, attempted_at);

  select q.stage into target_stage
  from public.questions q
  where q.id = report_question.question_id
  for update;
  if not found then
    raise exception 'question not found' using errcode = 'P0002';
  end if;

  is_trusted := not coalesce((auth.jwt()->>'is_anonymous')::boolean, true)
    or (select count(*) from public.votes v where v.user_id = caller_id) >= 10;

  insert into public.reports (reporter_id, question_id, reason, trusted_weight)
  values (caller_id, report_question.question_id, btrim(report_question.reason), is_trusted::integer)
  on conflict on constraint reports_reporter_id_question_id_key do nothing
  returning id into inserted_report_id;

  if inserted_report_id is not null and is_trusted and target_stage in ('active', 'test') then
    select coalesce(sum(r.trusted_weight), 0)::integer
    into unresolved_trusted_weight
    from public.reports r
    where r.question_id = report_question.question_id and r.resolved_at is null;

    if unresolved_trusted_weight >= 3 then
      update public.questions q
      set stage = 'limited', updated_at = now()
      where q.id = report_question.question_id and q.stage in ('active', 'test');
    end if;
  end if;
end;
$$;

create function public.block_user(blocked_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if block_user.blocked_user_id = caller_id then
    raise exception 'cannot block yourself' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('feed:' || caller_id::text || ':feed', 0));
  perform pg_advisory_xact_lock(
    hashtextextended('user-block:' || caller_id::text || ':' || block_user.blocked_user_id::text, 0)
  );

  insert into public.blocks (blocker_id, blocked_id)
  select caller_id, p.id
  from public.profiles p
  where p.id = block_user.blocked_user_id
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

revoke all on function public.react_reason(uuid, text) from public, anon, authenticated;
revoke all on function public.report_question(uuid, text) from public, anon, authenticated;
revoke all on function public.block_user(uuid) from public, anon, authenticated;

grant execute on function public.react_reason(uuid, text) to authenticated, service_role;
grant execute on function public.report_question(uuid, text) to authenticated, service_role;
grant execute on function public.block_user(uuid) to authenticated, service_role;
