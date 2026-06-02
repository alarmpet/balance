# Balance Island Auth Provider Setup

이 문서는 `balance` Supabase 프로젝트와 Expo/Vercel 앱의 소셜 로그인, 이메일 매직 링크 설정 기준입니다.

## Supabase

Project ref:

`ztcexgnelqtdzinfgoja`

Project URL:

`https://ztcexgnelqtdzinfgoja.supabase.co`

Site URL:

`https://balance-vert.vercel.app`

Additional Redirect URLs:

- `https://balance-vert.vercel.app/auth/callback`
- `https://balance-vert.vercel.app/**`
- `http://localhost:8081/**`
- `http://127.0.0.1:8081/**`
- `balanceisland://**`

Vercel은 SPA rewrite가 필요합니다. 현재 `vercel.json`의 catch-all rewrite가 `/auth/callback`을 Expo Router 화면으로 넘깁니다.

## Environment Variables

Vercel과 로컬 `.env`에는 공개 가능한 값만 넣습니다.

```env
EXPO_PUBLIC_SUPABASE_URL=https://ztcexgnelqtdzinfgoja.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_replace_with_project_publishable_key
EXPO_PUBLIC_SITE_URL=https://balance-vert.vercel.app
```

`sb_secret_...`, service role key, Supabase database password는 프론트엔드/Vercel public env에 넣지 않습니다.

## Google

Supabase built-in provider `google`을 사용합니다.

Google Cloud Console의 Authorized redirect URI:

`https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`

권장 scope:

- email
- profile

Google OAuth consent screen이 testing mode라면 등록된 test user만 로그인할 수 있습니다. 국내 공개 테스트 전에 production 전환 또는 필요한 검수 상태를 확인해야 합니다.

## Kakao

Supabase built-in provider `kakao`를 사용합니다.

Kakao Login Redirect URI:

`https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`

권장 동의 항목:

- 프로필 닉네임
- 프로필 이미지
- 카카오계정 이메일

카카오 이메일은 앱 설정/동의/검수 상태에 따라 내려오지 않을 수 있습니다. 이메일이 없더라도 앱 프로필은 생성되지만, 같은 이메일 기반의 identity linking은 신뢰할 수 없으므로 출시 전 실제 계정으로 smoke test가 필요합니다.

## Naver

Supabase Custom OAuth provider `custom:naver`로만 검토합니다. 현재 앱의 네이버 버튼은 호환성 테스트 전까지 비활성 상태로 유지합니다.

OAuth2 endpoints:

- Authorization URL: `https://nid.naver.com/oauth2.0/authorize`
- Token URL: `https://nid.naver.com/oauth2.0/token`
- UserInfo URL: `https://openapi.naver.com/v1/nid/me`

Naver Developers의 Callback URL은 Supabase Custom OAuth 설정 화면에서 표시되는 callback URL을 그대로 사용합니다.

호환성 smoke test 기준:

- Supabase Auth에 `custom:naver` identity가 생성된다.
- `auth.users.email` 또는 `raw_user_meta_data.response.email`이 확인된다.
- `profiles` row가 자동 생성된다.
- nickname/profile_image가 `handle_new_user()` fallback 또는 metadata mapping으로 정상 반영된다.

위 조건 중 하나라도 실패하면 네이버 버튼은 계속 비활성화하고, 별도 Naver auth broker 계획을 세웁니다.

## Email Magic Link

Supabase Email provider와 `signInWithOtp`를 사용합니다.

웹 callback:

`https://balance-vert.vercel.app/auth/callback`

모바일 callback:

`balanceisland://auth/callback`

UX 기준:

- 매직 링크 재전송은 60초 cooldown을 둡니다.
- 사용자는 스팸함 확인 안내를 받아야 합니다.
- 링크는 만료될 수 있고, 가능하면 요청한 기기에서 열도록 안내합니다.

## Smoke Test Checklist

1. Vercel env에 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SITE_URL`을 설정한다.
2. Supabase Auth URL allow-list에 위 redirect URL을 모두 등록한다.
3. Google/Kakao provider credentials를 Supabase에 저장한다.
4. `https://balance-vert.vercel.app/login`에서 로그인 화면이 렌더링되는지 확인한다.
5. Google 로그인 후 `/auth/callback`을 거쳐 `/profile`로 이동하는지 확인한다.
6. Kakao 로그인 후 `/auth/callback`을 거쳐 `/profile`로 이동하는지 확인한다.
7. 이메일 매직 링크가 전송되고 callback 처리가 되는지 확인한다.
8. 로그인 성공 후 Supabase `profiles`, `user_avatar_state`, `user_pet_state`가 생성되는지 확인한다.
9. 로그아웃 후 앱 상태가 게스트 미리보기로 돌아가는지 확인한다.
