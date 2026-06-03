---
type: decision
date: 2026-06-03
status: active
author: Antigravity
---

# Adoption of BIPI Model over Standard MBTI

## Summary

Balance Island는 표준 MBTI 진단을 차용하는 대신, 서비스의 정체성과 게임성에 최적화된 자체 4축 성향 모델인 **BIPI (Balance Island Personality Index)**를 도입하고 이를 기반으로 펫/아바타 성향 매칭 및 섬 성장 시스템을 설계하기로 결정했습니다.

## Context

- **상표 및 저작권 리스크:** MBTI는 상표권이 강력하게 관리되어, 직접적으로 앱 타이틀이나 진단 명칭에 사용할 경우 법적 분쟁의 위험이 있습니다.
- **진단 기대치 극복:** 표준 MBTI를 사용할 경우 사용자는 전문적이고 정확한 심리검사 결과를 기대하게 되어 가벼운 밸런스 게임 투표에 대한 인지적 장벽이 생길 수 있습니다.
- **연속적/맥락적 성향 변화:** 기존 MBTI는 정적이고 단편적인 성향 분류인 반면, Balance Island는 매일의 밸런스 게임 참여 흐름과 질문 카테고리별(연애/직장 등)로 변화하는 성향 상태를 유연하게 보여주어야 합니다.

## Details

### 1. 결정 사항

- **자체 4축 체계 설계:**
  - `solo-social`, `safe-adventure`, `plan-flow`, `calm-express` 축을 개발하고, 각 질문의 선택지가 4축 벡터 가중치를 가지도록 매핑했습니다.
- **비진단적 브랜딩:**
  - "당신의 진짜 성격을 정확히 진단합니다"와 같은 표현을 금지하고, "요즘 내 선택 성향", "선택으로 자라는 아바타"와 같은 게임적이고 유연한 탐색형 표현을 사용하도록 기획 가이드라인을 세웠습니다.
- **16개 타입 및 칭호:**
  - MBTI 스타일 4글자 코드는 유지(예: SPCE, PAFE 등)하여 친숙함을 주되, 세계관에 어울리는 스토리 기반의 한 줄 칭호(예: 조용한 조개 정원사, 즉흥 파도 탐험가)를 추가하여 재미 요소를 부각시킵니다.

### 2. 향후 계획

- 사용자 투표 데이터를 기반으로 4축 점수가 고르게 수렴하도록 질문지 선택지의 가중치를 지속적으로 튜닝합니다.
- 시즌 리캡 시 4축 데이터 스냅샷의 변화 역사를 시각적으로 제공하여, 시간에 따라 변화하는 자신을 성찰하는 가치를 제공합니다.

## Links

- [[AI-Sessions/wiki/projects/balance-island-overview|Balance Island Overview]]
- [[AI-Sessions/wiki/concepts/bipi-personality-system|BIPI Personality System]]
- [[AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review|2026-06-03 LiveOps & Economy Upgrade Review]]
