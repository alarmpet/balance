alter table public.notification_deliveries
  add column if not exists next_attempt_at timestamptz,
  add column if not exists last_error_code text;

alter table public.notification_deliveries drop constraint if exists notification_deliveries_status_check;
alter table public.notification_deliveries add constraint notification_deliveries_status_check
  check (status in ('pending','dispatching','ticket_accepted','retry_pending','delivered','error'));

create or replace function public.claim_notification_retries(p_limit integer default 25)
returns setof public.notification_deliveries
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role required'; end if;
  return query
    with due as (
      select d.id from public.notification_deliveries d
      where (d.status = 'retry_pending' and d.next_attempt_at <= now())
         or (d.status = 'dispatch_started' and d.last_error_code is not null and d.lease_expires_at <= now())
      order by d.next_attempt_at for update skip locked limit greatest(1, least(p_limit, 100))
    ), updated as (
      update public.notification_deliveries d set status='dispatch_started', claimed_at=now(),
        lease_expires_at=now()+interval '2 minutes', attempts=d.attempts+1
      from due where d.id=due.id returning d.*
    ) select * from updated;
end $$;
revoke all on function public.claim_notification_retries(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_retries(integer) to service_role;
