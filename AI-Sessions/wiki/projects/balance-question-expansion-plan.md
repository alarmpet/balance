---
type: project
date: 2026-06-04
status: active
source: balance question expansion work + 2026-06-05-critical-remaining-work 리뷰 반영
---

# 밸런스 질문 뱅크 확장 계획

## 현재 상태 (라이브 ≠ JSON 주의)

| 구분 | 개수 | 비고 |
|---|---:|---|
| 기본 seed 질문 | 30 | `supabase/schema.sql` |
| `data/question-bank/*.json` | 423 | 배치 1~6 + 신규 카테고리 8종 − 의미중복 7 |
| **라이브 DB(`status='approved'`)** | **453** | 30 seed + 423 bank 🎯 |

> ✅ **2026-06-05 453 / 카테고리 13종**: 라이브 `approved` = **453**, 카테고리 **5 → 13**.
> 1차 신규(sort 60~90): `money`💰 `relationship`🤝 `values`⚖️ `health`💪 — migration `20260605120000_add_categories.sql`.
> 2차 신규(sort 100~130): `travel`✈️ `trend`📱 `hobby`🐾 `dilemma`😆 — migration `20260605130000_add_categories_2.sql`.
> **성향분석 연결**: 모든 질문이 canonical 5축 trait 매핑을 강제(시더 검증)하므로 카테고리와 무관하게 동일 성향 프로필에 기여.
> `dilemma`(유머)는 순수 재미가 아닌 **trait이 드러나는 가정형 딜레마**로 설계(예: 복권 당첨→저축 vs 투자 = safe↔adventure).
> 라이브 축 분포(453): safe↔adv 175 / plan↔flow 181 / solo↔social 183 / calm↔express 181 / comfort↔curious 186 — 균형 유지.

> 🧹 **2026-06-05 의미중복 정리 + seed_key 안정화**: 임베딩 스캔(OpenAI 3-small, scripts/admin/semantic-dedup.mjs)으로 의미중복 9쌍 발견 → 7개 제거(라이브 460→453).
> 안전 삭제를 위해 전 뱅크 질문에 명시적 `key` 고정(freeze)해 위치 비의존 id 확보. **NEW_ONLY(위치/카운트) 폐기 → `--keys` 증분**으로 교체.
> 의도적 유지: "칭찬을 받았을 때?"(career) ↔ "칭찬을 받으면?"(relationship) 0.92 — 도메인 달라 교차모순 분석에 유용.

질문 뱅크 파일별 개수:

| 파일 | 개수 |
|---|---:|
| `food.json` | 38 |
| `life.json` | 37 |
| `romance.json` | 35 |
| `career.json` | 34 |
| `culture.json` | 34 |

## 완료된 단계

1. 중복 방지: `fetch_feed_questions(..., p_exclude_answered=true)`로 투표한 질문 피드 제외 + 소진 UX. (라이브)
2. 성향 축: `comfort ↔ curious` 5번째 축 확정, `curious` 질문 획득 trait 승격. (라이브)
3. 배치 1(116개)·배치 2(32개, 과소 축 보강) → 라이브 148 bank.
4. 외부 조사: 재배포 가능 한국어 밸런스 데이터셋 없음. IPIP(퍼블릭 도메인 Big Five)를 trait 앵커로 재창작이 최선. → [[external-question-sources-survey]]
5. 모니터링: `scripts/admin/question-bank-report.sql`로 카테고리/trait/축 균형 점검.
6. 배치 3(30개): `safe`/`adventure`/`calm`/`express` 중심 append-only 추가. **JSON에만 존재, 라이브 미반영.**

## 현재 trait 분포 (`data/question-bank/*.json` 기준, 178개)

