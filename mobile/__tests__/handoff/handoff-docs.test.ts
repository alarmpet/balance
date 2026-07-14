import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

test('environment example documents every supported local device address without secrets', () => {
  const env = read('.env.example');
  expect(env).toContain('EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321');
  expect(env).toContain('# EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321');
  expect(env).toContain('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=');
  expect(env).toContain('EXPO_PUBLIC_AUTH_CAPTCHA_REQUIRED=false');
  expect(env).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE_KEY/i);
});

test('handoff runbook contains reproducible setup, verification, deploy, rollback, and safety gates', () => {
  const readme = read('README.md');
  for (const command of [
    'npm install', 'npx supabase start', 'npx supabase db reset', 'npm run verify',
    'npx expo start', 'npx supabase test db', 'npx supabase db lint',
    'npx expo export --platform web', 'npx expo export --platform android',
  ]) expect(readme).toContain(command);
  for (const topic of [
    'Node.js 22.13+', 'LAN', 'CAPTCHA', 'APNs', 'FCM', '개인정보', '롤백',
    'Gate 1', '15명', '12명', '10명',
  ]) expect(readme).toContain(topic);
});
