# Social Auth and Magic Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kakao, Naver, Google, and email magic-link login to Balance Island so a user can sign in without passwords and keep Supabase-backed profile, feed, island, pet, and insight data tied to one account.

**Architecture:** Use Supabase Auth as the single source of truth. Google and Kakao use built-in Supabase OAuth providers; Naver uses Supabase Custom OAuth/OIDC only after a compatibility spike confirms Naver's userinfo response maps into Supabase identities; email uses Supabase `signInWithOtp` magic links. The app gets one shared Supabase client with persistent auth storage, one auth store/provider, one login screen, and one callback/deep-link handler.

**Tech Stack:** Expo Router, React Native, Expo Web, Supabase Auth, `@supabase/supabase-js`, `expo-auth-session`, `expo-web-browser`, `expo-linking`, `expo-secure-store`, `@react-native-async-storage/async-storage`, Zustand.

---

## Source Notes

- Supabase Redirect URLs: `redirectTo`/`emailRedirectTo` must match the Supabase Auth URL allow list; Vercel preview wildcards are supported but production should stay explicit. Source: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Native Mobile Deep Linking: Expo should register a custom scheme, add `scheme://**` to Supabase redirect URLs, use `makeRedirectUri`, `openAuthSessionAsync`, and parse the returned auth URL. Source: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Supabase Expo Social Auth: use platform-aware storage, `persistSession: true`, `autoRefreshToken: true`, and `detectSessionInUrl: false`. Source: https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth
- Supabase Kakao: Kakao developer app must use Supabase callback URL `https://<project-ref>.supabase.co/auth/v1/callback`. Source: https://supabase.com/docs/guides/auth/social-login/auth-kakao/
- Supabase Google: Google OAuth client must authorize the Supabase callback URL. Source: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Magic Link: use `signInWithOtp` and configure redirect destinations for passwordless email. Source: https://supabase.com/docs/guides/auth/auth-magic-link
- Supabase Custom OAuth/OIDC: custom providers use identifiers such as `custom:naver`; OAuth2 providers need authorization, token, and userinfo endpoints; PKCE is enabled by default. Source: https://supabase.com/docs/guides/auth/custom-oauth-providers
- Supabase Identity Linking: Supabase can automatically link OAuth identities when verified emails match, but provider email availability must be handled carefully. Source: https://supabase.com/docs/guides/auth/auth-identity-linking
- Expo AuthSession: `AuthSession.makeRedirectUri()` handles platform redirect URI generation. Source: https://docs.expo.dev/versions/latest/sdk/auth-session/
- Expo Authentication Guide: OAuth/OIDC in Expo should use AuthSession and configured redirects. Source: https://docs.expo.dev/guides/authentication/
- Naver Login: Naver OAuth uses a configured Callback URL and OAuth 2.0 endpoints. Source: https://developers.naver.com/docs/login/overview/overview.md

## External Review Validation

Reviewed `C:\Users\petbl\.gemini\antigravity\brain\069a60aa-b05f-40e9-ba0a-53884ace658d\social_auth_review_report.md` against the current codebase and official docs.

Accepted into this plan:

- `signOut` must have one owner. `authStore` should call `supabase.auth.signOut()`, while `gamificationStore` only clears local gamification state.
- `handle_new_user` must read OAuth metadata beyond `name`, including `full_name`, `user_name`, `preferred_username`, `avatar_url`, and `picture`.
- Native auth storage needs a large-value strategy. A raw one-key SecureStore adapter can fail for large OAuth sessions, so native storage will chunk long values in SecureStore instead of silently storing tokens in AsyncStorage.
- `EXPO_PUBLIC_SITE_URL` must be added to `src/lib/env.ts` if `.env.example` documents it.
- `onAuthStateChange` must not be registered repeatedly during bootstrap.
- Social login should navigate only after a user exists; browser cancel/dismiss must stay on `/login`.
- Magic-link resend cooldown must be implemented, not only documented.
- `/auth/callback` must be covered by Vercel SPA rewrites; the current `vercel.json` already has the correct catch-all rewrite, but the smoke task should verify it.
- Provider setup docs should explicitly mention Google testing-mode user limits and Kakao email consent/review risks.

Not accepted as written:

