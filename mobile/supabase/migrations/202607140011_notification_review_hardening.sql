create table public.notification_settings (
  singleton boolean primary key default true check (singleton),
  meaningful_sample_threshold integer not null check (meaningful_sample_threshold between 2 and 10000)
);
insert into public.notification_settings(singleton,meaningful_sample_threshold) values(true,20);
alter table public.notification_settings enable row level security;
revoke all on public.notification_settings from public,anon,authenticated;
grant all on public.notification_settings to service_role;

create or replace function public.enqueue_question_vote_notifications() returns trigger
language plpgsql security definer set search_path='' as $$
declare vote_count integer; owner_id uuid; sample_threshold integer;
begin
  select count(*)::integer,q.author_id into vote_count,owner_id
  from public.votes v join public.questions q on q.id=new.question_id
  where v.question_id=new.question_id group by q.author_id;
  select ns.meaningful_sample_threshold into strict sample_threshold from public.notification_settings ns where ns.singleton;
  if owner_id is null then return new; end if;
  if vote_count=1 then
    insert into public.notification_outbox(user_id,question_id,event) values(owner_id,new.question_id,'first_vote')
    on conflict(question_id,event) do nothing;
  end if;
  if vote_count=sample_threshold then
    insert into public.notification_outbox(user_id,question_id,event) values(owner_id,new.question_id,'meaningful_sample')
    on conflict(question_id,event) do nothing;
  end if;
  return new;
end $$;

create or replace function public.enqueue_closed_question_notifications(p_limit integer default 100)
returns integer language plpgsql security definer set search_path='' as $$
declare inserted integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
  insert into public.notification_outbox(user_id,question_id,event)
  select q.author_id,q.id,'question_closed' from public.questions q
  where q.author_id is not null and q.closes_at is not null and q.closes_at<=now()
    and not exists(select 1 from public.notification_outbox o where o.question_id=q.id and o.event='question_closed')
  order by q.closes_at,q.id limit greatest(1,least(p_limit,500))
  on conflict(question_id,event) do nothing;
  get diagnostics inserted=row_count; return inserted;
end $$;

create function public.notification_event_eligible(p_user_id uuid,p_event text,p_question_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare target public.questions%rowtype; vote_count integer; sample_threshold integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
  if p_event not in ('first_vote','meaningful_sample','question_closed') then return false; end if;
  select * into target from public.questions q where q.id=p_question_id and q.author_id=p_user_id;
  if not found then return false; end if;
  if p_event='question_closed' then return target.closes_at is not null and target.closes_at<=now(); end if;
  select count(*)::integer into vote_count from public.votes v where v.question_id=p_question_id;
  if p_event='first_vote' then return vote_count>=1; end if;
  select ns.meaningful_sample_threshold into strict sample_threshold from public.notification_settings ns where ns.singleton;
  return vote_count>=sample_threshold;
end $$;
revoke all on function public.notification_event_eligible(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.notification_event_eligible(uuid,text,uuid) to service_role;
