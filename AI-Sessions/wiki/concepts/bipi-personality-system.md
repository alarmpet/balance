---
type: concept
date: 2026-06-03
status: active
author: Antigravity
---

# BIPI Personality System

## Summary

`BIPI` (Balance Island Personality Index)는 Balance Island의 독자적인 4축 성향 모델입니다. 일회성 진단이 아닌 매일의 밸런스 선택을 누적하여 사용자의 라이프스타일과 성향을 다각도로 매핑하고 시각화합니다.

## Context

전형적인 MBTI 검사의 정확성/상표권 리스크를 방지하고, 게임 요소에 맞게 특화하기 위해 독자적인 4축 체계와 캐릭터/섬 메타포를 결합하여 설계되었습니다.

## Details

### 1. BIPI 4대 성향 축 (Four Dimensions)

각 선택지(A/B)는 아래의 4대 축 점수와 매핑되어 누적됩니다.

| 축 이름 | 영문 키워드 | 한글 명칭 및 성향 설명 |
|---|---|---|
| **에너지 방향** | `solo` vs `social` | 혼자 충전형 (내향적 충전) vs 같이 충전형 (외향적 충전) |
| **선택 방식** | `safe` vs `adventure` | 안정 선택형 (리스크 최소화) vs 모험 선택형 (새로운 기회와 자극) |
| **생활 리듬** | `plan` vs `flow` | 계획 루틴형 (규칙과 계획) vs 즉흥 흐름형 (유연함과 상황 대응) |
| **감정 표현** | `calm` vs `express` | 차분 관찰형 (신중한 감정 조절) vs 솔직 표현형 (감정의 활발한 발산) |

### 2. 16개 성향 타입 및 칭호 (16 Types & Titles)

4축의 조합으로 생성되는 16개 타입은 세계관에 맞는 직관적이고 친근한 칭호로 명명됩니다.

- `SPCE`: 조용한 조개 정원사
- `SAFE`: 즉흥 파도 탐험가
- `PPCE`: 루틴을 짓는 등대지기
- `PAFE`: 번뜩이는 축제 항해사
- *(나머지 타입 명칭은 기획에 따라 확장)*

### 3. 성향 알(Egg)과 부화 (Hatching Stage)

- **초기 상태 (0~9회 투표):** 사용자가 회원가입 후 9번째 질문에 답할 때까지 아바타/펫은 아직 부화하지 않은 **알(Egg)** 상태로 유지됩니다.
- **부화 (10회 투표):** 10번째 투표 완료 시 누적된 trait 벡터를 기준으로 사용자의 BIPI 성향 타입이 최초로 결정되며, 해당 타입에 매핑되는 **펫/아바타**가 알에서 부화(Hatch)합니다.
- **Egg UI 처리:** 이 단계에서는 케어 행동 시 친밀도(`bond`) 대신 부화 진행도(`hatch_progress`)가 증가하며, 캐릭터 관련 UI는 빈(null) 값 대신 Egg 이미지와 전용 말풍선을 렌더링해야 합니다.

### 4. 상황별 다른 나 (Contextual Traits)

- 사용자의 전체 누적 성향 외에도 질문 카테고리(음식, 라이프, 연애, 커리어, 문화)별로 trait 점수를 분리 산출할 수 있습니다.
- 예: "커리어 질문에서는 `plan` 70%이지만, 연애 질문에서는 `flow` 80%"인 경우 이를 **"상황별 다른 나"** 인사이트 카드로 생성하여 다각적인 자기발견을 지원합니다.

## Links

- [[AI-Sessions/wiki/projects/balance-island-overview|Balance Island Overview]]
- [[AI-Sessions/wiki/concepts/pet-care-and-evolution-system|Pet Care & Evolution System]]
- [[AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review|2026-06-03 LiveOps & Economy Upgrade Review]]