- Plain AsyncStorage fallback for native token storage. This preserves sessions but weakens token storage. The implementation task uses SecureStore chunking for native and AsyncStorage only for web.
- Immediate iOS/Android bundle/package identifiers. The app currently only has a confirmed Expo scheme. Bundle IDs should be added after the user chooses final app identifiers.

## Core Product Decisions

1. **One auth source:** Supabase Auth owns all app sessions. Do not add separate Firebase/Auth0/standalone OAuth session state.
2. **One public login surface:** Add `/login` with Kakao, Naver, Google, and email magic link. Protected features still show guest previews where already implemented, but profile/island reward mutations prompt login.
3. **No passwords for MVP:** Do not add password signup/login UI. Email login is magic link only.
4. **Naver gated rollout:** Implement Naver code path, but keep the button disabled or hidden until the custom OAuth provider passes a real smoke test with `auth.users` and `profiles`.
5. **Mobile-first redirects:** The production mobile callback is `balanceisland://auth/callback`; web callback is `https://balance-vert.vercel.app/auth/callback`.
6. **Secure storage:** Mobile session tokens use SecureStore; web uses AsyncStorage/local browser-backed storage through the Supabase quickstart pattern. Never log access tokens, refresh tokens, auth codes, or full session objects.
7. **Profile creation safety:** Keep the existing `handle_new_user` trigger, but verify provider users with missing email or nickname still get a valid default profile.

## Human Setup Checklist

The user will authenticate in external dashboards. The agent should open pages and fill non-secret fields where possible, but the user approves/logs in and pastes secrets when needed.

### Supabase Auth URL Configuration

- Site URL: `https://balance-vert.vercel.app`
- Additional Redirect URLs:
  - `https://balance-vert.vercel.app/auth/callback`
  - `https://balance-vert.vercel.app/**`
  - `http://localhost:8081/**`
  - `http://127.0.0.1:8081/**`
  - `balanceisland://**`

### Google Provider

- Provider: built-in Supabase `google`
- Google Authorized Redirect URI:
  - `https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`
- Required consent data:
  - email
  - profile
- User action:
  - Create/choose Google Cloud OAuth app.
  - Copy Client ID and Client Secret into Supabase Auth provider settings.

### Kakao Provider

- Provider: built-in Supabase `kakao`
- Kakao Login Redirect URI:
  - `https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`
- Required Kakao consent data:
  - profile nickname
  - profile image if available
  - account email if Kakao review/settings allow it
- User action:
  - Create/choose Kakao Developers app.
  - Enable Kakao Login.
  - Copy REST API key and client secret into Supabase Auth provider settings.

### Naver Provider

- Provider: Supabase Custom OAuth, identifier `custom:naver`
- OAuth2 endpoints:
  - Authorization URL: `https://nid.naver.com/oauth2.0/authorize`
  - Token URL: `https://nid.naver.com/oauth2.0/token`
  - UserInfo URL: `https://openapi.naver.com/v1/nid/me`
- Naver Callback URL:
  - Use the callback URL shown by Supabase when creating `custom:naver`.
- Required Naver user fields:
  - id
  - email
  - nickname
  - profile_image if available
- Important compatibility gate:
  - Naver userinfo is commonly nested under `response`. Before enabling the UI button, run a real sign-in and inspect whether Supabase can create an identity and populate email/profile metadata. If it cannot, keep Naver hidden and create a follow-up plan for a Naver-specific auth broker.

### Email Magic Link

- Provider: Supabase Email
- Template requirement:
  - Email template should use the confirmation URL/token path expected by Supabase for magic links.
- UX requirement:
  - Add resend cooldown.
  - Tell users to check spam.
  - Explain that the link expires and should be opened on the same device when possible.

---

## File Structure

