# OAuth Provider Console Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Google and Kakao OAuth provider credentials for the live Supabase project so Balance Island social login can complete through `/auth/callback`.

**Architecture:** Keep Supabase Auth as the only app session owner. The agent opens official dashboards, navigates setup screens, enters non-secret values, and runs smoke checks; the user handles dashboard sign-in and any secret value exposure/approval. Provider credentials are saved only in Supabase and provider consoles, never in repo files, chat logs, screenshots, or timeline entries.

**Tech Stack:** Supabase Auth, Google Auth Platform / Google Cloud Console, Kakao Developers, Expo Router web callback, Chrome/CDP smoke checks, `@supabase/supabase-js`.

---

## Source Notes

- Supabase redirect URLs: `redirectTo` must match Supabase Auth URL Configuration; Site URL is the default redirect target, and Vercel preview/local redirect patterns should be explicitly allow-listed.
- Supabase Google provider: create or choose a Google OAuth client of type `Web application`; add the app origin under Authorized JavaScript origins; add the Supabase callback URL under Authorized redirect URIs; save Client ID and Client Secret into the Supabase Google provider panel.
- Google consent/data access: Supabase Auth needs `openid`, `.../auth/userinfo.email`, and `.../auth/userinfo.profile`. If the Google OAuth app is in Testing publishing status, the Google account used for smoke testing must be listed as a test user.
- Google OAuth client handling: Google identifies apps with a Client ID and may issue a Client Secret; for web applications, authorized origins and redirect URIs must be configured, and client secrets should be stored securely.
- Supabase Kakao provider: Kakao uses the REST API key as `client_id` and Kakao Login Client Secret as `client_secret`; Supabase needs both values and the built-in `kakao` provider enabled.
- Kakao prerequisites: Kakao Login usage must be ON, a Redirect URI must be registered or login fails, and the REST API key's Client Secret setting may require the secret during token issuance.
- Kakao consent: configure needed consent items such as profile nickname, profile image, and account email if available. If email is unavailable, Supabase Kakao provider can allow users without email, but Balance Island must treat identity linking carefully.

## Current Project Facts

- Supabase project ref: `ztcexgnelqtdzinfgoja`
- Supabase project URL: `https://ztcexgnelqtdzinfgoja.supabase.co`
- Supabase OAuth callback URL for Google/Kakao provider consoles: `https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`
- Production app URL: `https://balance-vert.vercel.app`
- Web callback route: `https://balance-vert.vercel.app/auth/callback`
- Local callback route: `http://localhost:8081/auth/callback`
- Mobile callback route: `balanceisland://auth/callback`
- Current dashboard observation: Google provider is `Enabled`; Kakao provider is `Enabled`.

## Execution Status

- Supabase Auth URL Configuration has been verified for production, local web, and `balanceisland://` redirects.
- Google OAuth client has been created with production/local origins and the Supabase callback URI.
- Supabase Google provider has been enabled; authorize smoke returned HTTP 302 to `accounts.google.com`.
- Kakao Developers app has been created, Kakao Login is ON, and the Supabase callback URI is registered on the REST API key.
- Kakao nickname and profile image consent are enabled as optional consent.
- Kakao account email is now enabled as required consent after registering an app icon and converting the Kakao app to a personal developer Biz App. This is required because Supabase's built-in Kakao provider includes `account_email` in the authorize request.
- Supabase Kakao provider has been enabled; authorize smoke returned HTTP 302 to `kauth.kakao.com`.
- Production Kakao button now reaches the Kakao consent screen instead of `KOE205`.
- User completed the Kakao consent screen; production app returned to `/profile` with a non-guest profile, Island loaded avatar state, and the app's pet assignment action created/loaded a Kakao user pet state.
- Google production login smoke was re-run after app logout and returned to `/profile` with a non-guest session; because the visible profile matched the same account, a separate Google-only identity check remains optional if account-provider distinction is required.
- Remaining work: decide whether to push the local documentation commits to `origin/main`.

## Security Rules

