create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  event text not null check (event in ('first_vote','meaningful_sample','question_closed')),
  status text not null default 'pending' check (status in ('pending','processing','processed','error')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (question_id, event)
);
alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from public,anon,authenticated;
grant all on public.notification_outbox to service_role;

create function public.enqueue_question_vote_notifications() returns trigger
language plpgsql security definer set search_path = '' as $$
declare vote_count integer; owner_id uuid;
begin
  select count(*)::integer, q.author_id into vote_count, owner_id
  from public.votes v join public.questions q on q.id=new.question_id
  where v.question_id=new.question_id group by q.author_id;
  if owner_id is null then return new; end if;
  if vote_count=1 then
    insert into public.notification_outbox(user_id,question_id,event)
    values(owner_id,new.question_id,'first_vote') on conflict(question_id,event) do nothing;
  end if;
  if vote_count=20 then
    insert into public.notification_outbox(user_id,question_id,event)
    values(owner_id,new.question_id,'meaningful_sample') on conflict(question_id,event) do nothing;
  end if;
  return new;
end $$;
create trigger votes_enqueue_notification_milestones after insert on public.votes
for each row execute function public.enqueue_question_vote_notifications();

create function public.enqueue_closed_question_notifications(p_limit integer default 100)
returns integer language plpgsql security definer set search_path = '' as $$
declare inserted integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
  insert into public.notification_outbox(user_id,question_id,event)
  select q.author_id,q.id,'question_closed' from public.questions q
  where q.author_id is not null and q.closes_at is not null and q.closes_at<=now()
  order by q.closes_at limit greatest(1,least(p_limit,500))
  on conflict(question_id,event) do nothing;
  get diagnostics inserted=row_count; return inserted;
end $$;

create function public.claim_notification_outbox(p_limit integer default 25)
returns setof public.notification_outbox language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
  return query with due as (
    select o.id from public.notification_outbox o
    where (o.status='pending' and o.available_at<=now())
       or (o.status='processing' and o.claimed_at<now()-interval '5 minutes')
    order by o.created_at for update skip locked limit greatest(1,least(p_limit,100))
  ), claimed as (
    update public.notification_outbox o set status='processing',claimed_at=now(),attempts=o.attempts+1,last_error=null
    from due where o.id=due.id returning o.*
  ) select * from claimed;
end $$;

create function public.complete_notification_outbox(p_id uuid, p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
  update public.notification_outbox set
    status=case when p_error is null then 'processed' else case when attempts<5 then 'pending' else 'error' end end,
    processed_at=case when p_error is null then now() else null end,
    available_at=case when p_error is null then available_at else now()+make_interval(secs=>least(300,30*attempts)) end,
    last_error=left(p_error,500)
  where id=p_id and status='processing';
end $$;

revoke all on function public.enqueue_closed_question_notifications(integer), public.claim_notification_outbox(integer), public.complete_notification_outbox(uuid,text) from public,anon,authenticated;
grant execute on function public.enqueue_closed_question_notifications(integer), public.claim_notification_outbox(integer), public.complete_notification_outbox(uuid,text) to service_role;

revoke insert,update,delete on public.questions from authenticated;
revoke insert,update,delete on public.question_options from authenticated;

create or replace function public.create_question(
  p_option_a text,p_option_b text,p_description text,p_category text,p_visibility text,p_closes_at timestamptz
) returns table(question_id uuid,option_a text,option_b text,description text,category text,visibility text,closes_at timestamptz,is_daily boolean,stage text,weights_a jsonb,weights_b jsonb)
language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=auth.uid(); created_id uuid; created_stage text; a text:=btrim(p_option_a); b text:=btrim(p_option_b); normalized_a text; normalized_b text;
begin
  if caller_id is null then raise exception 'authentication required' using errcode='28000'; end if;
  if p_visibility not in ('public','link') then raise exception 'invalid visibility' using errcode='22023'; end if;
  if char_length(a) not between 1 and 40 or char_length(b) not between 1 and 40 then raise exception 'option length must be 1..40' using errcode='22023'; end if;
  normalized_a:=lower(normalize(a,NFKC)); normalized_b:=lower(normalize(b,NFKC));
  if normalized_a=normalized_b then raise exception 'options must be different' using errcode='22023'; end if;
  if p_description is not null and char_length(btrim(p_description))>120 then raise exception 'description is too long' using errcode='22023'; end if;
  if p_category is null or char_length(btrim(p_category)) not between 1 and 30 then raise exception 'invalid category' using errcode='22023'; end if;
  if p_closes_at is not null and p_closes_at<=now() then raise exception 'close time must be in the future' using errcode='22023'; end if;
  created_stage:=case p_visibility when 'public' then 'test' else 'pending' end;
  insert into public.questions(author_id,description,category,visibility,stage,closes_at)
  values(caller_id,nullif(btrim(p_description),''),btrim(p_category),p_visibility,created_stage,p_closes_at) returning id into created_id;
  insert into public.question_options(question_id,code,body) values(created_id,'A',a),(created_id,'B',b);
  return query select created_id,a,b,nullif(btrim(p_description),''),btrim(p_category),p_visibility,p_closes_at,false,created_stage,'{}'::jsonb,'{}'::jsonb;
end $$;
revoke all on function public.create_question(text,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.create_question(text,text,text,text,text,timestamptz) to authenticated,service_role;