- Create `src/lib/supabaseClient.ts`: shared Supabase client and platform-aware auth storage.
- Modify `src/services/questionService.ts`: import `supabase` from the shared client instead of creating it locally.
- Modify `src/services/gamificationService.ts`: import shared client; keep `signOut` until auth service owns it.
- Modify `src/services/insightMapService.ts`: import shared client.
- Modify `src/lib/env.ts`: add `EXPO_PUBLIC_SITE_URL` typing and lookup.
- Create `supabase/migrations/202606021900_auth_profile_metadata.sql`: harden OAuth profile creation metadata handling.
- Create `src/services/authService.ts`: OAuth, magic-link, callback parsing, current user, signout, and profile fetch helpers.
- Create `src/store/authStore.ts`: Zustand session/profile state, loading/error flags, auth state subscription, login actions.
- Create `src/app/login.tsx`: pastel island login screen with provider buttons and magic-link form.
- Create `src/app/auth/callback.tsx`: web/deep-link callback handler.
- Modify `src/app/_layout.tsx`: mount auth bootstrap and add login/callback routes.
- Modify `src/app/(tabs)/profile.tsx`: show login CTA for guest state and use auth store for signout.
- Modify `src/app/(tabs)/island.tsx`: for auth-only actions, route guests to `/login`.
- Modify `app.json`: keep `scheme: "balanceisland"` and add iOS/Android identifiers once the user confirms package names.
- Verify `vercel.json`: keep the catch-all SPA rewrite for `/auth/callback`.
- Modify `.env.example`: document the current public Supabase variables and optional `EXPO_PUBLIC_SITE_URL`.
- Create `docs/auth-provider-setup.md`: step-by-step dashboard setup guide with exact redirect URLs.
- Update `timeline.md`: log plan and later implementation milestones.

---

## Task 0: Auth Preflight, Env, and Profile Trigger

**Files:**
- Modify: `src/lib/env.ts`
- Create: `supabase/migrations/202606021900_auth_profile_metadata.sql`
- Verify: `vercel.json`

- [ ] **Step 1: Extend public env typing**

Replace `src/lib/env.ts` with:

```ts
type PublicEnvName =
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_SITE_URL';

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_SITE_URL?: string;
  };
};

export function getPublicEnv(name: PublicEnvName): string | undefined {
  const value = process.env[name];

  if (
    !value ||
    value.includes('your-project-id') ||
    value.includes('your-key') ||
    value.includes('replace_with') ||
    value.includes('...')
  ) {
    return undefined;
  }

  return value;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(getPublicEnv('EXPO_PUBLIC_SUPABASE_URL') && getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
}

export function getPublicSiteUrl(): string {
  return getPublicEnv('EXPO_PUBLIC_SITE_URL') ?? 'https://balance-vert.vercel.app';
}
```

- [ ] **Step 2: Add OAuth profile metadata migration**

Create `supabase/migrations/202606021900_auth_profile_metadata.sql`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_nickname text;
  profile_avatar_url text;
BEGIN
  profile_nickname := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'user_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'preferred_username'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data #>> '{response,nickname}'), ''),
    'islander_' || substr(NEW.id::text, 1, 6)
  );

  profile_avatar_url := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'picture'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data #>> '{response,profile_image}'), '')
  );

  INSERT INTO public.profiles (
    id,
    nickname,
    avatar_url,
    shell_balance,
    streak_count,
    total_participation_count,
    today_participation_count
  )
  VALUES (
    NEW.id,
    left(profile_nickname, 24),
    profile_avatar_url,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = COALESCE(public.profiles.nickname, EXCLUDED.nickname),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();

  PERFORM public.ensure_user_gamification_state(NEW.id);

  RETURN NEW;
END;
$$;
```

- [ ] **Step 3: Verify callback rewrite**

Confirm `vercel.json` contains:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Expected: `/auth/callback` is served by the Expo Router web app instead of returning a Vercel 404.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run typecheck
git diff --check
```

Expected: TypeScript passes and no whitespace errors are reported.

---

## Task 1: Shared Supabase Client and Auth Storage

**Files:**
- Create: `src/lib/supabaseClient.ts`
- Modify: `src/services/questionService.ts`
- Modify: `src/services/gamificationService.ts`
- Modify: `src/services/insightMapService.ts`
- Modify: `package.json`

- [ ] **Step 1: Install auth storage dependencies**

Run:

```powershell
npx.cmd expo install expo-secure-store expo-auth-session expo-web-browser @react-native-async-storage/async-storage react-native-url-polyfill
```

Expected: packages added to `package.json` and `package-lock.json`.

- [ ] **Step 2: Create shared Supabase client**

Create `src/lib/supabaseClient.ts`:

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';
import type { Database } from '../types/database.types';

const supabaseUrl = getPublicEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const SECURE_CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number) {
  return `${key}:chunk:${index}`;
}