- Do not write Client ID, Client Secret, REST API key, or Kakao Client Secret into git-tracked docs, `timeline.md`, terminal output, or screenshots.
- If the user wants the agent to type a secret, the user should paste it directly into the visible browser field or clipboard during that exact step. The agent must not echo the value back.
- Screenshots are allowed only before secrets are visible or after fields are masked.
- After smoke tests, logs may record provider names, status codes, redirect hosts, and generic error messages, but not full token-bearing URLs.

---

## Task 1: Confirm Supabase URL Configuration

**Files:**
- Read: `docs/auth-provider-setup.md`
- Update: `timeline.md`

- [ ] **Step 1: Open Supabase URL Configuration**

Open:

```text
https://supabase.com/dashboard/project/ztcexgnelqtdzinfgoja/auth/url-configuration
```

Expected: User is authenticated in Supabase, or the user completes Supabase login when prompted.

- [ ] **Step 2: Verify Site URL**

Confirm Site URL is:

```text
https://balance-vert.vercel.app
```

If missing or different, set it to that value and save.

- [ ] **Step 3: Verify Additional Redirect URLs**

Confirm these URLs exist:

```text
https://balance-vert.vercel.app/auth/callback
https://balance-vert.vercel.app/**
http://localhost:8081/**
http://127.0.0.1:8081/**
balanceisland://**
```

If any are missing, add them and save. Do not remove existing user-added redirect URLs unless the user explicitly approves.

- [ ] **Step 4: Smoke URL config with existing app code**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript passes.

- [ ] **Step 5: Record dashboard URL config verification**

Use the Supabase dashboard UI as the source of truth for this step. Record only this non-secret summary in `timeline.md`:

```text
Supabase Auth Site URL and Additional Redirect URLs were checked in the dashboard.
Production, local web, and balanceisland:// mobile redirect patterns are present.
```

Do not depend on a public unauthenticated Auth settings endpoint for this verification, because the dashboard configuration surface is authoritative and avoids leaking or depending on unsupported API output.

---

## Task 2: Configure Google Cloud OAuth Client

**Files:**
- Update: `timeline.md`

- [ ] **Step 1: Open Google Auth Platform Clients**

Open:

```text
https://console.cloud.google.com/auth/clients
```

Expected: User authenticates and selects the Google Cloud project intended for Balance Island.

- [ ] **Step 2: Create or select Web OAuth client**

If no suitable client exists, create a new OAuth client:

```text
Application type: Web application
Name: Balance Island Web
```

If a suitable client already exists, open it instead of creating a duplicate.

- [ ] **Step 3: Set Authorized JavaScript origins**

Add:

```text
https://balance-vert.vercel.app
http://localhost:8081
http://127.0.0.1:8081
```

If the console rejects localhost/127.0.0.1 or project policy forbids them, keep production origin and record local Google smoke as blocked by Google console policy.

- [ ] **Step 4: Set Authorized redirect URI**

Add:

```text
https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback
```

Do not add `https://balance-vert.vercel.app/auth/callback` to Google for the Supabase-hosted OAuth provider flow. Google returns to Supabase first; Supabase then redirects to the app callback.

- [ ] **Step 5: Save and collect credentials safely**

Save the OAuth client.

User-owned action:

```text
Copy Client ID and Client Secret from Google Cloud.
Paste them only into the Supabase Google provider panel when prompted.
Do not paste them into chat or docs.
```

If Google only shows the secret once, user stores it in their password manager or secret manager before continuing.

- [ ] **Step 6: Google OAuth Consent Screen 상태 확인**

Open:

```text
https://console.cloud.google.com/auth/audience
```

Check:

```text
Publishing status: if Testing, add the smoke-test Google account email to Test users.
```

Then open:

```text
https://console.cloud.google.com/auth/scopes
```

Confirm the Supabase-required scopes are present:

```text
openid
.../auth/userinfo.email
.../auth/userinfo.profile
```

If `openid` is missing, add it manually. Supabase docs note that email/profile are usually added by default, while `openid` may need manual addition.

---

## Task 3: Enable Google Provider in Supabase

**Files:**
- Update: `timeline.md`

- [ ] **Step 1: Open Supabase Google provider**

Open:

```text
https://supabase.com/dashboard/project/ztcexgnelqtdzinfgoja/auth/providers?provider=Google
```

Expected: Google provider panel is visible.

- [ ] **Step 2: Enable and fill fields**

