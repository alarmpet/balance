alter table public.push_tokens
  add column enabled_events text[] not null
    default array['first_vote', 'meaningful_sample', 'question_closed']::text[];

alter table public.push_tokens
  add constraint push_tokens_enabled_events_allowlist check (
    enabled_events <@ array['first_vote', 'meaningful_sample', 'question_closed']::text[]
    and cardinality(enabled_events) > 0
  );

alter table public.analytics_events
  drop constraint analytics_events_event_name_check;

alter table public.analytics_events
  add constraint analytics_events_event_name_allowlist check (event_name in (
    'app_opened', 'question_impression', 'question_voted', 'question_skipped',
    'result_viewed', 'brain_progress_viewed', 'brain_type_unlocked',
    'question_create_started', 'question_created', 'question_shared',
    'shared_question_voted', 'report_submitted', 'notification_opened'
  )),
  add constraint analytics_events_properties_allowlist check (
    properties - array['sessionId', 'questionId', 'source', 'timestamp'] = '{}'::jsonb
    and (not properties ? 'sessionId' or (
      jsonb_typeof(properties->'sessionId') = 'string'
      and length(properties->>'sessionId') between 1 and 128
    ))
    and (not properties ? 'questionId' or (
      jsonb_typeof(properties->'questionId') = 'string'
      and length(properties->>'questionId') between 1 and 128
    ))
    and (not properties ? 'source' or properties->>'source' in (
      'play', 'share', 'ask', 'brain', 'profile', 'notification'
    ))
    and (not properties ? 'timestamp' or (
      jsonb_typeof(properties->'timestamp') = 'string'
      and properties->>'timestamp' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'
    ))
  );

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  event text not null check (event in ('first_vote', 'meaningful_sample', 'question_closed')),
  token text not null,
  status text not null default 'pending' check (status in ('pending', 'sent')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint notification_deliveries_idempotency_key unique (user_id, question_id, event, token),
  check ((status = 'pending' and sent_at is null) or (status = 'sent' and sent_at is not null))
);

alter table public.notification_deliveries enable row level security;

revoke all privileges on public.notification_deliveries from public, anon, authenticated;
grant all privileges on public.notification_deliveries to service_role;
