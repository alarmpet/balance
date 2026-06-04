# Phase 0 기반 토목공사 — 진행 현황 및 인수인계

> **작성일:** 2026-06-04
> **작성자:** Claude Opus 4.8
> **관련 계획:** [trendy-self-discovery-upgrade-plan.md](2026-06-04-trendy-self-discovery-upgrade-plan.md) §6 Phase 0
> **인코딩:** UTF-8

이 문서는 Phase 0(출시 전 기반 안정화)의 **코드 측 작업 완료 항목**과, 라이브 Supabase 접근·실기기가 필요해 **사용자가 직접 실행해야 하는 항목**을 분리해 정리합니다.

---

## 1. 코드 측 완료 (이번 세션, 검증됨)

| 항목 | 상태 | 산출물 / 근거 |
|---|---|---|
| `schema.sql` 파괴적 DROP 차단 경고 | ✅ 이미 존재 | `supabase/schema.sql:1-4` 상단에 "DEV RESET ONLY" 경고 확인. 추가 조치 불필요 |
| migration 적용 추적 테이블 (C3) | ✅ 신규 | `supabase/migrations/202606040400_schema_migration_tracking.sql` — `schema_migrations` 테이블 + 기존 8개 버전 백필 |
| `handle_new_user` 이메일 없는 Kakao 회귀 | ✅ 안전 확인 | `202606021900_auth_profile_metadata.sql` — `NEW.email`을 참조하지 않음. nickname은 metadata→`islander_xxxxxx` 폴백, avatar nullable. 이메일 null이어도 정상 |
| 외부 이미지 로딩 실패 폴백 (S1 완화) | ✅ 신규 | `src/components/feed/BalanceCard.tsx` — 외부 URL 실패 시 카테고리 톤 placeholder로 폴백(`onError`), 200ms 페이드 인 |
| 이미지 자체 호스팅 마이그레이션 도구 | ✅ 신규 | `scripts/migrate-feed-images-to-storage.mjs` — dry-run으로 **57개 외부 이미지** 확인됨 |

**검증:** `npm run typecheck` ✅ / `npm run validate:wiki` ✅ / `npm run validate:pet-assets` (영향 없음)

---

## 2. 사용자 실행 필요 (라이브 환경 / 실기기)

> ⚠️ 아래는 서비스 키·라이브 DB·디바이스가 필요해 에이전트가 대신 수행하지 않았습니다. 외부로 나가는 변경이므로 사용자가 직접 실행/검수하세요.

### 2-1. migration 적용 추적 테이블 라이브 적용

Supabase SQL Editor에서 아래 순서로 적용:

```sql
-- 1) supabase/migrations/202606040400_schema_migration_tracking.sql 내용 실행
-- 2) 백필 확인
select version, name, applied_at from public.schema_migrations order by version;
-- 기대: 202606011940 ~ 202606040400 까지 9행
```

이후 **새 migration을 만들 때마다** 파일 끝에 자기 버전을 stamp (파일 상단 주석 컨벤션 참조).

### 2-2. AI Edge Function rate limit 적용 + 배포 + 스모크 (comprehensive-review C4)

```powershell
# (1) DB migration 적용: SQL Editor에서
#     supabase/migrations/202606030530_ai_edge_rate_limits.sql 실행
#     확인: select proname from pg_proc where proname = 'check_ai_rate_limit';

# (2) Edge Function 배포 (Supabase CLI 로그인 상태 필요)
supabase functions deploy embed-question
supabase functions deploy refine-question

# (3) 환경변수 확인 (대시보드 또는 CLI)
#     SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY, 모델 env

# (4) authenticated 스모크: 유효한 user JWT로 호출 → 200,
#     동일 유저 다회 연속 호출 시 quota 초과로 429/503 확인
```

검증 완료 시 `research.md`의 해당 리스크와 `timeline.md`에 [완료됨: 날짜] 기록.

### 2-3. 피드 이미지 자체 호스팅 (S1 본조치)

```powershell
# (1) public 버킷 1회 생성
supabase storage create feed-images --public

# (2) 서비스 키 환경변수 설정 (커밋 금지)
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"

# (3) 먼저 dry-run으로 대상 확인 (네트워크만, 업로드 없음)
node scripts/migrate-feed-images-to-storage.mjs --dry-run

# (4) 실제 업로드 + 마이그레이션 파일 생성 (라이브 DB URL 읽기)
node scripts/migrate-feed-images-to-storage.mjs
#   또는 seed 기준:  node scripts/migrate-feed-images-to-storage.mjs --from-seed

# (5) 생성된 supabase/migrations/<ts>_self_host_feed_images.sql 검토 후 SQL Editor 적용
```

> 저작권: Unsplash 라이선스는 재호스팅 허용이나, 상용 안정성을 위해 장기적으로 자체 촬영/생성 에셋 또는 라이선스 명확한 소스로 교체 권장. (이미 일부는 번들 3D 에셋으로 전환됨: `assets/feed/`)

### 2-5. 모순 발견(상황별 다른 나) 서버 RPC 적용 — Phase 2

