---
type: decision
date: 2026-06-04
status: active
source: balance-question-expansion-plan.md
---

# 성향 5번째 축 확정: comfort ↔ curious

## 결정

Balance Island의 질문 기반 성향 모델은 기존 4개 대립 축에 더해 5번째 축을 `comfort ↔ curious`로 확정한다.

| 축 | A | B | 의미 |
|---|---|---|---|
| 1 | `safe` | `adventure` | 위험 감수와 안정 선호 |
| 2 | `plan` | `flow` | 계획성과 즉흥성 |
| 3 | `solo` | `social` | 혼자 충전과 함께 충전 |
| 4 | `calm` | `express` | 차분한 처리와 직접 표현 |
| 5 | `comfort` | `curious` | 익숙함과 새로움 |

`comfort`는 익숙함, 편안함, 검증된 선택, 루틴, 단골 취향을 뜻한다.  
`curious`는 호기심, 낯선 경험, 새 메뉴, 새 분야, 탐색, 실험을 뜻한다.

## 이유

- 기존 `comfort`는 단독 trait라 반대 방향이 약했다.
- 사용자가 원하는 앱 정체성은 단순 취향 테스트가 아니라 "내가 무엇을 반복해서 고르고, 무엇에 끌리는지"를 보여주는 것이다.
- `safe ↔ adventure`와 `comfort ↔ curious`는 다르다. 전자는 위험 감수 성향이고, 후자는 새로움 추구 성향이다.
- IPIP/Big Five의 Openness 방향은 `comfort ↔ curious`로 재창작해 쓰는 것이 가장 자연스럽다.

## 적용 범위

- `data/question-bank/*.json` 질문 뱅크는 `curious`를 공식 trait로 사용한다.
- `scripts/seed-question-bank.mjs`는 canonical trait 10개를 검증한다.
- `scripts/admin/classify-pending-question.mjs`는 사용자 제출 질문에서도 `curious` 후보를 제안한다.
- `compute_user_trait_contradictions` 계열 표시에서는 `comfort=익숙함`, `curious=호기심`으로 보여준다.

## 다음 기준

질문을 만들 때 아래 유형은 `comfort ↔ curious` 축 후보로 우선 검토한다.

- 늘 먹던 메뉴 vs 이번 시즌 신상
- 가봤던 장소 vs 처음 가보는 장소
- 내 관심사만 보기 vs 모르는 분야도 파보기
- 무난한 인기 취미 vs 남들이 잘 안 하는 취미

## Links

- [[balance-question-expansion-plan]]
- [[external-question-sources-survey]]
- `scripts/admin/classify-pending-question.mjs`
- `data/question-review/rubric.examples.jsonl`