Set:

```text
Enable Sign in with Google: ON
Client IDs: user pastes the Google Web OAuth Client ID directly into this browser field
Client Secret (for OAuth): user pastes the Google OAuth Client Secret directly into this browser field
Skip nonce checks: OFF
Allow users without an email: OFF
```

User may paste the two credential values directly into the browser fields. Agent does not store or repeat them.

- [ ] **Step 3: Save**

Click `Save`.

Expected: Supabase shows no validation error and provider status becomes enabled.

- [ ] **Step 4: Verify Google provider with Supabase authorize smoke**

Run a no-secret smoke check that asks Supabase JS to create the OAuth URL and then fetches it without following redirects.

Expected:

```text
Before setup: 400 validation_failed / Unsupported provider
After setup: 302 redirect to accounts.google.com or a Google OAuth consent/login URL
```

If still `Unsupported provider`, refresh Supabase provider page and confirm the toggle stayed ON after save.

---

## Task 4: Configure Kakao Developers App

**Files:**
- Update: `timeline.md`

- [ ] **Step 1: Open Kakao Developers**

Open:

```text
https://developers.kakao.com/console/app
```

Expected: User authenticates with Kakao and selects or creates the app intended for Balance Island.

- [ ] **Step 2: Select or create Kakao app**

If creating a new app, use:

```text
App name: Balance Island
Company name: user-owned company or project owner name
Category: app/service category closest to Balance Island
```

If an app already exists, open it and avoid creating a duplicate.

- [ ] **Step 3: Enable Kakao Login**

Navigate:

```text
Product Settings > Kakao Login > General
```

Set:

```text
Kakao Login Status/State: ON
```

- [ ] **Step 4: Register redirect URI**

Navigate:

```text
Product Settings > Kakao Login > General
```

Add:

```text
https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback
```

Save.

If the Kakao UI routes this through the REST API key edit page instead, use the Kakao Developers path shown for the selected REST API key and save the same Redirect URI. The value must exactly match the Supabase callback URL.

- [ ] **Step 5: Collect REST API key and Client Secret safely**

Navigate:

```text
App Settings > App > Platform Key
```

User-owned action:

```text
Copy REST API key. This is the Supabase Kakao Client ID.
Open REST API key Client secret settings.
Ensure Client secret is activated if Kakao requires it.
Copy Kakao Login Client Secret.
Paste both only into the Supabase Kakao provider panel when prompted.
```

- [ ] **Step 6: Configure consent items**

Navigate:

```text
Product Settings > Kakao Login > Consent Items
```

Set these if available:

```text
profile_nickname: consent enabled
profile_image: consent enabled
account_email: consent enabled if available
```

If `account_email` is unavailable because the app is not a Kakao Biz App, record that limitation and plan to enable `Allow users without an email` in Supabase Kakao provider for MVP smoke only.

- [ ] **Step 7: 이메일 없는 Kakao 사용자 생성 가드 검증**

Before enabling `Allow users without an email`, inspect the current profile trigger definition:

```sql
select pg_get_functiondef('public.handle_new_user()'::regproc);
```

Expected:

```text
The function derives nickname/avatar from raw_user_meta_data and does not require NEW.email.
The function calls ensure_user_gamification_state(NEW.id), which depends on user id, not email.
```

If this inspection fails or shows email-dependent logic, do not enable email-less Kakao sign-in until the trigger is fixed.

---

## Task 5: Enable Kakao Provider in Supabase

**Files:**
- Update: `timeline.md`

- [ ] **Step 1: Open Supabase Kakao provider**

Open:

```text
https://supabase.com/dashboard/project/ztcexgnelqtdzinfgoja/auth/providers?provider=Kakao
```

Expected: Kakao provider panel is visible.

- [ ] **Step 2: Enable and fill fields**

Set:

```text
Enable Sign in with Kakao: ON
Client ID: user pastes the Kakao REST API key directly into this browser field
Client Secret: user pastes the Kakao Login Client Secret directly into this browser field
Allow users without an email: OFF if account_email is configured, ON only if Kakao email is unavailable and user approves MVP fallback
```

User may paste the credential values directly into the browser fields. Agent does not store or repeat them.

- [ ] **Step 3: Save**