function metaKey(key: string) {
  return `${key}:chunk_count`;
}

async function removeSecureChunks(key: string) {
  const rawCount = await SecureStore.getItemAsync(metaKey(key));
  const count = rawCount ? Number(rawCount) : 0;

  for (let index = 0; index < count; index += 1) {
    await SecureStore.deleteItemAsync(chunkKey(key, index));
  }

  await SecureStore.deleteItemAsync(metaKey(key));
  await SecureStore.deleteItemAsync(key);
}

const authStorageAdapter = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);

    const rawCount = await SecureStore.getItemAsync(metaKey(key));
    const count = rawCount ? Number(rawCount) : 0;

    if (!count) {
      return SecureStore.getItemAsync(key);
    }

    const parts: string[] = [];
    for (let index = 0; index < count; index += 1) {
      parts.push((await SecureStore.getItemAsync(chunkKey(key, index))) ?? '');
    }
    return parts.join('');
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);

    await removeSecureChunks(key);

    if (value.length <= SECURE_CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = value.match(new RegExp(`.{1,${SECURE_CHUNK_SIZE}}`, 'g')) ?? [];
    await SecureStore.setItemAsync(metaKey(key), String(chunks.length));
    for (let index = 0; index < chunks.length; index += 1) {
      await SecureStore.setItemAsync(chunkKey(key, index), chunks[index]);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    await removeSecureChunks(key);
  }
};

export const supabase: SupabaseClient<Database> | null = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;
```

- [ ] **Step 3: Replace local client creation**

In `src/services/questionService.ts`, remove `createClient` and local env reads. Keep only:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
```

Ensure `rpcClient` remains:

```ts
const rpcClient = supabase as SupabaseClient | null;
```

- [ ] **Step 4: Update other services**

In `src/services/gamificationService.ts` and `src/services/insightMapService.ts`, change:

```ts
import { supabase } from './questionService';
```

to:

```ts
import { supabase } from '../lib/supabaseClient';
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript passes.

---

## Task 2: Auth Service

**Files:**
- Create: `src/services/authService.ts`

- [ ] **Step 1: Create provider types and redirect helper**

Create `src/services/authService.ts` with:

```ts
import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import type { ProfileRow } from '../types/database.types';

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'google' | 'kakao' | 'custom:naver';

export type AuthProfile = Pick<
  ProfileRow,
  'id' | 'nickname' | 'avatar_url' | 'shell_balance' | 'streak_count' | 'total_participation_count' | 'today_participation_count'
>;

export function getAuthRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  return AuthSession.makeRedirectUri({
    scheme: 'balanceisland',
    path: 'auth/callback'
  });
}
```

- [ ] **Step 2: Add OAuth login function**

Append:

```ts
export async function signInWithSocialProvider(provider: SocialProvider): Promise<boolean> {
  if (!supabase) throw new Error('Supabase 설정이 필요합니다.');

  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) throw error;
  if (!data.url) throw new Error('인증 URL을 만들지 못했습니다.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    await createSessionFromUrl(result.url);
    return true;
  }

  return false;
}
```

- [ ] **Step 3: Add magic-link function**

Append:

```ts
export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase 설정이 필요합니다.');

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('올바른 이메일 주소를 입력해주세요.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: getAuthRedirectUrl()
    }
  });

  if (error) throw error;
}
```

- [ ] **Step 4: Add callback session parser**

Append:

```ts
export async function createSessionFromUrl(url: string): Promise<Session | null> {
  if (!supabase) throw new Error('Supabase 설정이 필요합니다.');

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const code = params.code;

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) throw error;
    return data.session;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  return null;
}
```

- [ ] **Step 5: Add user/profile helpers**

Append:

```ts
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function fetchCurrentProfile(): Promise<AuthProfile | null> {
  if (!supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,nickname,avatar_url,shell_balance,streak_count,total_participation_count,today_participation_count')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as AuthProfile | null;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getInitialLinkingUrl() {
  return Linking.getInitialURL();
}
```

- [ ] **Step 6: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript passes.

---

## Task 3: Auth Store and Bootstrap

**Files:**
- Create: `src/store/authStore.ts`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Create auth store**

Create `src/store/authStore.ts`:

```ts
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  createSessionFromUrl,
  fetchCurrentProfile,
  getInitialLinkingUrl,
  sendMagicLink,
  signInWithSocialProvider,
  signOutCurrentUser,
  type AuthProfile,
  type SocialProvider
} from '../services/authService';

