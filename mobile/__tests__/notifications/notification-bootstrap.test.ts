import { readFileSync } from 'node:fs';
import path from 'node:path';

test('production cron dispatches lifecycle, retries, and receipts with Vault credentials', () => {
  const sql = readFileSync(path.resolve(__dirname, '../../supabase/bootstrap/notification-cron.sql'), 'utf8');
  expect(sql).toContain("'balance-notification-outbox'");
  expect(sql).toContain("'balance-notification-retries'");
  expect(sql).toContain('{"action":"dispatch_retries"}');
  expect(sql).toContain("'balance-notification-receipts'");
  expect(sql).toContain('notification_service_role_key');
  expect(sql).toContain('{"action":"scan_closed"}');
  expect(sql).not.toMatch(/cron\.schedule\([\s\S]*?select public\.enqueue_closed_question_notifications/);
  expect(sql).toContain("'apikey',(select decrypted_secret");
});

test('meaningful sample threshold is not duplicated in Edge environment configuration', () => {
  const edge = readFileSync(path.resolve(__dirname, '../../supabase/functions/send-question-notification/index.ts'), 'utf8');
  expect(edge).not.toContain('MEANINGFUL_SAMPLE_THRESHOLD');
  expect(edge).toContain('notification_event_eligible');
});