Click `Save`.

Expected: Supabase shows no validation error and provider status becomes enabled.

- [ ] **Step 4: Verify Kakao provider with Supabase authorize smoke**

Run a no-secret smoke check that asks Supabase JS to create the OAuth URL and then fetches it without following redirects.

Expected:

```text
Before setup: 400 validation_failed / Unsupported provider
After setup: 302 redirect to kauth.kakao.com
```

If Kakao returns `KOE004`, Kakao Login is OFF. If Kakao returns `KOE006`, redirect URI does not exactly match the registered URI.

---

## Task 6: Production App Login Smoke

**Files:**
- Update: `timeline.md`

- [ ] **Step 1: Open production login**

Open:

```text
https://balance-vert.vercel.app/login
```

Expected: Korean login screen renders, Naver remains disabled, Google/Kakao buttons are visible.

- [ ] **Step 2: Google real login smoke**

Click Google.

User-owned action:

```text
Complete Google account selection and consent if prompted.
```

Expected:

```text
App returns to https://balance-vert.vercel.app/auth/callback
Then navigates to /profile
No token-bearing callback URL is copied into docs or chat
```

- [ ] **Step 3: Verify Google profile and gamification side effects**

In Supabase dashboard or SQL Editor, verify without exposing tokens:

```sql
select id, nickname, avatar_url, shell_balance, streak_count
from public.profiles
order by created_at desc
limit 5;

select user_id, species_id from public.user_pet_state
order by created_at desc limit 5;

select user_id, evolution_stage from public.user_avatar_state
order by updated_at desc limit 5;
```

Expected: a profile row, pet state, and avatar state exist for the signed-in Google user.

- [ ] **Step 4: Logout smoke**

Click logout in the app.

Expected: auth state clears and profile/island screens return to guest preview or login CTA.

- [ ] **Step 5: Kakao real login smoke**

Repeat the same flow for Kakao.

User-owned action:

```text
Complete Kakao account login and consent if prompted.
```

Expected:

```text
App returns to /auth/callback
Then navigates to /profile
profiles row exists
If email is missing, app still creates a profile and timeline records the email limitation
```

- [ ] **Step 6: 모바일 딥링크 스모크 테스트 (보류)**

Current status:

```text
Mobile build is not configured in this provider-console setup pass.
Classify balanceisland://auth/callback as deferred unless the user starts an Expo/device smoke session.
```

---

## Task 7: Failure Handling and Rollback

**Files:**
- Update: `timeline.md`

- [ ] **Step 1: If Google fails**

Classify the failure:

```text
origin_mismatch: fix Authorized JavaScript origins in Google Cloud
redirect_uri_mismatch: fix Authorized redirect URI in Google Cloud
Unsupported provider: re-save Supabase Google provider with Enable ON
callback stays on error: inspect /auth/callback error text and authStore state
```

- [ ] **Step 2: If Kakao fails**

Classify the failure:

```text
KOE004: Kakao Login state is OFF
KOE006: Kakao Redirect URI does not exactly match Supabase callback URL
token/client_secret error: REST API Client secret setting and Supabase Client Secret disagree
missing email: configure Kakao consent/Biz App or enable Supabase allow-without-email with user approval
```

- [ ] **Step 3: Roll back provider exposure if needed**

If a provider cannot pass smoke:

```text
Set provider OFF in Supabase
Leave app code unchanged
Record reason in timeline.md
Keep Naver disabled
```

---

## Completion Criteria

- Supabase URL Configuration contains production, local, and mobile callback allow-list entries.
- Google OAuth client exists with production/local origins and Supabase callback URI.
- Supabase Google provider is enabled and authorize smoke redirects to Google.
- Kakao app has Kakao Login ON, Supabase callback Redirect URI, REST API key, Client Secret, and consent items configured.
- Supabase Kakao provider is enabled and authorize smoke redirects to Kakao.
- Production `/login` real Google and Kakao login return through `/auth/callback` and land on `/profile`.
- `profiles`, `user_avatar_state`, and `user_pet_state` creation or loading is verified after each provider login.
- No secrets, auth codes, access tokens, refresh tokens, or token-bearing URLs are written to git, docs, timeline, screenshots, or chat.
