# Personality Insight Map Plan

작성 시각: 2026-06-02 KST  
리뷰 반영: 2026-06-02 15:30 KST

## 1. Executive Decision

밸런스 아일랜드의 “나의 섬”에는 Obsidian의 전체 지식 그래프와 마인드맵의 방사형 구조를 그대로 복제하지 않는다. 대신 `성향 인사이트 맵`이라는 하나의 기능으로 통합한다.

최종 방향:

- 섬 화면의 중심은 계속 `나의 성향 펫 + 섬 테마`로 둔다.
- 사용자의 질문 선택 데이터, 카테고리 선호, trait 누적 점수, 반복되는 선택 패턴을 `인사이트 노드`와 `연결선`으로 변환한다.
- 첫 화면은 직관적인 마인드맵 형태로 보여준다.
- 특정 노드를 누르면 Obsidian의 Local Graph처럼 해당 노드 주변 연결만 확대한다.
- 복잡한 전체 그래프는 MVP에서 숨기고, “오늘의 발견”, “성향 가지”, “연결 지도” 3가지 보기만 제공한다.

한 줄 제품 문장:

> 질문을 풀수록 나의 선택들이 섬 안의 지도로 자라나고, 내가 몰랐던 취향과 성향의 연결을 발견한다.

이 방식이 더 좋은 이유:

- 모바일에서 전체 그래프는 금방 복잡해져서 예쁜 장식이 되기 쉽다.
- 마인드맵은 중심에서 가지가 뻗어 직관적이지만, 복잡한 교차 연결을 보여주기 어렵다.
- Obsidian식 로컬 그래프는 “왜 이 성향이 나왔는지”를 추적하기 좋지만, 처음 보면 추상적이다.
- 따라서 기본은 마인드맵, 탐색은 로컬 그래프, 기록 해석은 AI 인사이트 카드로 분리한다.

## 2. Research Summary

### Obsidian 방식에서 가져올 것

Obsidian Graph view는 노트를 node, 내부 링크를 line으로 표현한다. 노드 크기, 링크 굵기, 방향, 필터, 그룹, 힘 기반 배치, Local Graph depth 같은 설정을 제공한다.

밸런스 아일랜드에 적용할 핵심:

- `Local Graph`: 현재 선택한 trait, 질문, 카테고리 주변만 보여준다.
- `Depth`: 1단계는 직접 연결, 2단계는 관련 선택 패턴까지 확장한다.
- `Node size`: trait 점수나 질문 참여 횟수가 클수록 크게 표시한다.
- `Link thickness`: 성향 가중치, 반복 빈도, 유사도 점수에 따라 굵게 표시한다.
- `Group color`: 푸드, 라이프, 연애, 커리어, 문화 등 카테고리별 색을 입힌다.

참고:

- Obsidian Graph view 공식 문서: https://help.obsidian.md/plugins/graph
- Obsidian Canvas 공식 문서: https://help.obsidian.md/Plugins/Canvas

### Obsidian Canvas 방식에서 가져올 것

Obsidian Canvas는 카드, 연결선, 그룹, 색상, 줌/팬을 이용해 생각을 배치한다.

밸런스 아일랜드에 적용할 핵심:

- 질문 선택 하나를 `카드`로 표현한다.
- “짜장면 선택”, “안정 성향 +2”, “푸드 카테고리 선호”처럼 선택 결과가 작은 카드로 연결된다.
- 사용자가 직접 편집하는 복잡한 캔버스는 MVP에서 제외한다.
- 대신 앱이 자동으로 “나의 선택 보드”를 생성한다.

### 마인드맵 방식에서 가져올 것

마인드맵은 중심 개념에서 큰 가지, 작은 가지로 뻗는 위계형 구조다. 중심을 `나`, 1차 가지를 `BIPI 성향 축`, 2차 가지를 `카테고리/질문/선택`, 3차 가지를 `발견 문장`으로 두면 모바일에서도 이해가 쉽다.

밸런스 아일랜드에 적용할 핵심:

- 중심 노드: 나의 성향 펫
- 1차 가지: 안정/모험, 계획/흐름, 혼자/함께, 차분/표현
- 2차 가지: 카테고리별 선택 패턴
- 3차 가지: 대표 질문과 AI 인사이트

