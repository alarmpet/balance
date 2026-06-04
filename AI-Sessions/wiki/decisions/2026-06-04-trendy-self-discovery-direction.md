---
type: decision
date: 2026-06-04
status: active
author: Claude Opus 4.8
source: docs/2026-06-04-trendy-self-discovery-upgrade-plan.md
---

# 트렌디 자기발견 제품 방향 채택 (2026-06-04)

## Summary

Balance Island를 **"가볍게 즐기는 밸런스게임 → 자연스러운 자기발견 → 직관적 시각화 → 희귀펫 수집"** 의 단일 인과 루프로 묶는 제품 방향을 채택합니다. 2026-06-04 딥리서치(웹검색·GitHub·커뮤니티·학술자료·경쟁 앱)와 기존 리뷰 6건을 종합한 결과이며, 전체 상세 계획은 [[docs/2026-06-04-trendy-self-discovery-upgrade-plan|트렌디 자기발견 업그레이드 계획서]]에 있습니다.

## Context

- 시장 분석상 [밸런스게임 공유력 + 가상펫 정서 리텐션 + 가챠 소유욕 + Obsidian식 연결 시각화]를 한 제품으로 묶은 성공 사례가 뚜렷하지 않아 **빈 포지션**이 존재합니다.
- 2026 외부 트렌드(참여형·즉시반응 콘텐츠 강세, "희귀도"가 바이럴 훅, 가상펫 시장 급성장, 코지 가챠 부상, 방치형 성장)가 모두 이 방향과 정합합니다.
- 기존 리뷰들이 개별 기능(Choice Echo, 펫 반응, 섬 지도, 가챠 윤리)을 잘 설계했으나, 이를 **하나의 서사로 통합하는 상위 의사결정**이 필요했습니다.

## Details

### 채택한 핵심 의사결정

1. **수집을 자기발견의 보상으로 번역.** 희귀펫을 단독 가챠가 아니라 "내 성향이 만들어낸 나만의 희귀펫"으로 연결해 소유욕과 정체성을 결합합니다. (일반 가챠앱과의 결정적 차별점)
2. **시각화는 점진 공개.** Obsidian 그래프를 그대로 모바일에 이식하지 않고 **오늘의 발견(카드) → 섬 지형(공간적·기본) → 별자리(추상·더보기)** 3단계로 인지부하를 통제합니다. 추상 노드그래프를 첫 화면에 두지 않습니다.
3. **희귀도 노출을 바이럴 훅으로.** Choice Echo와 공유 카드에 "이 선택은 전체의 N%"를 노출합니다.
4. **모순 발견을 핵심 aha로.** 카테고리별 BIPI 분리 계산을 선행해 "상황별 다른 나"를 긍정적으로 제시합니다. ([[AI-Sessions/wiki/concepts/bipi-personality-system|BIPI 모델]] 확장 의존성)
5. **기반 안정화 우선.** 기능 추가 전에 Phase 0(DROP TABLE 차단, Edge rate limit 적용, 이미지 자체 호스팅, 모바일 딥링크 QA)을 완료합니다.

### 로드맵 우선순위

Phase 0 기반 토목공사 → Phase 1 핵심 루프(희귀도 Choice Echo, 펫 말풍선, 오늘의 딜레마 테마) → Phase 2 직관 자기지도(섬 지형↔별자리, semantic zoom, 모순 발견) → Phase 3 소유욕 엔진(가챠 공시 UI, 성향 서사, 무료재화 루프) → Phase 3.5 정서·바이럴(펫 일기, 주간 리캡, 시간여행) → Phase 4 수익화(리텐션 검증 후).

### 가드레일 (유지)

비진단 톤 · 확률/천장 공시 · 민감정보(정치·종교·성적지향·건강) 분류 제외 · MBTI 차용 금지 · 코스메틱 전용 가챠.

## Links

- [[docs/2026-06-04-trendy-self-discovery-upgrade-plan|트렌디 자기발견 업그레이드 계획서 (전체 상세)]]
- [[AI-Sessions/wiki/projects/balance-island-overview|Balance Island Overview]]
- [[AI-Sessions/wiki/decisions/bipi-model-adoption|BIPI Model Adoption]]
- [[AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review|2026-06-03 LiveOps Upgrade Review]]
- [[AI-Sessions/wiki/sources/2026-06-03-comprehensive-review|2026-06-03 Comprehensive Review]]
- [[research|활성 리서치 및 리스크]]