| trait | count |  | 축 | 합 |
|---|---:|---|---|---:|
| `express` | 44 |  | `safe ↔ adventure` | **81** |
| `safe` | 43 |  | `calm ↔ express` | **81** |
| `adventure` | 38 |  | `comfort ↔ curious` | 71 |
| `curious` | 38 |  | `plan ↔ flow` | 65 |
| `calm` | 37 |  | `solo ↔ social` | **58** |
| `plan` | 36 |
| `comfort` | 33 |
| `solo` | 29 |
| `social` | 29 |
| `flow` | 29 |

**배치 3이 `safe↔adventure`·`calm↔express`(각 81)를 과다 보강**해 이번엔 그쪽이 최다가 됐다.
다음 배치는 **과소 축 `solo↔social`(58)·`plan↔flow`(65)**, 개별 trait `solo`/`social`/`flow`를 우선 보강하고,
`express`/`safe`/`adventure`는 추가하지 않는다. (배치당 trait를 한쪽으로 몰지 말 것.)

---

## 2026-06-05 critical-remaining-work 리뷰: 발견된 문제 / 개선

[[2026-06-05-critical-remaining-work]] 문서와 wiki를 교차 검토해 아래를 반영한다.

### P0 — 출시 차단/정합성

1. ✅ **라이브 동기화 갭 해소(2026-06-05):** 배치 3(30개)을 라이브에 멱등 적용 → `approved` 208. 위 표 갱신됨.
2. ✅ **`NEW_ONLY` 신뢰성 개선(2026-06-05):** 하드코딩 `batch1` 임계를 폐기하고
   `data/question-bank/.seeded-highwater.json`(카테고리별 라이브 반영 완료 카운트) 기반으로 교체.
   - `NEW_ONLY=1`은 이제 high-water 초과분만 정확히 내보낸다(배치 3 격리 검증: 30행).
   - high-water 파일이 없으면 `NEW_ONLY`는 추측 대신 **exit 2로 거부**(전량 시드 유도).
   - 시드 성공 후 high-water를 현재 개수로 **수동 갱신**한다(현재 food38/life37/romance35/career34/culture34).
   - 시드는 `id=md5(seed_key)::uuid` + `ON CONFLICT DO UPDATE`라 **전량 재적용도 항상 no-op 안전**(증분이 불필요하면 전량 시드 권장).
   - 주의: high-water 파일은 `.`으로 시작해 시더 파일 목록에서 제외됨(`!f.startsWith('.')`).
3. **출시 우선순위 정렬:** 대량 확장(P1)보다 critical-work의 P0가 선행한다 —
   ① 작업트리 정리·중복 migration 격리, ② 보안/큐 RPC 라이브 검증, ③ 사용자 제출 큐 E2E 스모크, ④ UI 브라우저/모바일 QA, ⑤ 빌드·푸시 게이트.

### P1 — 품질/운영

4. **이미지 다양성 빈약:** 뱅크 178개가 카테고리당 5개(총 **25개**) Unsplash 사진을 순환 재사용 → 피드가 반복적으로 보인다.
   생성기 `IMG` 풀이 JSON이 아니라 코드에 있어 질문별 고유 이미지가 없다.
   - 개선: ⓐ 카테고리별 풀 확대(최소 12~16개), ⓑ 장기적으로 critical-work Task 6의 **승인 import 흐름**(`asset://questions/...` 실제 업로드, `pending://` 승인 금지)로 전환.
5. **사용자 제출 큐와 정합:** `question_submission_queue` → `export-pending` → `classify-pending`(10-trait, `curious` 포함) → **`import-approved-questions.mjs`(미구현, Task 6)**.
   뱅크 시드와 사용자 제출이 **같은 canonical 10키·같은 룰브릭**을 쓰도록 분류기 `CANONICAL_TRAITS`에 `curious` 포함 확인.
6. **검증 게이트 정비(일부 완료):** `npm run validate:question-bank`(= `seed-question-bank.mjs --check`)와 `validate:question-review` 존재 확인됨.
   배치 추가 시 두 검증 + `typecheck`를 CI 게이트로 묶는다.

### 비용/위생 원칙 (유지)

