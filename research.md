# Balance Island Active Research & Known Risks

> **문서 상태:** 활성 리스크 트래킹 (슬림화 버전)  
> **최종 갱신일:** 2026-06-03  
> **과거 상세 이력:** [[docs/research-history.md | 상세 리서치 히스토리 (52KB)]] 참조

---

## 1. 프로젝트 현재 상태 (Current Baseline)

Balance Island는 초기 3일간(2026-06-01 ~ 06-03) 급격한 성장을 거쳐 현재 MVP 출시 및 첫 사용자 유입 직전의 안정화 상태에 도달했습니다.

### 구현 완료 목록
- [x] **기본 앱 셸:** Expo Router 기반 Root 및 Tab Layout 구축
- [x] **성향 펫/테마 경제:** 10종의 펫(common/rare) 및 3종의 전설 펫 PNG 어셋 번들링 및 스키마 추가
- [x] **인사이트 맵:** `get_personality_insight_graph` RPC를 활용한 성향 시각화 프리뷰 구현
- [x] **소셜 로그인 (OAuth):** Google 및 Kakao 소셜 로그인 / 이메일 매직 링크 실 배포 환경 연동 및 로그인 스모크 테스트 통과
- [x] **백엔드 보안 하드닝:** 
  - Supabase Database Trigger 및 RPC-only 경제 로직 적용
  - AI Edge Function 호출을 감싸는 durable per-user rate limit (`check_ai_rate_limit`) 배포 완료
- [x] **Obsidian AI 업무 위키:** `AI-Sessions/` 3-Layer 위키 구조 및 자동 린트 검증(`validate:wiki`) 셋업 완료

---

## 2. 해결된 주요 리스크 (Resolved Risks Archive)

이전 개발 단계에서 발견되어 완전히 해결된 크리티컬 리스크들입니다. 상세 수리 내역은 [[docs/research-history.md | research-history.md]]를 참조하십시오.

- **C1. 한글 인코딩 깨짐 리스크:** UTF-8 강제 지정 및 파일 재작성으로 완료.
- **C2. Supabase DB 파괴 위험 (`DROP TABLE ... CASCADE`):** 마이그레이션 파일 분리 및 `schema.sql`에 운영 환경 실행 금지 경고 주석 적용 완료.
- **C3. profiles 테이블 RLS 보안 구멍:** 클라이언트 직접 UPDATE 차단 및 RPC(`update_profile_display`)를 통한 간접 갱신으로 제한 완료.
- **C4. Kakao 로그인 KOE205 에러:** Kakao 비즈 앱 신청 및 `account_email` 필수 동의 항목 설정으로 해결 완료.

---

## 3. 남은 활성 리스크 및 미완성 태스크 (Known Active Gaps)

향후 개발 세션에서 반드시 해결하거나 예방해야 하는 리스크 및 기획 검토 사항입니다.

### [Important] I1. 가챠 및 무료 재화 인플레이션 리스크
- **설명:** 조개(Shell) 재화 획득/소비 밸런스가 아직 유저 행동 데이터 기반으로 조율되지 않았습니다. 조개 보상이 너무 많으면 꾸미기 콘텐츠가 빠르게 소모되고, 너무 적으면 피로감이 올라갑니다.
- **대비책:** `productCopy.ts` 및 상점/보상 DDL의 가격을 원격 config 또는 DB 테이블을 통해 튜닝 가능하도록 확장하고, 초기 획득량은 하루 평균 30~60 조개 수준으로 제한합니다.

### [Important] I2. 모바일 네이티브 빌드 및 딥링크 미검증
- **설명:** 현재 웹 프로덕션 환경의 소셜 로그인은 검증되었으나, 모바일 앱 환경(`balanceisland://auth/callback`)에서의 리다이렉트 및 Expo SecureStore 세션 토큰 저장은 실 기기 테스트를 거치지 않았습니다.
- **대비책:** Expo Development Build가 준비된 이후, iOS/Android 가상 시뮬레이터 및 실 기기에서 OAuth 리다이렉트 흐름 수동 QA를 우선 진행해야 합니다.

### [Suggestion] S1. 이미지 어셋 자체 호스팅 전환 필요성
- **설명:** 현재 밸런스 질문 피드의 음식/장소 이미지들은 외부 Unsplash URL을 참조하고 있어, 트래픽 폭증 시 로딩 실패나 저작권 이슈가 생길 수 있습니다.
- **대비책:** placeholder 성격의 외부 URL 이미지를 Supabase Storage 또는 앱 로컬 assets 번들로 순차적으로 대체합니다.

---

## 4. 검증 기준 명령 (Verification Baselines)

모든 커밋 및 배포 전에 아래 3가지 자동 검증 명령이 모두 성공(`Exit 0`)해야 합니다.

```powershell
# 1. Obsidian AI 업무 위키 구조 및 보안 린트
npm.cmd run validate:wiki

# 2. 펫 아바타 어셋 및 DB 매핑 린트
npm.cmd run validate:pet-assets

# 3. TypeScript 타입 체크 및 빌드 체크
npm.cmd run typecheck
```