let authUnsubscribe: (() => void) | null = null;
let didBootstrap = false;

type AuthState = {
  user: User | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  magicLinkSentTo: string | null;
  bootstrap: () => Promise<void>;
  signInSocial: (provider: SocialProvider) => Promise<void>;
  sendMagicLinkEmail: (email: string) => Promise<void>;
  handleAuthCallback: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isMutating: false,
  error: null,
  magicLinkSentTo: null,

  async bootstrap() {
    if (!supabase) return;
    if (didBootstrap) return;
    didBootstrap = true;

    set({ isLoading: true, error: null });

    try {
      const initialUrl = await getInitialLinkingUrl();
      if (initialUrl) {
        await createSessionFromUrl(initialUrl);
      }

      const { data } = await supabase.auth.getSession();
      const profile = data.session?.user ? await fetchCurrentProfile() : null;
      set({ user: data.session?.user ?? null, profile, isLoading: false });

      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
        const profile = session?.user ? await fetchCurrentProfile() : null;
        set({ user: session?.user ?? null, profile });
      });
      authUnsubscribe = () => listener.subscription.unsubscribe();
    } catch (error) {
      didBootstrap = false;
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '로그인 상태를 확인하지 못했습니다.'
      });
    }
  },

  async signInSocial(provider) {
    set({ isMutating: true, error: null });
    try {
      const completed = await signInWithSocialProvider(provider);
      if (!completed) {
        set({ isMutating: false });
        return;
      }
      const profile = await fetchCurrentProfile();
      const { data } = await supabase!.auth.getUser();
      set({ user: data.user ?? null, profile, isMutating: false });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '소셜 로그인에 실패했습니다.'
      });
    }
  },

  async sendMagicLinkEmail(email) {
    set({ isMutating: true, error: null });
    try {
      await sendMagicLink(email);
      set({ isMutating: false, magicLinkSentTo: email.trim().toLowerCase() });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '이메일 로그인 링크를 보내지 못했습니다.'
      });
    }
  },

  async handleAuthCallback(url) {
    set({ isLoading: true, error: null });
    try {
      await createSessionFromUrl(url);
      const profile = await fetchCurrentProfile();
      const { data } = await supabase!.auth.getUser();
      set({ user: data.user ?? null, profile, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '로그인 완료 처리에 실패했습니다.'
      });
    }
  },

  async signOut() {
    set({ isMutating: true, error: null });
    try {
      await signOutCurrentUser();
      set({ user: null, profile: null, isMutating: false });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '로그아웃에 실패했습니다.'
      });
    }
  },

  clearError() {
    set({ error: null });
  }
}));
```

- [ ] **Step 2: Bootstrap auth in root layout**

Modify `src/app/_layout.tsx`:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="insight-map" />
      </Stack>
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript passes.

---

## Task 4: Login Screen

**Files:**
- Create: `src/app/login.tsx`

- [ ] **Step 1: Build provider buttons and email form**

Create `src/app/login.tsx` with a compact island-themed UI:

```tsx
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import type { SocialProvider } from '../services/authService';

