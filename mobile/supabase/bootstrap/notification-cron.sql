-- Run once in each hosted project after replacing the three values. Never commit real secrets.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select vault.create_secret('https://PROJECT_REF.supabase.co','notification_project_url');
select vault.create_secret('SERVICE_ROLE_KEY','notification_service_role_key');
select vault.create_secret('A_RANDOM_32_PLUS_CHARACTER_SECRET','notification_function_secret');

select cron.schedule('balance-close-notifications','* * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='notification_project_url') || '/functions/v1/send-question-notification',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key'),
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key'),
      'x-notification-secret',(select decrypted_secret from vault.decrypted_secrets where name='notification_function_secret')
    ),
    body := '{"action":"scan_closed"}'::jsonb
  );
$$);

select cron.schedule('balance-notification-outbox','* * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='notification_project_url') || '/functions/v1/send-question-notification',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key'),
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key'),
      'x-notification-secret',(select decrypted_secret from vault.decrypted_secrets where name='notification_function_secret')
    ),
    body := '{"action":"dispatch_outbox"}'::jsonb
  );
$$);

select cron.schedule('balance-notification-retries','* * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='notification_project_url') || '/functions/v1/send-question-notification',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key'),
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key'),
      'x-notification-secret',(select decrypted_secret from vault.decrypted_secrets where name='notification_function_secret')
    ),
    body := '{"action":"dispatch_retries"}'::jsonb
  );
$$);

select cron.schedule('balance-notification-receipts','*/5 * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='notification_project_url') || '/functions/v1/send-question-notification',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key'),'apikey',(select decrypted_secret from vault.decrypted_secrets where name='notification_service_role_key')),
    body := '{"action":"poll_receipts"}'::jsonb
  );
$$);
