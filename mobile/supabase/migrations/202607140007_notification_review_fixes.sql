alter table public.push_tokens
  add column installation_id uuid,
  add column revocation_key_hash text;

create unique index push_tokens_installation_id_key
  on public.push_tokens(installation_id) where installation_id is not null;

alter table public.push_tokens
  alter column enabled_events set default '{}'::text[];
update public.push_tokens set enabled_events = '{}'::text[];
alter table public.push_tokens drop constraint push_tokens_enabled_events_allowlist;
alter table public.push_tokens add constraint push_tokens_enabled_events_allowlist check (
  enabled_events <@ array['first_vote', 'meaningful_sample', 'question_closed']::text[]
);

drop policy "users manage their own push tokens" on public.push_tokens;
create policy "users read their own push tokens"
  on public.push_tokens for select using (user_id = (select auth.uid()));
revoke insert, update, delete on public.push_tokens from authenticated;

create function public.replace_push_token(
  p_installation_id uuid,
  p_token text,
  p_platform text,
  p_enabled_events text[],
  p_revocation_key text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  installation_lock bigint := hashtextextended(p_installation_id::text, 71);
  token_lock bigint := hashtextextended(p_token, 72);
begin
  if caller_id is null then raise exception 'authentication required' using errcode='28000'; end if;
  if p_platform not in ('ios','android') then raise exception 'invalid platform' using errcode='22023'; end if;
  if p_token !~ '^ExponentPushToken\[[A-Za-z0-9_-]+\]$' then raise exception 'invalid Expo token' using errcode='22023'; end if;
  if p_enabled_events is null or not p_enabled_events <@ array['first_vote','meaningful_sample','question_closed']::text[] then
    raise exception 'invalid notification preferences' using errcode='22023';
  end if;
  if p_revocation_key !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'invalid revocation key' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(least(installation_lock, token_lock));
  perform pg_advisory_xact_lock(greatest(installation_lock, token_lock));
  if exists (
    select 1 from public.push_tokens pt
    where (pt.installation_id=p_installation_id or pt.token=p_token)
      and not (
        pt.revocation_key_hash=encode(extensions.digest(p_revocation_key,'sha256'),'hex')
        or (pt.revocation_key_hash is null and cardinality(pt.enabled_events)=0)
      )
  ) then raise exception 'installation proof mismatch' using errcode='42501'; end if;
  delete from public.push_tokens where installation_id = p_installation_id or token = p_token;
  insert into public.push_tokens(user_id, token, platform, enabled_events, installation_id, revocation_key_hash)
  values (caller_id, p_token, p_platform, p_enabled_events, p_installation_id,
    encode(extensions.digest(p_revocation_key, 'sha256'), 'hex'));
end;
$$;

create function public.revoke_push_token(p_installation_id uuid, p_revocation_key text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare removed integer;
begin
  if p_revocation_key !~ '^[A-Za-z0-9_-]{32,128}$' then return false; end if;
  delete from public.push_tokens
  where installation_id = p_installation_id
    and revocation_key_hash = encode(extensions.digest(p_revocation_key, 'sha256'), 'hex');
  get diagnostics removed = row_count;
  return removed = 1;
end;
$$;

revoke all on function public.replace_push_token(uuid,text,text,text[],text) from public,anon,authenticated;
grant execute on function public.replace_push_token(uuid,text,text,text[],text) to authenticated,service_role;
revoke all on function public.revoke_push_token(uuid,text) from public,anon,authenticated;
grant execute on function public.revoke_push_token(uuid,text) to service_role;

alter table public.notification_deliveries
  add column claimed_at timestamptz not null default now(),
  add column lease_expires_at timestamptz not null default (now() + interval '5 minutes'),
  add column attempts integer not null default 1 check (attempts > 0),
  add column ticket_id text,
  add column ticket_status text,
  add column error_code text,
  add column receipt_checked_at timestamptz;
alter table public.notification_deliveries drop constraint if exists notification_deliveries_status_check;
alter table public.notification_deliveries drop constraint if exists notification_deliveries_check;
-- Upgrade existing Task 11 rows before narrowing the status vocabulary.
update public.notification_deliveries
set status = 'delivered',
    sent_at = coalesce(sent_at, created_at),
    receipt_checked_at = coalesce(receipt_checked_at, sent_at, created_at)
where status = 'sent';
alter table public.notification_deliveries add constraint notification_deliveries_status_check
  check (status in ('pending','dispatching','ticket_accepted','delivered','error'));
create unique index notification_deliveries_ticket_id_key
  on public.notification_deliveries(ticket_id) where ticket_id is not null;

create function public.claim_notification_delivery(
  p_user_id uuid, p_question_id uuid, p_event text, p_token text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare claimed boolean;
begin
  if p_event not in ('first_vote','meaningful_sample','question_closed') then
    raise exception 'invalid notification event' using errcode='22023';
  end if;
  insert into public.notification_deliveries(user_id,question_id,event,token,status,claimed_at,lease_expires_at,attempts)
  values (p_user_id,p_question_id,p_event,p_token,'pending',now(),now()+interval '5 minutes',1)
  on conflict on constraint notification_deliveries_idempotency_key do update
    set claimed_at=now(), lease_expires_at=now()+interval '5 minutes', attempts=public.notification_deliveries.attempts+1,
        error_code=null
    where public.notification_deliveries.status='pending'
      and public.notification_deliveries.lease_expires_at <= now()
  returning true into claimed;
  return coalesce(claimed,false);
end;
$$;
revoke all on function public.claim_notification_delivery(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_notification_delivery(uuid,uuid,text,text) to service_role;

create function public.get_closed_question_result(target_question_id uuid)
returns table (
  question_id uuid, option_a text, option_b text, description text, category text,
  visibility text, closes_at timestamptz, stage text, weights_a jsonb, weights_b jsonb,
  count_a bigint, count_b bigint, percent_a integer, percent_b integer, result_label text
)
language plpgsql security definer set search_path = ''
as $$
declare caller_id uuid := auth.uid(); target public.questions%rowtype;
begin
  if caller_id is null then raise exception 'authentication required' using errcode='28000'; end if;
  select * into target from public.questions q where q.id=target_question_id;
  if not found or target.closes_at is null or target.closes_at > now() then
    raise exception 'closed question not found' using errcode='P0002';
  end if;
  if caller_id <> target.author_id and not exists (
    select 1 from public.votes v where v.question_id=target_question_id and v.user_id=caller_id
  ) then raise exception 'closed result access denied' using errcode='42501'; end if;
  if target.stage='hidden' and caller_id <> target.author_id then
    raise exception 'closed result access denied' using errcode='42501';
  end if;
  return query
  with totals as (
    select count(*) filter(where qo.code='A')::bigint a, count(*) filter(where qo.code='B')::bigint b
    from public.votes v join public.question_options qo on qo.id=v.option_id
    where v.question_id=target_question_id
  )
  select target.id,
    max(qo.body) filter(where qo.code='A'), max(qo.body) filter(where qo.code='B'),
    target.description,target.category,target.visibility,target.closes_at,target.stage,
    coalesce(jsonb_object_agg(ovw.value_axis_id,ovw.weight) filter(where qo.code='A' and ovw.value_axis_id is not null),'{}'::jsonb),
    coalesce(jsonb_object_agg(ovw.value_axis_id,ovw.weight) filter(where qo.code='B' and ovw.value_axis_id is not null),'{}'::jsonb),
    totals.a,totals.b,
    case when totals.a+totals.b=0 then 0 else round(100.0*totals.a/(totals.a+totals.b))::integer end,
    case when totals.a+totals.b=0 then 0 else 100-round(100.0*totals.a/(totals.a+totals.b))::integer end,
    case when totals.a+totals.b=0 then '결과 없음'
      when 100.0*totals.a/(totals.a+totals.b) between 48 and 52 then '초접전'
      when totals.a>totals.b then 'A 우세' else 'B 우세' end
  from public.question_options qo left join public.option_value_weights ovw on ovw.option_id=qo.id
  cross join totals where qo.question_id=target.id
  group by totals.a,totals.b;
end;
$$;
revoke all on function public.get_closed_question_result(uuid) from public,anon,authenticated;
grant execute on function public.get_closed_question_result(uuid) to authenticated,service_role;

alter table public.analytics_events drop constraint analytics_events_properties_allowlist;
alter table public.analytics_events add constraint analytics_events_properties_allowlist check (
  properties - array['sessionId','questionId','source','timestamp']='{}'::jsonb
  and (not properties ? 'sessionId' or (
    jsonb_typeof(properties->'sessionId')='string'
    and properties->>'sessionId' ~ '^[A-Za-z0-9_-]{16,128}$'
  ))
  and (not properties ? 'questionId' or (
    jsonb_typeof(properties->'questionId')='string'
    and properties->>'questionId' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  ))
  and (not properties ? 'source' or properties->>'source' in ('play','share','ask','brain','profile','notification'))
  and (not properties ? 'timestamp' or (
    jsonb_typeof(properties->'timestamp')='string'
    and properties->>'timestamp' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'
  ))
);