const providers: Array<{ provider: SocialProvider; label: string; tone: string; enabled: boolean }> = [
  { provider: 'kakao', label: '카카오로 시작', tone: '#fee500', enabled: true },
  { provider: 'google', label: '구글로 시작', tone: '#ffffff', enabled: true },
  { provider: 'custom:naver', label: '네이버로 시작', tone: '#03c75a', enabled: false }
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { isMutating, error, magicLinkSentTo, signInSocial, sendMagicLinkEmail } = useAuthStore();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSocial(provider: SocialProvider, enabled: boolean) {
    if (!enabled) return;
    await signInSocial(provider);
    const { user } = useAuthStore.getState();
    if (user) {
      router.replace('/(tabs)/profile');
    }
  }

  async function handleMagicLink() {
    if (cooldown > 0) return;
    await sendMagicLinkEmail(email);
    setCooldown(60);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>밸런스 아일랜드</Text>
      <Text style={styles.title}>내 성향 섬을 저장하려면 로그인해주세요</Text>
      <Text style={styles.body}>질문 기록, 조개, 성향 펫, 테마 보상이 내 계정에 안전하게 연결됩니다.</Text>

      <View style={styles.providerList}>
        {providers.map((item) => (
          <Pressable
            key={item.provider}
            disabled={isMutating || !item.enabled}
            style={[styles.providerButton, { backgroundColor: item.tone }, !item.enabled ? styles.disabled : null]}
            onPress={() => handleSocial(item.provider, item.enabled)}
          >
            <Text style={[styles.providerText, item.provider === 'kakao' ? styles.darkText : null]}>
              {item.enabled ? item.label : `${item.label} - 준비 중`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>이메일 매직 링크</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="email@example.com"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <Pressable disabled={isMutating || cooldown > 0} style={[styles.magicButton, isMutating || cooldown > 0 ? styles.disabled : null]} onPress={handleMagicLink}>
        {isMutating ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.magicText}>{cooldown > 0 ? `${cooldown}초 후 다시 보내기` : '로그인 링크 받기'}</Text>
        )}
      </Pressable>

      {magicLinkSentTo ? (
        <Text style={styles.success}>{magicLinkSentTo} 주소로 로그인 링크를 보냈어요. 메일함과 스팸함을 확인해주세요.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>나중에 하기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', marginTop: 20, padding: 12 },
  backText: { color: '#0f766e', fontWeight: '900' },
  body: { color: '#64748b', fontSize: 15, fontWeight: '700', lineHeight: 22, marginTop: 10 },
  container: { backgroundColor: '#e0f7ff', flex: 1 },
  content: { padding: 24, paddingBottom: 40, paddingTop: 72 },
  darkText: { color: '#3b2f00' },
  disabled: { opacity: 0.45 },
  divider: { backgroundColor: '#bae6fd', height: 1, marginVertical: 24 },
  error: { color: '#be123c', fontWeight: '800', marginTop: 12, textAlign: 'center' },
  input: { backgroundColor: '#ffffff', borderColor: '#7dd3fc', borderRadius: 16, borderWidth: 1, color: '#0f172a', fontSize: 16, fontWeight: '700', minHeight: 52, paddingHorizontal: 16 },
  kicker: { color: '#0284c7', fontSize: 14, fontWeight: '900' },
  magicButton: { alignItems: 'center', backgroundColor: '#0ea5e9', borderRadius: 16, justifyContent: 'center', marginTop: 12, minHeight: 52 },
  magicText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  providerButton: { alignItems: 'center', borderColor: '#cbd5e1', borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 54 },
  providerList: { gap: 12, marginTop: 24 },
  providerText: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '900', marginBottom: 12 },
  success: { color: '#047857', fontWeight: '800', lineHeight: 20, marginTop: 12, textAlign: 'center' },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '900', lineHeight: 34, marginTop: 8 }
});
```

- [ ] **Step 2: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript passes.

---

## Task 5: Auth Callback Route

**Files:**
- Create: `src/app/auth/callback.tsx`

- [ ] **Step 1: Create callback screen**

Create `src/app/auth/callback.tsx`:

```tsx
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function AuthCallbackScreen() {
  const { error, handleAuthCallback } = useAuthStore();

  useEffect(() => {
    const currentUrl = typeof window !== 'undefined'
      ? window.location.href
      : Linking.createURL('auth/callback');

    void handleAuthCallback(currentUrl).then(() => {
      router.replace('/(tabs)/profile');
    });
  }, [handleAuthCallback]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#0ea5e9" />
      <Text style={styles.title}>로그인 완료 처리 중</Text>
      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.replace('/login')}>
            <Text style={styles.retryText}>로그인으로 돌아가기</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#e0f7ff', flex: 1, justifyContent: 'center', padding: 24 },
  error: { color: '#be123c', fontWeight: '800', lineHeight: 20, marginTop: 12, textAlign: 'center' },
  retryButton: { backgroundColor: '#0ea5e9', borderRadius: 16, marginTop: 16, paddingHorizontal: 18, paddingVertical: 12 },
  retryText: { color: '#ffffff', fontWeight: '900' },
  title: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginTop: 16 }
});
```

- [ ] **Step 2: Verify web callback path is not swallowed**

Run:

```powershell
npx.cmd expo export --platform web
```

Expected: web export succeeds; `vercel.json` SPA rewrite remains compatible with `/auth/callback`.

---

## Task 6: Guest-to-Login UX Integration

**Files:**
- Modify: `src/app/(tabs)/profile.tsx`
- Modify: `src/app/(tabs)/island.tsx`
- Modify: `src/store/gamificationStore.ts`

- [ ] **Step 1: Profile screen login CTA**

In `src/app/(tabs)/profile.tsx`, import router and auth store:

```ts
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
```

If `snapshot.profile.id === 'guest'`, show a login CTA above mutation buttons:

```tsx
{snapshot.profile.id === 'guest' ? (
  <Pressable style={styles.checkinButton} onPress={() => router.push('/login')}>
    <Text style={styles.checkinText}>로그인하고 보상 저장하기</Text>
  </Pressable>
) : (
  <Pressable style={[styles.checkinButton, isMutating ? styles.disabledButton : null]} disabled={isMutating} onPress={() => claimCheckin()}>
    <Text style={styles.checkinText}>{isMutating ? '처리 중...' : '출석 보상 받기'}</Text>
  </Pressable>
)}
```

- [ ] **Step 2: Make gamification signout local-only**

In `src/store/gamificationStore.ts`, change `signOutUser` so it does not call Supabase Auth:

```ts
async signOutUser() {
  set({ snapshot: null, lastThemeDrawResults: [], error: null });
}
```

Then remove the unused `signOut` import from `src/store/gamificationStore.ts`.

If `src/services/gamificationService.ts` no longer has callers for its exported `signOut`, remove that function from `gamificationService.ts` as well.

- [ ] **Step 3: Replace profile signout call**

Use auth store for signout:

```tsx
const authSignOut = useAuthStore((state) => state.signOut);
```

Logout press:

```tsx
<Pressable
  style={styles.logoutButton}
  onPress={async () => {
    await authSignOut();
    await signOutUser();
  }}