```sql
-- (1) 함수 적용: SQL Editor에서
--     supabase/migrations/202606040500_trait_contradictions.sql 실행
-- (2) 실제 데이터로 결과 검증 (본인 user_id로)
select public.compute_user_trait_contradictions('<user-uuid>');
-- (3) get_personality_insight_graph 반환 jsonb에 contradictions 키 병합:
--     ... || jsonb_build_object('contradictions',
--             public.compute_user_trait_contradictions(v_user_id))
--     → 클라이언트는 이미 snapshot.contradictions를 읽도록 준비됨(빈 배열 안전).
```

> 검증 전까지는 게스트 미리보기에 넣어둔 샘플 모순 카드만 노출됩니다(로그인 시 빈 값이면 미표시).

### 2-4. 모바일 딥링크 OAuth QA (research.md I2)

Expo Development Build 준비 후 실기기/시뮬레이터에서:

- [ ] `balanceisland://auth/callback` 리다이렉트로 Google 로그인 왕복
- [ ] 동일 경로로 Kakao 로그인 왕복 (이메일 없는 계정 포함)
- [ ] Expo SecureStore에 세션 토큰 청크 저장/복원 정상 (큰 토큰)
- [ ] 앱 콜드 스타트 시 `authStore.bootstrap()`이 초기 콜백 URL을 중복 소비하지 않는지 (comprehensive-review C5 회귀 확인)

---

## 2-6. Phase 3 소유욕 엔진 — 서버 의존 잔여 항목

클라이언트는 이미 구현됨: "내 성향이 만든 펫" 서사 카드(`PetOriginCard`), 테마 가챠 확률/보장/중복 공시 UI(`ThemeProbabilitySheet`, 기존). 아래는 **서버/DB 작업이 필요해 핸드오프**합니다.

- **천장(Pity) 진행도 표시:** 현재 `get_theme_probability_disclosure`는 규칙 텍스트만 반환합니다. 사용자별 "다음 보장까지 N회" 카운터를 노출하려면, 풀별 누적 뽑기 수를 추적하는 컬럼/RPC가 필요합니다(예: `user_theme_draw_pity(user_id, pool_slug, since_legendary, since_rare)` + disclosure 응답에 병합).
- **무료재화 루프 강화:** 일일 무료 뽑기(`claim_daily_theme_draw`)는 존재. 추가로 "주간 챌린지 완료 → 티켓 지급"은 미션/보상 RPC(`claim_weekly_challenge_ticket` 등)와 진행도 테이블이 필요합니다.
- **시즌 한정 + 재편입:** 풀에 `season_id`, `available_from/until`, `reintroduce_after` 컬럼을 두고, 한정 아이템이 사라지되 6~12개월 내 재편입되도록 스케줄링. "사라지되 영원히 소실되진 않는다"는 신뢰 규칙을 disclosure 문구에 반영.
- **중복→산호 가루 자동 변환:** 현재 중복은 테마 레벨업으로 처리됨. 계획서의 "산호 가루" 보상 경제로 갈지 결정 후 RPC 보강.

> ⚠️ 윤리 가드(계획서 §3-4): 천장은 **무료재화 루프에만** 강하게 걸고 유상 가챠에 도박형으로 걸지 말 것(학술 경고). 펫은 스펙 우위 없이 표현 가치만.

## 2-7. Phase 3.5 정서·바이럴 — 잔여 항목

클라이언트 구현됨: 펫 일기 카드(`PetDiaryCard`, 하루 단위 결정적 생성), 주간 리캡 카드(`WeeklyRecapCard`, Wrapped식 + 텍스트 공유). 아래는 서버/네이티브 의존이라 핸드오프합니다.

- **정확한 주간 윈도우 리캡:** 현재 리캡은 누적 데이터 기반(솔직 프레이밍). "이번 주 23개" 같은 정확한 주간 집계는 `votes.created_at` 윈도우 쿼리(예: `get_weekly_recap(p_user_id, p_week_start)`)가 필요.
- **펫 일기 서버 자동 생성/보관:** 계획서의 `pet_diary_entries` 테이블(이미 리뷰 문서에 설계됨)로 매일 밤 자동 생성·보관하고 인사이트 카드와 연결. 현재는 클라이언트가 그날 데이터로 즉석 생성.
- **공유 이미지 자동 생성:** 현재는 텍스트 공유(RN `Share`/`navigator.share`, 무의존). 이미지 카드 export는 `react-native-view-shot`(네이티브) 또는 웹 `html2canvas` 도입 필요. KPI `share_card_generate`/`share_card_complete`는 이미 계측 중.
- **시간여행(1개월/3개월 전 vs 지금):** `user_personality_snapshots` 주기 스냅샷을 읽어 비교 카드 렌더. 히스토리 적재 스케줄(주기적 스냅샷 작성)이 선행되어야 함.

## 3. 다음 단계

Phase 0의 코드 측은 정리되었습니다. 위 2번 항목(라이브 적용)을 사용자가 완료하면 Phase 0가 닫히고, 계획서 **Phase 1(핵심 루프: 희귀도 Choice Echo · 펫 말풍선 · 오늘의 딜레마 테마)** 로 진입합니다.

> 이 문서는 UTF-8로 인코딩되어 있습니다.
