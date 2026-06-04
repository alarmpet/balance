---
type: source
date: 2026-06-04
status: active
source: WebSearch/WebFetch survey
---

# 외부 질문 소스 조사

## 결론

직접 재배포 가능한 한국어 밸런스 질문 데이터셋은 공개적으로 확인하지 못했다.  
영어 Would You Rather 계열 GitHub/커뮤니티 자료는 라이선스가 불명확하거나 오락성 질문 비중이 높아 성향 신호가 약하다.

따라서 Balance Island에서는 외부 질문을 그대로 가져오지 않는다. **IPIP(International Personality Item Pool)의 퍼블릭 도메인 성격 요인 구조를 trait 앵커로 삼아 한국어 밸런스 질문을 재창작**한다.

## 소스 판단

| 소스 | 판단 | 이유 |
|---|---|---|
| 한국어 밸런스 질문 모음 | 직접 사용 보류 | 공개 재배포 라이선스가 불명확함 |
| 영어 WYR GitHub repos | 직접 사용 보류 | 라이선스 미표기 또는 오락성 중심 |
| Reddit/커뮤니티 WYR | 직접 사용 보류 | ToS, 저작권, 맥락 안전 리스크 |
| IPIP | trait 앵커로 사용 | 퍼블릭 도메인 명시, Big Five 검증 기반 |

## IPIP와 5축 매핑

| IPIP/Big Five 방향 | Balance Island 축 |
|---|---|
| Extraversion | `solo ↔ social` |
| Conscientiousness | `flow ↔ plan` |
| Openness | `comfort ↔ curious` |
| Emotional stability / risk sensitivity | `adventure ↔ safe` |
| Agreeableness / expression tendency | `calm ↔ express` |

IPIP 문장을 번역하거나 복붙하지 않는다. 성격 요인의 방향만 참고해서 한국어 일상 선택지로 새로 만든다.

## 운영 원칙

- 외부 질문 문장은 seed에 직접 넣지 않는다.
- 출처가 불명확한 질문은 영감 정도로만 보고 자기화한다.
- 공식 질문은 `data/question-bank/*.json`에 재창작본으로만 저장한다.
- 검수는 `data/question-review/rubric.examples.jsonl`과 `scripts/admin/classify-pending-question.mjs`를 통과해야 한다.

## Links

- IPIP: https://ipip.ori.org/
- [[comfort-curious-fifth-axis]]
- [[balance-question-expansion-plan]]
