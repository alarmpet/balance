---
type: decision
date: 2026-06-03
status: active
author: Antigravity
---

# OAuth Provider Selection (Google & Kakao First, Naver Deferred)

## Summary

Balance Island 소셜 로그인을 구축함에 있어, MVP 단계에서는 **Google** 및 **Kakao** 로그인을 우선 설정하여 연동 테스트 및 실서비스 스모크 테스트를 완료하고, **Naver** 로그인은 비활성 상태로 유지하며 향후 검토하기로 결정했습니다.

## Context

- 사용성 측면에서 Kakao는 국내 소셜 인증 점유율이 가장 높고, Google은 Android 및 다수 플랫폼 사용자 편의성에 필수적입니다.
- 개발 리소스의 효율적 배분을 위해 MVP 단계에서 세 개 이상의 OAuth 프로바이더를 동시에 처리하는 것은 검수 절차 및 연동 디버깅 범위를 과도하게 넓힐 수 있습니다.
- 특히 Naver의 경우 검수 요구사항이 까다롭고 local redirect URI 지원 정책에 다소 제약이 있어 우선순위를 연기하였습니다.

## Details

### 1. 결정 사항

- **Google OAuth:**
  - Google Cloud OAuth Web Client를 생성하고 Authorized Javascript Origins와 Supabase Redirect URI를 설정했습니다.
  - Publishing Status가 `Testing`일 경우, 테스트 사용자의 이메일을 수동 추가하여 테스트를 수행합니다.
  - Supabase Google Auth Provider를 켜고 Client ID/Secret을 저장했습니다.
- **Kakao OAuth:**
  - Kakao Developers에 앱을 등록하고, Kakao Login을 활성화했으며, Supabase Redirect URI를 적용했습니다.
  - Supabase가 이메일을 필수로 요구하는 스펙에 맞추기 위해, Kakao 앱을 개인 개발자 **Biz App**으로 전환하여 `account_email`을 필수(Required) 수집 항목으로 설정했습니다.
  - Supabase Kakao Auth Provider를 켜고 REST API key(Client ID) 및 Client Secret을 저장했습니다.
- **Naver OAuth:**
  - 로그인 화면 및 코드베이스의 Naver 관련 참조는 유지하되, Supabase 대시보드 내 Naver Provider는 **Disabled**로 유지합니다.

### 2. 향후 계획

- 프로덕션 런칭 및 마케팅 시점 이후 사용자의 요청에 따라 Naver 및 Apple 소셜 로그인 추가 도입 여부를 재판단합니다.
- 모바일 딥링크 `balanceisland://auth/callback` 흐름은 네이티브 빌드 안정화 이후 추가로 검증을 완료합니다.

## Links

- [[AI-Sessions/wiki/projects/balance-island-overview|Balance Island Overview]]
- [[AI-Sessions/wiki/sources/2026-06-03-comprehensive-review|2026-06-03 Comprehensive Review]]
- [[AI-Sessions/raw/plans/2026-06-03-oauth-provider-console-setup|OAuth Provider Console Setup Plan (Raw)]]
