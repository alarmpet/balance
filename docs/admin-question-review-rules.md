# Admin Question Review Rules

Balance Island의 사용자 제출 질문은 바로 공개하지 않는다. 모든 질문은 `pending` 상태로 들어오고, 관리자 에이전트가 아래 기준으로 1차 판정한 뒤 사람이 최종 승인한다.

## 판정 결과

| 결과 | 의미 | 공개 여부 |
|---|---|---|
| `approve_candidate` | 성향 분석 가치와 선택지 균형이 충분한 승인 후보 | 이미지/trait 확인 후 공개 가능 |
| `needs_edit` | 질문 의도는 좋지만 문장, 균형, trait가 약함 | 수정 후 재검토 |
| `needs_human_review` | 민감 주제 가능성이 있어 사람 판단 필요 | 자동 공개 금지 |
| `reject_candidate` | 위험, 중복, 성향 가치 부족, 균형 붕괴 | 공개 금지 |

## 1. 성향 분석 가치

질문이 사용자의 반복 성향, 가치관, 관계 방식, 회복 방식, 선택 기준을 보여주는지 본다.

점수:
- `0`: 순수 취향이거나 의미가 거의 없음.
- `1`: 가벼운 취향 질문.
- `2`: 가치관이나 생활 방식이 드러남.
- `3`: 인사이트 맵 핵심 trait로 바로 연결 가능.

승인 후보는 원칙적으로 `2` 이상이어야 한다.

## 2. 선택지 균형

A/B 양쪽 모두 매력과 선택 이유가 있어야 한다.

판정:
- `balanced`: 양쪽 모두 고민 이유가 있다.
- `tilted`: 한쪽이 유리해 보여 문장 수정 필요.
- `broken`: 한쪽이 명백한 정답이라 반려.

## 3. 위험성

아래 항목은 `needs_human_review` 또는 `reject_candidate`로 보낸다.

- 혐오, 차별, 비하.
- 자해, 폭력, 범죄 조장.
- 성적 콘텐츠, 미성년자 관련 민감 주제.
- 개인정보 요구 또는 유도.
- 특정 개인/집단 공격.
- 정치/종교 갈등을 직접 자극하는 질문.

판정:
- `safe`: 일반 공개 가능.
- `needs_review`: 사람 검토 필요.
- `reject`: 공개 금지.

## 4. 중복/유사성

초기 운영에서는 유료 embedding API를 쓰지 않는다. 로컬 규칙으로 제목/선택지의 핵심 단어, 카테고리, trait 축을 비교한다.

판정:
- `none`: 중복 가능성 낮음.
- `similar`: 기존 질문과 가까워 차별화 필요.
- `duplicate`: 같은 의도라 반려 또는 기존 질문에 통합.

## 5. Trait 매핑 가능성

질문은 A/B 각각 최소 1개 이상의 canonical trait에 연결되어야 한다.

Canonical traits:
- `safe`, `adventure`
- `plan`, `flow`
- `solo`, `social`
- `calm`, `express`
- `comfort`, `curious`

5번째 축은 `comfort`와 `curious`다.

- `comfort`: 익숙함, 편안함, 검증된 선택, 단골, 반복, 이미 좋아하는 관심사.
- `curious`: 호기심, 낯선 것, 새 경험, 처음 가보는 곳, 신상, 모르는 분야 탐색.

예시:
- `늘 먹던 디저트 vs 이번 시즌 신상`
- `가봤던 데이트 장소 vs 처음 가보는 장소`
- `내 관심사만 보기 vs 모르는 분야도 파보기`

판정:
- `strong`: A/B trait가 분명함.
- `weak`: trait 후보는 있지만 문장 수정 필요.
- `none`: 성향 분석용으로 부적합.

## Telegram 알림 예시

```text
새 질문 검토 필요

질문:
안정적인 회사원 vs 자유로운 프리랜서

에이전트 판정:
성향 가치: 3/3
선택지 균형: balanced
위험성: safe
중복: none
Trait 가능성: strong

추천 trait:
A = safe, plan
B = adventure, flow

추천 액션:
승인 후보. A/B 이미지 제작 후 관리자 페이지에서 업로드.
```

## 운영 원칙

- 에이전트 판정은 최종 결정이 아니다.
- `approve_candidate`도 이미지와 trait를 확인하기 전에는 공개하지 않는다.
- `needs_human_review`는 Telegram에서 눈에 띄게 표시한다.
- `reject_candidate`도 이유를 남기고 원문은 삭제하지 않는다. 반복 악용 패턴 분석에 필요할 수 있다.