>
  <Text style={styles.logoutText}>로그아웃</Text>
</Pressable>
```

- [ ] **Step 4: Island mutation guard**

In `src/app/(tabs)/island.tsx`, before auth-only actions such as check-in, pet assignment, theme draw, and care actions:

```ts
if (snapshot?.profile.id === 'guest') {
  router.push('/login');
  return;
}
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript passes.

---

## Task 7: Provider Setup Documentation

**Files:**
- Create: `docs/auth-provider-setup.md`
- Modify: `.env.example`
- Modify: `timeline.md`

- [ ] **Step 1: Create setup doc**

Create `docs/auth-provider-setup.md`:

```md
# Balance Island Auth Provider Setup

## Supabase

Project ref: `ztcexgnelqtdzinfgoja`

Site URL:

`https://balance-vert.vercel.app`

Additional Redirect URLs:

- `https://balance-vert.vercel.app/auth/callback`
- `https://balance-vert.vercel.app/**`
- `http://localhost:8081/**`
- `http://127.0.0.1:8081/**`
- `balanceisland://**`

## Google

Use Supabase built-in provider `google`.

Authorized redirect URI in Google Cloud:

`https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`

If the Google OAuth consent screen is in testing mode, only registered test users can sign in. Before public release, confirm whether the consent screen must be moved to production or verified.

## Kakao

Use Supabase built-in provider `kakao`.

Kakao Login Redirect URI:

`https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`

Kakao email may require consent/review settings. If Kakao does not return email, the app must still create a profile and may need a profile completion step before identity linking is reliable.

## Naver

Use Supabase Custom OAuth provider `custom:naver` only after compatibility smoke test passes.

OAuth2 endpoints:

- Authorization URL: `https://nid.naver.com/oauth2.0/authorize`
- Token URL: `https://nid.naver.com/oauth2.0/token`
- UserInfo URL: `https://openapi.naver.com/v1/nid/me`