참고:

- React Flow mind map example: https://github.com/xyflow/react-flow-mindmap-app
- React Flow auto layout examples: https://reactflow.dev/examples/layout/auto-layout

### 개인 데이터 자기성찰 연구에서 가져올 것

Personal Informatics 연구는 개인 데이터 시스템을 준비, 수집, 통합, 성찰, 행동 단계로 설명한다. 밸런스 아일랜드는 이미 질문 투표를 통해 수집 단계가 작동하고 있으므로, 다음 경쟁력은 통합과 성찰이다.

밸런스 아일랜드에 적용할 핵심:

- 단순 점수 표시가 아니라 “왜 이런 성향으로 보이는지” 근거를 보여준다.
- 사용자가 부정적으로 받아들이지 않도록 진단 문구를 피한다.
- “당신은 이런 사람입니다”가 아니라 “최근 선택에서 이런 흐름이 보여요”로 표현한다.
- 행동 단계는 무거운 자기계발 과제가 아니라 “오늘 이런 질문을 더 보면 지도가 선명해져요” 정도로 가볍게 둔다.

참고:

- Personal Informatics CHI 2010 workshop: https://v1.personalinformatics.org/chi2010/
- A Stage-Based Model of Personal Informatics Systems: https://www.cs.cmu.edu/~jhm/Readings/2010-ianli-chi-stage-based-model.pdf
- Personal Informatics, Self-Insight, and Behavior Change review: https://www.tandfonline.com/doi/abs/10.1080/07370024.2016.1276456

### 기술 리서치 결론

React Native Expo 앱에서 처음부터 React Flow를 핵심 모바일 UI로 쓰는 것은 권장하지 않는다. React Flow는 웹 기반 노드 UI에 강하고 GitHub 예제가 풍부하지만, 모바일 네이티브 환경에서는 WebView 래핑, 팬/줌 제스처, 성능 제어 비용이 커진다.

MVP 추천:

- 모바일/웹 공통: `react-native-svg` 기반의 직접 렌더링
- 배치 알고리즘: `d3-hierarchy`의 tree/cluster
- 상호작용: 노드 탭, depth 변경, 필터, 하단 상세 카드
- 고급 웹 전용 편집 캔버스: 추후 React Flow로 분리 가능

참고:

- react-native-svg GitHub topic: https://github.com/topics/react-native-svg
- react-native-svg-charts는 d3 계산과 react-native-svg 렌더링 조합을 사용한다: https://github.com/JesperLekland/react-native-svg-charts
- react-force-graph는 Canvas/WebGL 기반 force graph를 제공하지만 Expo 모바일 MVP에는 과하다: https://github.com/vasturiano/react-force-graph
- Cytoscape.js는 브라우저 네트워크 시각화에 강하지만 MVP 모바일 앱의 가벼운 섬 UI에는 과하다: https://academic.oup.com/bioinformatics/article/32/2/309/1744007

## 3. Product Concept

기능명:

`나의 선택 지도`

화면 위치:

- `src/app/(tabs)/island.tsx` 안에 “인사이트 지도” 섹션을 추가한다.
- 초기에는 섬 화면 하단 카드로 시작한다.
- 이후 별도 상세 화면 `src/app/insight-map.tsx`로 확장한다.

사용자 경험:

1. 사용자가 피드에서 밸런스 질문에 투표한다.
2. `votes`, `question_traits`, `user_traits`, `questions.category_id`가 누적된다.
3. 섬 화면에 “오늘 새로 연결된 성향” 카드가 뜬다.
4. 카드를 누르면 나의 성향 펫을 중심으로 마인드맵이 열린다.
5. `모험`, `계획`, `푸드`, `연애`, `대표 질문` 같은 노드가 가지처럼 펼쳐진다.
6. 특정 노드를 누르면 주변 연결만 확대되어 Obsidian Local Graph처럼 보인다.
7. 하단 설명 카드가 “최근 푸드 질문에서는 즉흥 선택이 많고, 커리어 질문에서는 안정 선택이 많아요”처럼 해석한다.

## 4. Data Model

