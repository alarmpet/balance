create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  description text,
  category text not null,
  visibility text not null default 'public' check (visibility in ('public', 'link')),
  stage text not null default 'pending' check (stage in ('pending', 'test', 'active', 'limited', 'hidden')),
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  code text not null check (code in ('A', 'B')),
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now(),
  unique (question_id, code),
  unique (question_id, id)
);

create table public.value_axes (
  id text primary key,
  label text not null,
  sort_order smallint not null unique check (sort_order between 1 and 8),
  created_at timestamptz not null default now()
);

insert into public.value_axes (id, label, sort_order)
values
  ('freedom', 'Freedom', 1),
  ('stability', 'Stability', 2),
  ('relationship', 'Relationship', 3),
  ('reality', 'Reality', 4),
  ('emotion', 'Emotion', 5),
  ('growth', 'Growth', 6),
  ('efficiency', 'Efficiency', 7),
  ('fun', 'Fun', 8);

create table public.option_value_weights (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.question_options(id) on delete cascade,
  value_axis_id text not null references public.value_axes(id),
  weight numeric(6, 3) not null check (weight between -10 and 10),
  created_at timestamptz not null default now(),
  unique (option_id, value_axis_id)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_action_id uuid not null,
  created_at timestamptz not null default now(),
  constraint votes_option_belongs_to_question_fkey
    foreign key (question_id, option_id)
    references public.question_options(question_id, id),
  unique (question_id, user_id),
  unique (user_id, client_action_id)
);

create table public.user_value_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value_axis_id text not null references public.value_axes(id),
  score numeric(12, 3) not null default 0,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, value_axis_id)
);

create table public.question_skips (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (question_id, user_id)
);

create table public.reason_reactions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason_code text not null check (reason_code in ('realistic', 'emotional', 'money', 'time', 'neither', 'undecided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, user_id)
);

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  active_date date not null unique,
  created_at timestamptz not null default now(),
  unique (question_id, active_date)
);

create table public.question_exposures (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null default 'feed',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  reason text not null check (length(btrim(reason)) > 0),
  details text,
  created_at timestamptz not null default now(),
  unique (reporter_id, question_id)
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (length(btrim(event_name)) > 0),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  created_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create trigger reason_reactions_set_updated_at
before update on public.reason_reactions
for each row execute function public.set_updated_at();

create trigger push_tokens_set_updated_at
before update on public.push_tokens
for each row execute function public.set_updated_at();

create trigger user_value_scores_set_updated_at
before update on public.user_value_scores
for each row execute function public.set_updated_at();

create function public.provision_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger auth_user_provisions_profile
after insert on auth.users
for each row execute function public.provision_user_profile();

create function public.assert_active_question_options(target_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  option_count integer;
  a_count integer;
  b_count integer;
begin
  if exists (
    select 1 from public.questions
    where id = target_question_id and stage = 'active'
  ) then
    select count(*), count(*) filter (where code = 'A'), count(*) filter (where code = 'B')
    into option_count, a_count, b_count
    from public.question_options
    where question_id = target_question_id;

    if option_count <> 2 or a_count <> 1 or b_count <> 1 then
      raise exception 'active question % must have exactly one A and one B option', target_question_id
        using errcode = '23514';
    end if;
  end if;
end;
$$;

create function public.enforce_active_question_options()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'questions' then
    perform public.assert_active_question_options(coalesce(new.id, old.id));
  elsif tg_op = 'INSERT' then
    perform public.assert_active_question_options(new.question_id);
  elsif tg_op = 'DELETE' then
    perform public.assert_active_question_options(old.question_id);
  else
    perform public.assert_active_question_options(old.question_id);
    if new.question_id is distinct from old.question_id then
      perform public.assert_active_question_options(new.question_id);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create constraint trigger questions_require_complete_options
after insert or update of stage on public.questions
deferrable initially deferred
for each row execute function public.enforce_active_question_options();

create constraint trigger active_question_options_remain_complete
after insert or update or delete on public.question_options
deferrable initially deferred
for each row execute function public.enforce_active_question_options();

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.votes enable row level security;
alter table public.question_skips enable row level security;
alter table public.reason_reactions enable row level security;
alter table public.value_axes enable row level security;
alter table public.option_value_weights enable row level security;
alter table public.user_value_scores enable row level security;
alter table public.daily_questions enable row level security;
alter table public.question_exposures enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.push_tokens enable row level security;
alter table public.analytics_events enable row level security;

create policy "users read their own profile"
on public.profiles for select
using (id = (select auth.uid()));
create policy "users update their own profile"
on public.profiles for update
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "active public questions are readable"
on public.questions for select
using ((visibility = 'public' and stage = 'active') or author_id = (select auth.uid()));
create policy "authors create their own questions"
on public.questions for insert
with check (
  author_id = auth.uid()
  and (
    (visibility = 'public' and stage = 'test')
    or (visibility = 'link' and stage = 'pending')
  )
);

create policy "read options for readable questions"
on public.question_options for select
using (exists (select 1 from public.questions where questions.id = question_options.question_id));
create policy "authors manage their question options"
on public.question_options for all
using (exists (select 1 from public.questions where questions.id = question_options.question_id and questions.author_id = (select auth.uid())))
with check (exists (select 1 from public.questions where questions.id = question_options.question_id and questions.author_id = (select auth.uid())));

create policy "users read their own votes"
on public.votes for select
using (user_id = auth.uid());

create policy "users read their own value scores"
on public.user_value_scores for select
using (user_id = (select auth.uid()));

create policy "users read their own skips"
on public.question_skips for select
using (user_id = (select auth.uid()));
create policy "users create their own skips"
on public.question_skips for insert
with check (user_id = (select auth.uid()));

create policy "users manage their own reason reactions"
on public.reason_reactions for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "value axes are readable"
on public.value_axes for select
using (true);

create policy "weights for readable questions are readable"
on public.option_value_weights for select
using (
  exists (
    select 1
    from public.question_options
    where question_options.id = option_value_weights.option_id
  )
);

create policy "active daily questions are readable"
on public.daily_questions for select
using (exists (select 1 from public.questions where questions.id = daily_questions.question_id));

create policy "users read their own exposures"
on public.question_exposures for select
using (user_id = (select auth.uid()));

create policy "users create their own reports"
on public.reports for insert
with check (reporter_id = (select auth.uid()));
create policy "users read their own reports"
on public.reports for select
using (reporter_id = (select auth.uid()));

create policy "users manage blocks they created"
on public.blocks for all
using (blocker_id = (select auth.uid()))
with check (blocker_id = (select auth.uid()));

create policy "users manage their own push tokens"
on public.push_tokens for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users create their own analytics events"
on public.analytics_events for insert
with check (user_id = (select auth.uid()));

revoke usage on schema public from public, anon;
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all functions in schema public from public, anon;
revoke all privileges on all tables in schema public from authenticated;
revoke all privileges on all sequences in schema public from authenticated;
revoke all privileges on all functions in schema public from authenticated;

grant usage on schema public to authenticated, service_role;
grant select, update on public.profiles to authenticated;
grant select, insert on public.questions to authenticated;
grant select, insert, update, delete on public.question_options to authenticated;
grant select on public.votes to authenticated;
grant select on public.user_value_scores to authenticated;
grant select, insert on public.question_skips to authenticated;
grant select, insert, update, delete on public.reason_reactions to authenticated;
grant select on public.value_axes, public.option_value_weights, public.daily_questions to authenticated;
grant select on public.question_exposures to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert, update, delete on public.blocks, public.push_tokens to authenticated;
grant insert on public.analytics_events to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