7. **제로코스트:** 실시간 AI 질문/이미지 생성 자동화는 기본 OFF. 분류는 오프라인 룰브릭 우선.
8. **워크트리 위생:** `_tmp/`(시드 산출물)·`.codex-run/` 커밋 금지. 중복 draft migration(`20260604071308_*` 등) 격리. 새 migration(`20260604140000_feed_exclude_answered`, `20260604141500_curious_axis_labels`)만 정식 반영.

---

## 추천 진행 순서 (개정)

1. ✅ **배치 3 라이브 동기화** — 라이브 208 반영. (P0-1, 2026-06-05 완료)
2. ✅ **`NEW_ONLY` 정리** — high-water 파일 기반으로 신뢰성 확보. (P0-2, 2026-06-05 완료)
3. **출시 P0 게이트** — critical-work Task 1~4, 8 (보안·큐·UI·빌드). ← **다음 차례**
4. **분류기/검증 정합** — `classify-pending` 10-trait, import-approved 도구. (P1-5)
5. ✅ **배치 4·5·6(+92)** — 과소 축 순차 보강. solo↔social 69→119, comfort↔curious 86→122 정상화. (2026-06-05 완료, 라이브 300)
6. **300 → 1000 점진 확장** — 배치당 30~50개. ⚠️ **재창작 한계 주의**: 배치 6 기준 일상 시나리오 distinctness가 줄어드는 중. 1000까지는 ① 사용자 제출 큐(`import-approved`) 활성화, ② IPIP facet 세분화(직업/대인/소비 등 하위축)로 확장하는 게 품질상 유리. 매 배치 후 `question-bank-report.sql`로 축 점검.

### 라이브 축 분포(2026-06-05, 300개 기준) — 거의 완벽 균형

| 축 | 합 |
|---|---:|
| `comfort ↔ curious` | 122 |
| `plan ↔ flow` | 121 |
| `safe ↔ adventure` | 119 |
| `solo ↔ social` | 119 |
| `calm ↔ express` | 119 |

전 축 **119~122**(편차 3). 5축 모두 균등 → 성향 변별력 최상. 다음 배치는 어느 축이든 균등 추가 가능.

## 재사용 명령 (검증됨)

```powershell
npm run validate:question-review
npm run validate:question-bank            # = node scripts/seed-question-bank.mjs --check
node scripts/seed-question-bank.mjs > _tmp/question-bank.sql   # 전량 멱등 시드(권장)
node scripts/seed-question-bank.mjs --keys bank-food-058,bank-life-056 > _tmp/new.sql  # 증분(key 지정)
node scripts/admin/freeze-seed-keys.mjs       # 신규 질문에 명시적 key 박기(append 후)
node scripts/admin/semantic-dedup.mjs         # 의미중복 스캔(임베딩, 캐시로 재실행 $0)
# NEW_ONLY는 폐기됨(위치 기반). seed_key는 JSON의 명시적 `key`라 삭제·재정렬에 id 안정.
```

## 다음 배치 주의사항

- 신규 질문은 **파일 끝 append** 후 `freeze-seed-keys.mjs`로 `key`를 박는다(이후 삭제·재정렬에도 id 안정).
- A/B는 서로 다른 canonical 10키에 매핑, weight 1.0~1.5, 명백한 좋음/나쁨 선택지 금지, 웹/커뮤니티 직접 복사 금지.
- 한쪽 trait/축으로 몰지 말 것(배치 3의 safe/adventure·calm/express 쏠림 재발 방지).
- 적용은 **전량 멱등 시드** 또는 `--keys` 증분. (NEW_ONLY 폐기)
- 등록 전 `semantic-dedup.mjs`로 의미중복 점검(표기변형은 pg_trgm이, 의미중복은 임베딩이 잡음).

## Links

- [[2026-06-05-critical-remaining-work]]
- [[comfort-curious-fifth-axis]]
- [[external-question-sources-survey]]
- `data/question-bank/*.json`
- `scripts/seed-question-bank.mjs`
- `scripts/admin/question-bank-report.sql`