새 테이블을 과하게 늘리지 않고, 먼저 RPC에서 가상 그래프를 생성한다. 저장이 필요한 AI 인사이트만 별도 테이블에 둔다.

### Migration Order

인사이트 맵 migration은 현재 적용된 아래 migration 이후에만 실행한다.

- `202606011940_run_ready_security.sql`
- `202606012125_gamification_foundation.sql`
- `202606012330_feed_state_and_ledger_hardening.sql`
- `202606020200_personality_pet_theme_economy.sql`

권장 파일명:

- `supabase/migrations/202606021500_personality_insight_map.sql`

이 순서를 지켜야 하는 이유:

- `user_insight_cards.user_id`는 `profiles(id)`를 참조한다.
- 그래프 RPC는 `user_pet_state`, `pet_species`, `theme_skins`를 참조할 수 있는데, 이 테이블은 pet/theme economy migration 이후에 생성된다.
- `profiles` 직접 update 권한은 이미 회수되어 있으므로, 새 기능은 `profiles`를 수정하지 않고 insight 전용 테이블과 SECURITY DEFINER RPC만 사용해야 한다.

### Existing Inputs

- `profiles.total_participation_count`
- `profiles.today_participation_count`
- `user_traits.trait_key`
- `user_traits.score`
- `votes.question_id`
- `votes.selected_option`
- `questions.category_id`
- `questions.title`
- `questions.option_a_title`
- `questions.option_b_title`
- `question_traits.question_id`
- `question_traits.option_side`
- `question_traits.trait_key`
- `question_traits.weight`
- `categories.slug`
- `categories.name`
- `user_pet_state.species_id`
- `pet_species.display_name`
- `theme_skins.display_name`

### New Table: user_insight_cards

목적:

AI 또는 서버 규칙이 생성한 “발견 문장”을 캐시한다.

필드:

- `id uuid primary key`
- `user_id uuid references profiles(id) on delete cascade`
- `insight_key text not null`
- `title text not null`
- `body text not null`
- `primary_trait_key text`
- `secondary_trait_key text`
- `category_slug text`
- `confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1)`
- `evidence jsonb not null default '{}'::jsonb`
- `is_read boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

unique:

- `(user_id, insight_key)`

RLS:

- authenticated 사용자는 자기 row만 select.
- insert/update는 서버 RPC만 수행.
- 클라이언트 직접 insert/update/delete 정책은 만들지 않는다.

권장 인덱스:

- `idx_user_insight_cards_user_id` on `(user_id, is_read, created_at desc)`

이력 관리:

- MVP에서는 `(user_id, insight_key)` unique 제약으로 같은 인사이트를 갱신한다.
- 장기적으로는 성향 변화 기록을 보존하기 위해 `insight_key`에 주차/날짜 접미사를 붙이거나 `user_insight_history` 테이블을 분리한다.

### Virtual Graph Shape

RPC `get_personality_insight_graph(p_focus_node_id text default null, p_depth integer default 1)`가 반환할 JSON:

```json
{
  "nodes": [
    {
      "id": "pet:self",
      "kind": "pet",
      "label": "나의 성향 펫",
      "size": 42,
      "color": "#38bdf8",
      "score": 1,
      "meta": {}
    }
  ],
  "edges": [
    {
      "id": "edge:pet:self->trait:safe",
      "source": "pet:self",
      "target": "trait:safe",
      "kind": "affinity",
      "weight": 0.82,
      "label": "자주 선택"
    }
  ],
  "summary": {
    "title": "안정적인 선택이 섬의 중심을 만들고 있어요",
    "body": "최근 선택에서는 안정과 계획 성향이 함께 자주 등장했어요.",
    "completion": 0.64
  }
}
```

Node kinds:

- `pet`
- `trait`
- `category`
- `question`
- `choice`
- `theme`
- `insight`

Edge kinds:

- `trait_score`
- `category_affinity`
- `question_evidence`
- `choice_to_trait`
- `pet_affinity`
- `theme_match`
- `balance`
- `recent_change`

## 5. Scoring Rules

### Trait Node Size

```
node_size = 18 + min(28, normalized_trait_score * 28)
```

`normalized_trait_score`는 유저의 최대 trait score 대비 비율로 계산한다.

### Category Link Weight

```
category_weight = votes_in_category / max_votes_in_any_category
```

### Question Evidence Weight

```
question_weight = abs(question_trait.weight) / max_abs_weight_for_user_recent_questions
```

### Balance Edge

서로 반대 축이 모두 높을 때 “모순”이 아니라 `균형 연결`로 보여준다.

예:

- `safe`와 `adventure`가 모두 상위권이면 “상황에 따라 안정과 모험을 오가는 타입”
- `plan`과 `flow`가 모두 높으면 “큰 흐름은 열어두고 중요한 건 정리하는 타입”

```
if min(axis_left_score, axis_right_score) / max(axis_left_score, axis_right_score) >= 0.65:
  create balance edge
