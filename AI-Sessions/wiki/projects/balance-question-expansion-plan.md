---
type: project
date: 2026-06-04
status: active
source: balance question expansion work
---

# 밸런스 질문 뱅크 확장 계획

## 현재 상태

공식 질문 풀은 현재 **208개** 기준으로 운영한다.

- 기본 seed 질문: 30개
- `data/question-bank/*.json`: 178개
- 총합: 208개

질문 뱅크 파일별 개수:

| 파일 | 개수 |
|---|---:|
| `food.json` | 38 |
| `life.json` | 37 |
| `romance.json` | 35 |
| `career.json` | 34 |
| `culture.json` | 34 |

## 완료된 5단계

1. 중복 방지: `fetch_feed_questions(..., p_exclude_answered=true)`로 이미 투표한 질문을 피드에서 제외한다.
2. 성향 축: `comfort ↔ curious`를 5번째 축으로 확정하고 `curious`를 질문 획득 trait로 승격했다.
3. 배치 1: 원작 재창작 질문을 추가했다.
4. 외부 조사 + 배치 2: IPIP 퍼블릭 도메인 근거를 trait 앵커로 삼아 과소 축을 보강했다.
5. 모니터링: `scripts/admin/question-bank-report.sql`로 카테고리/trait/축 균형을 점검한다.
6. 배치 3: 부족했던 `adventure`, `calm`, `safe` 중심으로 30개를 append-only 방식으로 추가했다.

## 현재 trait 분포

`data/question-bank/*.json` 기준 선택지 trait 분포:

| trait | count |
|---|---:|
| `express` | 44 |
| `safe` | 43 |
| `adventure` | 38 |
| `curious` | 38 |
| `calm` | 37 |
| `plan` | 36 |
| `comfort` | 33 |
| `solo` | 29 |
| `social` | 29 |
| `flow` | 29 |

배치 3 이후에는 부족 축이 `solo`, `social`, `flow`로 이동했다. 다음 확장은 이 3개 축을 우선 보강하되, `express`, `safe`, `adventure`가 과도하게 치우치지 않도록 관리한다.

## 추천 진행 순서

### 1순위: 사용자 제출 질문 큐 자동 분류 고도화

배치 3을 쓰기 전에 `scripts/admin/classify-pending-question.mjs`를 10-trait 기준으로 맞춘다. 이유는 질문 뱅크가 이미 `curious`를 쓰고 있어 사용자 제출 질문도 같은 기준으로 검수되어야 하기 때문이다.

완료 기준:

- `CANONICAL_TRAITS`에 `curious` 포함
- `comfort ↔ curious` 예시가 `approve_candidate`로 분류됨
- `npm run validate:question-review` 통과
- 관리자 문서가 canonical 10-trait를 설명함

### 2순위: 런타임 trait 키 정합성

앱 코드에서 `comfort_seeker` 같은 레거시 키가 새 데이터 경로에 들어가지 않게 한다. 레거시 라벨은 읽기 호환용으로 남길 수 있지만, 새로 생성되는 trait는 `comfort`를 사용해야 한다.

확인 대상:

- `src/services/aiService.ts`
- `src/utils/traitLabels.ts`
- `src/app/(tabs)/island.tsx`
- `src/components/island/PetOriginCard.tsx`

### 3순위: 배치 4 질문 추가

목표는 300개까지 확장하는 것이다. 배치 4는 배치 3 이후 부족해진 trait와 카테고리를 보강한다.

보강 우선순위:

- `solo`
- `social`
- `flow`
- 카테고리별 60개 균형

## 재사용 명령

```powershell
npm run validate:question-review
npm run validate:question-bank
node scripts/seed-question-bank.mjs > _tmp/question-bank.sql
$env:NEW_ONLY="1"; node scripts/seed-question-bank.mjs > _tmp/question-bank-new-only.sql
```

## 다음 배치 주의사항

- 기존 JSON 중간에 삽입하지 말고 파일 끝에 추가한다.
- `seed_key`는 현재 `bank-<category>-NNN` 인덱스 기반이므로 순서 변경이 위험하다.
- 배치 3 이후에는 `NEW_ONLY` 기준을 새 배치 경계에 맞게 갱신하거나, 시드 버전/배치 태그 기반 증분 방식으로 바꾸는 것을 검토한다.

## Links

- [[comfort-curious-fifth-axis]]
- [[external-question-sources-survey]]
- `data/question-bank/*.json`
- `scripts/seed-question-bank.mjs`
- `scripts/admin/question-bank-report.sql`
