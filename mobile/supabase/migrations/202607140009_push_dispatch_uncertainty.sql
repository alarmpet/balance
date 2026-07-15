alter table public.notification_deliveries drop constraint if exists notification_deliveries_status_check;
alter table public.notification_deliveries add constraint notification_deliveries_status_check
  check (status in ('pending','dispatch_started','delivery_unknown','ticket_accepted','retry_pending','delivered','error'));

-- Only retry_pending jobs are eligible for automatic resend. dispatch_started and
-- delivery_unknown deliberately remain terminal for automation (at-most-once delivery).

create or replace function public.claim_notification_retries(p_limit integer default 25)
returns setof public.notification_deliveries
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role required'; end if;
  return query
    with due as (
      select d.id
      from public.notification_deliveries d
      where d.status = 'retry_pending' and d.next_attempt_at <= now()
      order by d.next_attempt_at
      for update skip locked
      limit greatest(1, least(p_limit, 100))
    ), updated as (
      update public.notification_deliveries d
      set status = 'dispatch_started', claimed_at = now(),
          lease_expires_at = now() + interval '2 minutes',
          attempts = d.attempts + 1, last_error_code = null
      from due where d.id = due.id
      returning d.*
    )
    select * from updated;
end $$;

revoke all on function public.claim_notification_retries(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_retries(integer) to service_role;