## Magic Link

Use Supabase Email provider and `signInWithOtp`.

The app sends links to `/auth/callback` on web and `balanceisland://auth/callback` on mobile.
```

- [ ] **Step 2: Update `.env.example`**

Use:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ztcexgnelqtdzinfgoja.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_replace_with_project_publishable_key
EXPO_PUBLIC_SITE_URL=https://balance-vert.vercel.app
```

- [ ] **Step 3: Timeline**

Append a KST entry:

```md
## 2026-06-02 18:39 KST - Social Auth Plan

- Work: Created the social auth and magic-link implementation plan.
- Scope: `docs/superpowers/plans/2026-06-02-social-auth-magic-link.md`, `docs/auth-provider-setup.md`.
- Decision: Use Supabase built-in Google/Kakao, Custom OAuth-gated Naver, and passwordless email magic links.
- Review: Read-only reviewer flagged redirect URI, SecureStore, missing email, identity linking, and environment separation risks; incorporated into the plan.
```

---

## Task 8: Smoke Testing

**Files:**
- No new files unless a failing test requires a small helper.

- [ ] **Step 1: Static checks**

Run:

```powershell
npm.cmd run typecheck
npx.cmd expo export --platform web
git diff --check
```

Expected:

- TypeScript passes.
- Expo web export passes.
- `git diff --check` reports no whitespace errors.

- [ ] **Step 2: Web auth smoke**

Open:

```text
https://balance-vert.vercel.app/login
```

Expected before provider configuration:

- Login screen renders.
- Naver button is disabled or marked 준비 중.
- Magic-link form validates bad emails locally.

Expected after provider configuration:

- Google redirects to provider and returns to `/auth/callback`.
- Kakao redirects to provider and returns to `/auth/callback`.
- Email magic link sends and opens `/auth/callback`.
- Profile table gets one row for the signed-in user.

- [ ] **Step 3: Mobile auth smoke**

Run:

```powershell
npx.cmd expo start --clear
```

Use Expo/device flow.

Expected:

- Login screen opens.
- OAuth browser opens and returns to the app.
- Magic link opens the app through `balanceisland://auth/callback`.
- `profiles`, `user_avatar_state`, and `user_pet_state` flows still work for the signed-in user.

- [ ] **Step 4: Naver compatibility gate**

After user configures Naver:

1. Temporarily enable the Naver button.
2. Sign in with a real Naver test account.
3. Query Supabase:

```sql
select id, email, raw_user_meta_data
from auth.users
order by created_at desc
limit 5;
```

Expected:

- One new user exists.
- Email is present or the app has a clear profile completion fallback.
- `profiles` row exists.

If this fails, disable Naver again and create a separate Naver broker plan.

---

## Reviewer Risk Register

- Redirect mismatch is the highest-risk failure mode. Every provider callback and Supabase redirect allow-list must be checked before browser smoke tests.
- Session persistence must be fixed before login UI, otherwise a successful login may disappear after reload/app resume.
- Do not print auth sessions, tokens, codes, or provider URLs containing secrets in logs.
- Naver email may be missing or nested in a non-standard userinfo shape. Do not promise Naver production login until real compatibility smoke passes.
- Same-email identity linking can merge Google/Kakao/email identities. This is good UX, but it needs explicit user messaging if a provider returns no verified email.
- Vercel SPA rewrites should not block `/auth/callback`; Expo Router can handle it as a screen.
- Dev/stage/prod redirect URLs must not drift. Use `docs/auth-provider-setup.md` as the source of truth while configuring dashboards.

## Completion Criteria

- `src/lib/supabaseClient.ts` owns all Supabase client creation.
- Google and Kakao login buttons call `signInWithOAuth` and return to the app/web callback.
- Email magic link sends successfully and returns to the app/web callback.
- Naver is either smoke-tested and enabled, or explicitly disabled with a visible "준비 중" state.
- Signed-in users can load profile/island/feed/insight data without guest fallback.
- Logout clears auth state and gamification snapshot.
- `npm.cmd run typecheck`, `npx.cmd expo export --platform web`, and `git diff --check` pass.