```

### Recent Change Edge

최근 7일 선택이 전체 누적과 다를 때 보여준다. 이 기능은 MVP가 아니라 P1로 둔다.

```
recent_delta = recent_normalized_trait_score - lifetime_normalized_trait_score
if abs(recent_delta) >= 0.18:
  create recent_change edge
```

## 6. UX Design

### Island Preview Card

섬 화면에 들어갈 카드:

- 제목: `나의 선택 지도`
- 서브카피: `질문 42개가 8개의 성향 가지로 연결됐어요`
- 작은 미리보기: 펫 중심 + 4개 trait 노드
- CTA: `지도 열기`
- 보조 CTA: `오늘의 발견`

게스트 상태:

- `src/data/guestInsightGraph.ts`의 정적 JSON 샘플 그래프를 보여준다.
- 샘플 시나리오는 “가상의 사용자가 30개 질문에 답한 결과”로 구성한다.
- 카피: `로그인하면 내 선택으로 지도가 자라나요`
- mutation 없음.

### Insight Map Full Screen

상단:

- 섬 이름
- 조개 잔액
- 보기 전환 segmented control
  - `발견`
  - `마인드맵`
  - `연결`

`발견` 보기:

- AI/규칙 기반 인사이트 카드 목록
- 각 카드에는 근거 질문 2~3개 표시
- “진단” 대신 “최근 흐름” 표현
- 스크린 리더 대응을 위해 `accessibilityLabel`을 넣는다.

`마인드맵` 보기:

- 중심: 성향 펫
- 1차 가지: BIPI 축
- 2차 가지: 카테고리
- 3차 가지: 대표 질문
- 터치하면 하단 sheet에 설명 표시

`연결` 보기:

- Obsidian Local Graph 스타일
- 선택한 노드 주변 depth 1~2만 표시
- 필터: 질문, 카테고리, 성향, 테마
- 노드가 너무 많으면 최근 30일 또는 상위 weight 40개만 표시
- MVP에서는 `recent_change` edge를 표시하지 않는다.

### Visual Style

첨부 이미지 방향과 맞춘다.

- 파스텔톤 섬 배경
- 흰색 rounded panel
- 조개, 별, 말풍선, 바다색 라인
- 그래프 노드는 딱딱한 원보다 조개, 별, 잎, 물방울 같은 심볼 형태
- 연결선은 딱딱한 직선보다 부드러운 곡선
- 중요 노드의 반짝임은 MVP에서 과하지 않게 처리한다.

## 7. Technical Architecture

### Backend

새 RPC:

- `get_personality_insight_graph(p_focus_node_id text default null, p_depth integer default 1)`
- `refresh_user_insight_cards()`
- `mark_insight_card_read(p_insight_id uuid)`

RPC 원칙:

- 클라이언트는 raw votes 전체를 직접 조합하지 않는다.
- 그래프 생성에 필요한 최소 JSON만 받는다.
- 게스트는 fallback mock graph를 사용한다.
- authenticated는 자기 데이터만 접근한다.
- `get_personality_insight_graph`는 섬 화면의 기본 gamification snapshot과 함께 호출하지 않는다. 섬 화면에서는 preview만 즉시 보여주고, 사용자가 `지도 열기`를 누를 때 lazy load한다.
- RPC 내부에서 최근 30일 투표, 상위 trait 10개, 최종 노드 40개 이하를 SQL 레벨에서 강제한다. 클라이언트에서만 잘라내지 않는다.
- 질문 노드는 첫 구현에서 제외하거나 대표 질문 3개 이하로 제한한다. trait/category 중심 그래프를 먼저 완성한다.
- `refresh_user_insight_cards`와 `mark_insight_card_read`는 `SECURITY DEFINER`로 두되, 함수 내부에서 항상 `auth.uid()` 기준으로 row를 제한한다.
- `refresh_user_insight_cards`는 `profiles`를 수정하지 않는다. 참여 횟수와 trait 통계는 읽기 전용으로만 사용한다.

### Loading Strategy

섬 화면 초기 로딩:

1. `fetchGamificationSnapshot()`만 호출한다.
2. `InsightMapPreview`는 snapshot의 `traits`와 guest fallback만 사용해 가벼운 미리보기를 렌더링한다.
3. 사용자가 상세 지도를 열면 `fetchInsightGraph()`가 RPC를 호출한다.
4. 이미 받은 그래프는 `insightMapStore`에 캐시한다.

이유:

- 현재 `fetchGamificationSnapshot()`은 profile, traits, avatar, pet, ledger, equipped theme, inventory, island, character를 병렬로 조회한다.
- 여기에 그래프 조인 RPC까지 섬 진입 시 붙이면 첫 화면 로딩이 느려질 수 있다.
- 인사이트 지도는 사용자가 탭했을 때 로딩해도 UX상 자연스럽다.

### Frontend Files

Create:

- `src/services/insightMapService.ts`
- `src/store/insightMapStore.ts`
- `src/data/guestInsightGraph.ts`
- `src/components/insight/InsightMapPreview.tsx`
- `src/components/insight/InsightGraphCanvas.tsx`
- `src/components/insight/InsightNodeDetailSheet.tsx`
- `src/app/insight-map.tsx`

Modify:

- `src/app/(tabs)/island.tsx`
- `src/types/database.types.ts`
- `supabase/migrations/202606021500_personality_insight_map.sql`

### Rendering Recommendation

MVP:

- `react-native-svg`로 노드와 링크를 직접 렌더링한다.
- `d3-hierarchy`로 radial/tree 좌표를 계산한다.
- 복잡한 force simulation은 쓰지 않는다.
- 좌표 계산 결과는 focus node와 depth가 바뀔 때만 다시 계산한다.
- 노드/엣지 컴포넌트는 `React.memo`로 감싸 props가 같으면 리렌더링하지 않는다.
- 중요 노드의 반짝임은 MVP에서 CSS/간단 opacity 수준으로 제한한다. `react-native-reanimated`는 현재 의존성에 없으므로, 성능 검증 후 별도 의존성 추가가 필요할 때만 도입한다.

이유:

- 모바일 성능이 더 예측 가능하다.
- Expo Web/Native 공통 구현이 가능하다.
- 사용자가 직접 노드를 드래그하는 편집 기능이 없으므로 React Flow가 꼭 필요하지 않다.
- React Flow는 추후 웹 전용 “내 선택 보드 편집기”에서 쓰는 것이 더 적합하다.

### Store Boundary

`gamificationStore`와 `insightMapStore`의 책임을 분리한다.

- `gamificationStore`: profile, shell, streak, pet, theme inventory, `snapshot.traits`
- `insightMapStore`: graph nodes/edges, focus node, depth, selected node, insight cards, loading/error

`insightMapStore`는 trait 원본 데이터를 중복 저장하지 않는다. 섬 preview는 `gamificationStore.snapshot.traits`를 읽고, 상세 지도는 RPC 결과만 저장한다.

## 8. AI Insight Rules

AI는 모든 그래프를 생성하지 않는다. 그래프 노드와 엣지는 서버 규칙으로 계산하고, AI는 사람이 읽기 쉬운 문장만 만든다.

AI 입력:

- 상위 trait 5개
- 최근 7일 trait delta
- 카테고리별 투표 수
- 대표 질문 3개
- balance edge 여부
- pet species

AI 출력:

```json
{
  "insight_key": "safe_plan_food_recent_001",
  "title": "편안함을 고르지만 기준은 꽤 분명해요",
  "body": "최근 푸드 질문에서는 익숙한 선택을 선호했지만, 커리어 질문에서는 계획 성향이 더 강하게 나타났어요.",
  "primary_trait_key": "safe",
  "secondary_trait_key": "plan",
  "category_slug": "food",
  "confidence": 0.78,
  "evidence_question_ids": ["..."]
}
```

금지 표현:

- “당신의 진짜 성격”
- “정확한 심리 진단”
- “MBTI보다 정확”
- “당신은 반드시 이런 사람”

권장 표현:

- “최근 선택에서는”
- “이런 흐름이 보여요”
- “상황에 따라”
- “당신의 섬은 지금 이런 방향으로 자라고 있어요”

AI 호출 시점:

- 매 투표마다 AI를 호출하지 않는다.
- MVP에서는 규칙 기반 카드부터 시작한다.
- AI 인사이트는 투표 10회 단위 또는 하루 1회, 사용자가 상세 지도를 열 때 만료된 카드에 대해서만 갱신한다.
- Edge Function을 사용할 경우 `refine-question`/`embed-question`에서 이미 발견된 리스크와 동일하게 Supabase JWT 검증, authenticated 제한, user/IP rate limit을 적용한다.

## 9. Privacy and Safety

개인 성향 지도는 앱의 핵심 가치인 동시에 민감하게 느껴질 수 있다.

필수 원칙:

- 다른 유저에게 기본 공개하지 않는다.
- 공유 이미지는 사용자가 직접 선택한 일부 카드만 내보낸다.
- raw vote 목록 전체 공개 금지.
- AI 인사이트는 심리 진단이 아니라 선택 패턴 해석임을 UI 문구로 분명히 한다.
- 삭제 요청 시 `user_insight_cards`와 그래프 캐시를 함께 삭제할 수 있어야 한다.
- 발견 카드에는 `accessibilityLabel`을 붙여 스크린 리더가 핵심 내용을 읽을 수 있게 한다.
- 그래프만으로 정보를 전달하지 않고, 동일한 내용을 하단 텍스트 카드로도 제공한다.

## 10. MVP Scope

### P0

- 섬 화면에 `나의 선택 지도` preview card 추가
- `user_insight_cards` DDL, RLS, 읽음 처리 RPC 추가
- `get_personality_insight_graph` RPC 구현
- RPC SQL 내부에서 최근 30일, 상위 trait 10개, 노드 40개 제한 강제
- `InsightGraphCanvas` radial mindmap 구현
- node tap detail sheet 구현
- guest fallback graph 구현
- 상위 trait, category, 대표 질문 3개 이하 표시

### P1

- Local Graph depth 1/2 전환
- `균형 연결` 표시
- recent change edge 표시
- AI 인사이트 생성 Edge Function 또는 RPC pipeline
- 일 1회 또는 투표 10회 단위 인사이트 갱신 제한

### P2

- 웹 전용 React Flow canvas
- 사용자가 직접 노드 고정/메모 추가
- 지도 이미지 공유
- 주간 리포트
- 친구와 익명 성향 지도 비교
- `user_insight_history`로 장기 변화 기록 보존
- 전용 섬 테마 SVG 심볼 5~7종 제작

## 11. Implementation Plan Outline

1. SQL migration 작성
   - `user_insight_cards` 생성
   - RLS 추가
   - `mark_insight_card_read` RPC 추가
   - `get_personality_insight_graph` RPC 추가. 첫 버전은 trait/category 중심으로 제한한다.

2. TypeScript 타입 확장
   - `InsightGraphNode`
   - `InsightGraphEdge`
   - `InsightGraphSnapshot`
   - `UserInsightCardRow`

3. 서비스 레이어 추가
   - `fetchInsightGraph`
   - `fetchInsightCards`
   - `markInsightRead`

4. Zustand store 추가
   - `snapshot`
   - `cards`
   - `focusNodeId`
   - `depth`
   - `selectedNodeId`
   - `isLoading`
   - `error`

5. 게스트 fallback 정적 JSON 추가
   - `src/data/guestInsightGraph.ts`
   - 30개 질문을 답한 가상 결과 시나리오

6. 섬 화면 preview 연결
   - 기존 gamification snapshot 아래에 card 추가
   - guest preview 제공
   - preview 단계에서는 그래프 RPC를 호출하지 않는다.

7. 상세 화면 구현
   - 발견/마인드맵/연결 segmented control
   - SVG radial layout
   - node detail sheet

8. 성능 검증
   - 노드 20개, 40개 케이스 렌더링 확인
   - focus node 변경 시에만 좌표 재계산되는지 확인

9. 검증
   - `npm.cmd run typecheck`
   - Expo web smoke test
   - 게스트 모드 확인
   - authenticated Supabase RPC smoke test

## 12. Open Risks

- 현재 일부 문서와 UI 문자열에 깨진 인코딩 흔적이 있다. 인사이트 지도 작업 전에 주요 사용자 노출 문자열을 UTF-8 한국어로 복구해야 앱 인상이 무너지지 않는다.
- raw graph가 커지면 모바일 렌더링이 느려질 수 있다. MVP는 상위 40개 노드 제한을 둔다.
- 섬 진입 시 그래프 RPC를 즉시 호출하면 초기 로딩이 느려질 수 있다. 그래프는 상세 지도 진입 시 lazy load한다.
- AI 인사이트가 과도하게 단정적이면 사용자가 불쾌하게 받아들일 수 있다. 규칙 기반 문장과 금지 표현 필터를 먼저 둔다.
- React Flow를 바로 도입하면 모바일 구현 비용이 커진다. 웹 전용 확장까지 보류한다.
- Supabase RPC가 너무 많은 조인을 수행하면 느려질 수 있다. 필요하면 30일 window와 materialized cache를 둔다.
- Edge Function 기반 AI 갱신은 JWT 검증과 rate limit이 준비되기 전에는 배포하지 않는다.
- `d3-hierarchy`와 `react-native-svg`는 현재 package.json에 없다. 구현 시 의존성 추가와 Expo Web/Native smoke test가 필요하다.

## 13. Success Criteria

- 사용자가 “왜 내 펫이 이 성향인지”를 질문 2~3개 근거로 이해한다.
- 섬 화면에서 성향 지도 preview가 1초 안에 표시된다.
- 섬 화면 최초 진입은 인사이트 그래프 RPC를 기다리지 않는다.
- 상세 지도에서 node 40개 이하 기준으로 모바일 스크롤/탭이 부드럽다.
- 게스트 모드에서도 샘플 지도가 보인다.
- 로그인 유저는 실제 `user_traits`와 `votes` 기반 지도를 본다.
- 문구는 모두 한국어이며 진단처럼 단정하지 않는다.

## 14. Review Report Validation

2026-06-02 `insight_map_review_report.md` 검토 결과 채택한 항목:

- 그래프 RPC는 gamification snapshot과 분리하고 상세 지도 진입 시 lazy load한다.
- RPC 내부에서 최근 30일, 상위 trait 10개, 노드 40개 제한을 SQL 레벨로 강제한다.
- migration 파일명은 기존 4개 migration 이후인 `202606021500_personality_insight_map.sql` 이상으로 둔다.
- `refresh_user_insight_cards`는 `SECURITY DEFINER`로 두되 `auth.uid()` 기준으로만 읽고 쓴다.
- `user_insight_cards.confidence`는 0~1 check constraint를 둔다.
- 게스트 그래프는 정적 JSON으로 번들한다.
- contradiction edge는 사용자 문구에서 `균형 연결`로 표현한다.
- recent change edge는 MVP에서 제외하고 P1로 이동한다.
- `insightMapStore`는 그래프 전용 상태만 들고, trait 원본은 `gamificationStore.snapshot.traits`를 사용한다.
- 접근성 대응으로 발견 카드와 상세 텍스트에 `accessibilityLabel`을 둔다.

보류한 항목:

- `react-native-reanimated` 기반 반짝임은 현재 의존성이 없으므로 MVP 필수 요건으로 채택하지 않는다. 구현 중 성능 문제가 확인되거나 고급 애니메이션이 필요할 때 별도 의존성 추가를 검토한다.
