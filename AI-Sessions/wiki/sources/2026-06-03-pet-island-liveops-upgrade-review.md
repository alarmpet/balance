---
type: source
date: 2026-06-03
status: active
source: docs/2026-06-03-pet-island-liveops-upgrade-review.md
---

# Balance Island 업그레이드 리뷰: "놀면서 나를 발견하는 섬" 진화 방향

작성일: 2026-06-03 15:30 KST
작성자: Claude Opus 4.6 (Thinking)
검토 대상: `2026-06-03-pet-island-liveops-economy.md` 및 관련 계획서 6건
리서치 범위: GitHub, 웹 자료, 학술 연구, 경쟁 앱 분석

---

## 0. 리뷰 요약

`pet-island-liveops-economy.md`는 이미 매우 탄탄한 전략 문서입니다. 특히:

- "펫은 나, 섬은 내가 살아가고 싶은 세계"라는 핵심 문장이 제품 방향을 명확히 잡고 있음
- LiveOps 캘린더, 가챠 윤리(확률 공개/천장/중복 전환), 한국 법규 대응이 잘 반영됨
- Obsidian + 마인드맵 하이브리드 접근이 모바일에 맞게 단순화됨

이 리뷰는 기존 계획을 부정하는 것이 아니라, **"심심풀이 밸런스 게임 → 다마구찌 펫 케어 → 나도 모르던 나의 발견"** 이라는 사용자 여정을 더 깊고 중독적으로 만들기 위한 업그레이드 의견을 제시합니다.

---

## 1. 핵심 업그레이드 제안: "살아있는 자기발견 생태계"

### 1.1 현재 구조의 강점과 보완점

| 영역 | 현재 상태 | 보완 기회 |
|------|-----------|-----------|
| 밸런스 게임 | ✅ 피드 기반 투표, trait 누적 | 선택 후 즉각적 피드백이 약함 |
| 펫 케어 | ✅ 간식/놀기/칭찬, 기분/에너지 | 다마구찌 수준의 생생한 반응이 부족 |
| 자기발견 | ✅ 인사이트 카드, 마인드맵 | "오늘 나에 대해 뭘 알게 됐지?" 감동 부족 |
| 섬/공간 | ✅ 테마 배경, 장착 시스템 | 섬이 "나의 내면 지도"로 느껴지기엔 아직 추상적 |

### 1.2 제안하는 통합 비전

> **"매일 2분, 밸런스 게임을 하면 펫이 내 선택을 먹고 반응하고, 섬에 내 성향의 꽃이 피고, 어느 날 문득 '나는 이런 사람이구나'를 발견한다."**

이 한 문장이 앱의 모든 기능을 관통해야 합니다.

---

## 2. 밸런스 게임 → "선택의 울림" 업그레이드

### 2.1 문제: 투표 후 감정적 보상이 약함

현재 투표 플로우: 카드 보기 → A/B 선택 → 결과 비율 표시 → 다음 카드

이 구조는 "재미는 있지만 의미는 없는" 느낌을 줄 위험이 있습니다.

### 2.2 제안: "선택 반향 (Choice Echo)" 시스템

투표 직후 1~2초간 **짧은 반향 카드**를 보여줍니다:

```
┌─────────────────────────────┐
│  🌊 당신의 선택이 섬에 울렸어요  │
│                             │
│  "즉흥 여행" 선택 →           │
│  모험 +1.2  |  흐름 +0.8     │
│                             │
│  🐾 비숑이 신나서 뛰어다녀요!   │
│                             │
│  [섬 지도에서 보기]  [다음 질문]  │
└─────────────────────────────┘
```

**근거:**

- **Finch 앱**의 핵심 성공 요인은 "사용자의 행동이 펫에게 직접 영향을 준다"는 인과적 피드백 루프입니다. Finch는 셀프케어 행동을 에너지로 변환해 펫을 모험에 보내는 구조로 높은 리텐션을 달성했습니다.
  - 출처: Deconstructor of Fun의 Finch 분석, ScreensDesign Finch 리뷰
- **Personal Informatics 연구**에서 "수집 → 통합 → 성찰" 단계 중, 대부분의 앱이 "수집"에서 멈추고 "성찰"로 연결하지 못한다고 지적합니다. Balance Island는 투표 직후에 미세한 성찰 순간을 삽입할 수 있는 드문 기회를 가지고 있습니다.
  - 출처: Li et al., "A Stage-Based Model of Personal Informatics Systems", CHI 2010

### 2.3 제안: "오늘의 딜레마 테마"

매일 3~5개의 질문을 하나의 테마로 묶습니다:

- 월요일: "혼자 vs 같이" 주간
- 화요일: "안정 vs 모험" 주간
- 수요일: "계획 vs 즉흥" 주간

이렇게 하면:
1. 사용자가 "오늘은 어떤 주제인지" 궁금해서 돌아옴
2. 같은 축의 질문을 연속으로 풀면 trait 점수가 빠르게 쌓여 변화를 체감
3. 주간 끝에 "이번 주 당신의 선택 요약"을 Spotify Wrapped 스타일로 보여줄 수 있음

**Spotify Wrapped 참조:**
- Spotify Wrapped의 핵심은 "데이터를 스토리로 변환"하는 것입니다. 사용자를 주인공으로, 숫자를 감정적 맥락으로 치환합니다.
- Balance Island도 "이번 주 당신은 12번의 선택 중 9번을 '즉흥' 쪽으로 했어요. 당신의 비숑이 '파도 타는 자유인' 기분을 느끼고 있어요."처럼 데이터를 이야기로 전달할 수 있습니다.
  - 출처: UX Playbook의 Spotify Wrapped 분석, Irrational Labs의 행동과학 분석

---

## 3. 다마구찌 펫 케어 → "살아있는 성향 동반자" 업그레이드

### 3.1 현재 한계

현재 펫 케어: `간식/놀기/칭찬` → `기분/에너지 수치 변화`

이것은 "수치 조작"에 가깝고, 다마구찌의 핵심이었던 **"살아있는 존재와의 정서적 교감"**이 부족합니다.

### 3.2 제안: 펫의 "성향 반응 시스템"

펫이 사용자의 선택 패턴에 따라 **성격적으로 반응**하게 만듭니다:

#### A. 펫 말풍선 반응 (투표 기반)

사용자의 최근 투표 패턴에 따라 펫이 다른 말을 합니다:

```
[모험 성향이 연속 3회 이상 높아졌을 때]
🐾 비숑: "오늘 뭔가 새로운 거 해보고 싶은 기분이야! 🌟"

[안정 성향이 꾸준할 때]
🐾 비숑: "우리 섬이 점점 아늑해지고 있어... 좋아 ☁️"

[상반된 성향이 번갈아 나올 때]
🐾 비숑: "너 요즘 고민 많은 것 같아... 괜찮아? 🌊"
```

#### B. 펫 상태의 유기적 변화

다마구찌의 핵심 매력은 "돌보지 않으면 상태가 악화된다"입니다. 현재 mood/energy 시스템을 확장합니다:

| 상태 | 트리거 | 펫 반응 |
|------|--------|---------|
| 😊 행복 | 매일 투표 + 케어 | 활발한 애니메이션, 밝은 표정 |
| 😐 보통 | 1일 미접속 | 약간 축 처진 표정, "어디 갔어?" |
| 😴 졸림 | 2일 미접속 | 잠든 모습, "...zzz" |
| 😢 외로움 | 3일+ 미접속 | 비 오는 섬, "보고 싶었어..." |
| 🤩 신남 | 연속 7일 참여 | 특별 애니메이션, 보너스 조개 |

**핵심 원칙: 벌주지 않되, 감정적으로 보고 싶게 만든다.**

Finch 앱의 교훈: "앱을 안 열었을 때 벌을 주면 사용자가 떠나고, 감정적으로 그리워하게 만들면 돌아온다."

#### C. 펫 일기 시스템

매일 밤, 펫이 사용자의 오늘 선택을 기반으로 짧은 일기를 씁니다:

```
📖 비숑의 오늘 일기 (6월 3일)

"오늘 주인이 '즉흥 여행 vs 계획 여행'에서 즉흥을 골랐어.
나도 갑자기 어디론가 떠나고 싶어졌어!
우리 섬의 '흐름' 꽃이 한 송이 더 피었어. 🌸

이번 주 주인의 선택을 보면,
겉으로는 안정을 좋아하는 것 같은데
가끔 모험을 선택할 때 뭔가 설레는 것 같아.
그 균형이 주인만의 매력이야."
```

이 일기가 `user_insight_cards`와 연결되면, 펫이 인사이트를 전달하는 감성적 채널이 됩니다.

**GitHub 참조:**
- 다마구찌형 앱의 오픈소스 구현들은 대부분 hunger/happiness/discipline 3축 시스템을 사용하지만, Balance Island는 이를 BIPI 4축과 연결하면 독창적인 "성향 반응형 다마구찌"가 됩니다.

---

## 4. 인사이트 맵 → "Obsidian × 마인드맵 × 섬 지도" 통합 업그레이드

### 4.1 현재 구조의 강점

기존 계획의 3단계 보기 모드(오늘의 발견 / 성향 가지 / 연결 지도)는 잘 설계되어 있습니다. 이 리뷰에서는 각 모드를 더 "살아있는" 경험으로 만드는 방법을 제안합니다.

### 4.2 제안: "성장하는 섬 지도" — 공간적 자기발견

#### A. 섬의 지리가 나의 성향이 된다

추상적인 노드-엣지 그래프 대신, **섬의 지리적 공간**으로 성향을 표현합니다:

```
         ⛰️ 모험의 언덕
        /            \
  🌲 계획의 숲  ---  🏖️ 흐름의 해변
        \            /
    🏠 안정의 마을  ---  🎪 표현의 광장
        |
    🌙 혼자의 동굴  ---  🎭 함께의 축제장
```

- 사용자의 투표가 쌓이면 해당 영역이 **물리적으로 성장**합니다
- 모험 성향이 높으면 ⛰️ 모험의 언덕이 더 높아지고, 길이 뚜렷해짐
- 안정 성향이 높으면 🏠 안정의 마을에 집이 늘어남
- 양쪽이 모두 높으면 두 영역 사이에 **"균형의 다리"**가 놓임

이 접근은 Obsidian Canvas의 "공간적 배치" 아이디어와 마인드맵의 "위계적 구조"를 모바일에 맞게 변환한 것입니다.

**참고:**
- Obsidian Canvas는 카드, 연결선, 그룹, 색상을 이용해 생각을 공간적으로 배치합니다.
  - 출처: https://obsidian.md/canvas
- 마인드맵은 중심에서 방사형으로 뻗는 구조로 모바일에서 직관적입니다.
  - 출처: https://en.wikipedia.org/wiki/Mind_map

#### B. "나의 선택 별자리" — Obsidian Graph의 모바일 변환

Obsidian Local Graph에서 영감을 받되, **별자리 메타포**로 변환합니다:

```
                 ★ 안정
               / | \
         ★ 푸드  ★ 계획  ★ 커리어
          |       |
    ★ "짜장면"  ★ "루틴"
      [나의 선택]  [나의 선택]
```

- 각 투표가 별(★)이 됩니다
- 같은 trait에 연결된 별들이 별자리(constellation)를 형성합니다
- 시간이 지나면 "나의 별자리"가 점점 복잡해지고, 이것이 곧 "나의 내면 지도"가 됩니다

**이 방식의 장점:**
1. Obsidian의 전체 그래프가 가진 "복잡함" 문제를 피함
2. 마인드맵의 "단순한 위계" 한계를 극복 — 별자리는 교차 연결을 자연스럽게 표현
3. "별자리가 자라나는" 시각적 만족감이 높음
4. Obsidian의 Local Graph depth 개념을 "별자리 확대/축소"로 변환 가능

**기술 참조:**
- `react-native-svg` + `d3-hierarchy`의 tree/cluster 레이아웃이 MVP에 적합
- `react-native-skia`는 60fps 애니메이션이 필요한 고급 단계에서 고려
  - 출처: React Flow mind map example (https://github.com/xyflow/react-flow-mindmap-app)

#### C. "시간 여행" 기능 — 과거의 나와 지금의 나

Obsidian의 Periodic Notes/Reflection 플러그인에서 영감을 받은 기능:

```
┌─────────────────────────────┐
│  📅 1개월 전의 나 vs 지금의 나  │
│                             │
│  1개월 전: 안정 73% | 모험 27% │
│  지금:     안정 58% | 모험 42% │
│                             │
│  💡 "최근 모험적인 선택이       │
│      눈에 띄게 늘었어요.        │
│      혹시 요즘 새로운 도전을     │
│      하고 있나요?"             │
│                             │
│  🐾 비숑: "주인이 점점 대담해   │
│      지는 것 같아! 나도 신나!"  │
└─────────────────────────────┘
```

이것은 Personal Informatics 연구의 "성찰(reflection)" 단계를 구현하는 것입니다.

**참고:**
- Personal Informatics 연구는 "수집 → 통합 → 성찰 → 행동"의 4단계 모델을 제시합니다. 대부분의 앱이 수집에서 멈추지만, Balance Island는 성향 변화의 시간적 흐름을 보여줌으로써 자연스럽게 성찰 단계로 진입시킬 수 있습니다.
  - 출처: Li et al., "A Stage-Based Model of Personal Informatics Systems" (https://www.cs.cmu.edu/~jhm/Readings/2010-ianli-chi-stage-based-model.pdf)

---

## 5. LiveOps × 자기발견 융합 제안

### 5.1 "Spotify Wrapped" 스타일 주간/월간/시즌 리캡

기존 LiveOps 캘린더에 **데이터 스토리텔링 이벤트**를 추가합니다:

#### 주간 리캡 (매주 일요일)

```
┌─────────────────────────────────┐
│  🌊 이번 주 나의 밸런스 여행      │
│                                 │
│  📊 총 23개 질문에 답했어요       │
│  🏆 가장 많이 선택한 성향: 흐름    │
│  🎯 가장 갈등한 질문:             │
│     "계획된 여행 vs 즉흥 여행"    │
│                                 │
│  🐾 비숑의 한마디:               │
│  "이번 주 주인은 '즉흥'을 많이     │
│   골랐는데, '커리어'에서만        │
│   유독 '계획'을 골랐어.           │
│   일할 때와 놀 때의 모드가         │
│   다른 사람인 것 같아!"           │
│                                 │
│  [공유하기]  [섬에서 자세히 보기]   │
└─────────────────────────────────┘
```

#### 시즌 리캡 (4주마다)

- "시즌 1의 나" 스토리 카드 5~7장을 인스타 스토리처럼 넘기는 형태
- 각 카드: 대표 선택, 성향 변화 그래프, 펫의 성장, 섬의 변화
- **공유 최적화**: 각 카드를 SNS 공유용 이미지로 자동 생성

**이 구조의 핵심:**
- Spotify Wrapped가 증명한 것: "데이터를 돌려주면 사용자가 자발적으로 공유한다"
- 공유 = 바이럴 = 신규 유입

### 5.2 "성향 이벤트" — 질문 테마 주간

| 주차 | 이벤트 | 특별 보상 |
|------|--------|-----------|
| 1주 | "혼자 vs 같이" 여행 주간 | 이벤트 한정 테마 "달빛 캠핑" |
| 2주 | "맛 vs 분위기" 미식 주간 | 이벤트 한정 데코 "네온 카페 의자" |
| 3주 | "안정 vs 도전" 커리어 주간 | 이벤트 한정 펫 스킨 |
| 4주 | 시즌 피날레 + 리캡 | 시즌 배지 + 특별 인사이트 리포트 |

### 5.3 "Anniversary 나의 선택의 1년" (이미 계획에 있음 + 보강)

기존 계획의 "내 선택의 1년" 리캡에 추가:

- **"1년 전 오늘의 나"**: 1년 전 같은 날의 투표 기록을 보여줌 (Obsidian Reflection 플러그인 참조)
- **"성향 타임라인"**: 12개월간 BIPI 4축의 변화를 선 그래프로 표시
- **"가장 나다운 질문 TOP 5"**: 1년간 가장 빠르게 답한(갈등 없이 확신한) 질문들

---

## 6. 기술 구현 제안

### 6.1 펫 반응 시스템 데이터 모델

```sql
-- 펫 말풍선 템플릿
CREATE TABLE pet_dialogue_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL,  -- 'trait_streak', 'mood_change', 'comeback', 'daily_diary'
  trigger_condition jsonb NOT NULL,  -- {"trait_key": "adventure", "consecutive_count": 3}
  dialogue_text text NOT NULL,
  pet_expression text DEFAULT 'happy',  -- 'happy', 'sleepy', 'excited', 'worried', 'proud'
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- 펫 일기
CREATE TABLE pet_diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  diary_text text NOT NULL,
  trait_snapshot jsonb NOT NULL,
  mood_snapshot jsonb NOT NULL,
  insight_card_id uuid REFERENCES user_insight_cards(id),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_date)
);
```

### 6.2 섬 지리 시스템 데이터 모델

```sql
-- 섬 영역 (trait 기반 동적 지리)
CREATE TABLE island_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,  -- 'adventure_hill', 'stability_village', etc.
  display_name text NOT NULL,
  trait_key text NOT NULL,  -- 연결된 BIPI 축
  icon text NOT NULL,
  base_description text NOT NULL,
  growth_descriptions jsonb NOT NULL,  -- {"10": "작은 언덕", "50": "높은 봉우리", "100": "눈 덮인 산"}
  position_x numeric NOT NULL,
  position_y numeric NOT NULL
);

-- 사용자별 영역 성장 상태
CREATE TABLE user_island_zones (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES island_zones(id),
  growth_level integer DEFAULT 0,
  landmark_count integer DEFAULT 0,
  last_grew_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, zone_id)
);
```

### 6.3 별자리 시각화 기술 스택

MVP 단계:
- `react-native-svg` + `d3-hierarchy` (tree/cluster 레이아웃)
- 노드 탭 시 Obsidian Local Graph 스타일의 주변 연결 확대
- `react-native-reanimated`로 부드러운 전환 애니메이션

고급 단계:
- `react-native-skia`로 GPU 가속 렌더링 (60fps 별자리 애니메이션)
- 핀치 줌/팬 제스처 (`react-native-gesture-handler`)
- WebGL 기반 파티클 이펙트 (전설 테마 별자리에만)

---

## 7. "Would You Rather" → 자기발견 연결의 심화

### 7.1 학술적 근거

"밸런스 게임(Would You Rather)" 형식은 심리학에서 **강제 선택(Forced-Choice)** 또는 **이산 선택 실험(Discrete Choice Experiment)**이라고 부르며, 성격 검사에서 사회적 바람직성 편향을 줄이는 데 효과적인 방법으로 알려져 있습니다.

MBTI보다 Balance Island가 더 나을 수 있는 이유:

1. **진단이 아니라 탐색**: MBTI는 "당신은 이런 유형"이라고 단정짓지만, Balance Island는 "최근 선택에서 이런 흐름이 보여요"라고 열어둠
2. **시간에 따른 변화 추적**: MBTI는 한 번의 테스트지만, Balance Island는 매일의 선택이 누적됨
3. **맥락 민감성**: "연애에서는 즉흥, 커리어에서는 계획"처럼 카테고리별 다른 성향을 보여줄 수 있음

### 7.2 제안: "모순 발견" 기능

사용자의 투표 기록에서 **카테고리별로 상반된 성향**이 나타날 때, 이를 부정적으로("일관성이 없다") 표현하지 않고, 긍정적으로("당신은 상황에 따라 다른 모습을 보이는 풍부한 사람") 표현합니다:

```
💡 발견: 상황별 다른 나

"연애 질문에서는 80% '표현' 성향이지만,
 직장 질문에서는 70% '차분' 성향이에요.

 이것은 일관성이 없는 게 아니라,
 사랑하는 사람 앞에서는 솔직하고
 일할 때는 신중한 당신의 지혜예요."
```

이 기능이 기존 `user_insight_cards`와 잘 연결됩니다.

---

## 8. 구현 우선순위 재제안

기존 계획의 Phase 1~8을 유지하면서, 각 Phase에 이 리뷰의 제안을 삽입합니다:

### Phase 1 (기존 + 보강): 섬이 나를 설명한다

- 기존: "오늘의 발견" 카드
- **추가**: 투표 직후 "선택 반향" 마이크로 카드 (2초)
- **추가**: 펫 말풍선 반응 시스템 (trait streak 기반, 5~10개 템플릿으로 시작)

### Phase 2 (기존 + 보강): 테마 뽑기의 가치

- 기존: 확률 모달, 천장 카운터
- **추가**: 뽑은 테마와 "나의 성향"의 연결 문구 강화

### Phase 3 (기존): 펫 변이

- 기존 유지

### Phase 3.5 (신규): 펫 일기 + 주간 리캡

- 펫 일기 시스템 (하루 1개, 자동 생성)
- 주간 리캡 카드 (Spotify Wrapped 미니 버전)
- SNS 공유 이미지 자동 생성

### Phase 4 (기존 + 보강): 섬 마인드맵

- 기존: 방사형 "성향 가지" 맵
- **대안/보강**: 섬 지리적 맵 + 별자리 모드 선택 가능
- "시간 여행" 기능 (1개월/3개월 전 비교)

### Phase 4.5 (신규): 모순 발견 + 카테고리별 성향 분리

- 카테고리별 BIPI 분리 계산
- "상황별 다른 나" 인사이트 카드

### Phase 5~8: 기존 유지

---

## 9. 경쟁 앱 포지셔닝

| 앱 | 핵심 루프 | Balance Island 차별점 |
|----|-----------|----------------------|
| Finch | 습관 → 펫 에너지 → 모험 | 밸런스 게임이 습관보다 재미있고 진입장벽 낮음 |
| MBTI 앱들 | 한 번 테스트 → 유형 배정 | 매일 변화하는 살아있는 성향 지도 |
| Forest | 집중 → 나무 성장 | 성향 발견이라는 지적 보상이 추가됨 |
| Animal Crossing | 꾸미기 + 수집 | 꾸미기의 근거가 "나의 선택 데이터" |
| Obsidian | 지식 연결 그래프 | 모바일 + 게임화 + 자동 생성 |
| Habitica | 습관 → RPG | 전투 대신 자기이해라는 더 깊은 보상 |

Balance Island의 독보적 포지션:

> **"유일하게 '재미있는 게임'과 '자기이해'를 동시에 제공하는 앱"**

---

## 10. 위험 요소 및 가드레일

### 10.1 ⚠️ 과도한 심리 진단 표현 금지

- "당신은 이런 사람입니다"라는 단정적 표현은 절대 사용하지 않음
- 항상 "최근 선택에서 이런 흐름이 보여요"라는 탐색적 표현 사용
- 앱 하단에 "이 결과는 심리 진단이 아니며, 재미를 위한 참고 정보입니다" 면책 문구

### 10.2 ⚠️ 펫 감정 조작의 윤리적 경계

- 펫이 "울거나" "화내는" 극단적 반응은 피함
- "보고 싶었어"까지는 OK, "네가 안 와서 아팠어"는 NG
- 미접속 후 복귀 시 항상 긍정적 환영("돌아와서 기뻐!")

### 10.3 ⚠️ 데이터 프라이버시

- 성향 데이터는 기본적으로 비공개
- 공유는 사용자가 명시적으로 선택한 요약 카드만
- 전체 투표 기록이나 세부 trait 점수는 외부에 노출하지 않음

---

## 11. 최종 의견

`pet-island-liveops-economy.md`는 이미 Balance Island의 경제와 수집 욕구를 잘 설계한 문서입니다. 이 리뷰에서 제안하는 핵심 보강은 세 가지입니다:

1. **즉각적 감정 피드백**: 투표 → 펫 반응 → 섬 변화를 0.5초 이내로 체감시킴
2. **데이터 스토리텔링**: 숫자를 이야기로 변환하는 Spotify Wrapped식 리캡
3. **공간적 자기발견**: 추상적 그래프 대신 "성장하는 섬 지리 + 별자리"로 변환

이 세 가지가 더해지면, Balance Island는 단순한 "밸런스 게임 + 가챠 앱"이 아니라 **"매일 2분, 나를 발견하는 여정"**이 됩니다.

그리고 이것이 가장 강력한 리텐션 엔진입니다 — 사용자가 돌아오는 이유가 "보상"이 아니라 **"나에 대한 호기심"**이 되기 때문입니다.

---

## 참조 자료

### 앱 사례
- Finch Self-Care App: 가상 펫 기반 셀프케어 앱. 행동 → 펫 에너지 → 모험 루프
  - https://finchcare.com/
  - Deconstructor of Fun 분석: https://deconstructoroffun.com/
- Spotify Wrapped: 개인 데이터 스토리텔링의 정석
  - UX Playbook 분석: https://uxplaybook.org/

### 시각화 기술
- React Flow Mind Map: https://github.com/xyflow/react-flow-mindmap-app
- react-native-svg: https://github.com/software-mansion/react-native-svg
- d3-hierarchy: https://github.com/d3/d3-hierarchy
- react-native-skia: https://github.com/Shopify/react-native-skia

### Obsidian 참조
- Obsidian Graph View: https://help.obsidian.md/plugins/graph
- Obsidian Canvas: https://obsidian.md/canvas
- Obsidian Local Graph Depth: https://www.reddit.com/r/ObsidianMD/comments/1ij8hqd

### 학술 연구
- Personal Informatics Stage Model: https://www.cs.cmu.edu/~jhm/Readings/2010-ianli-chi-stage-based-model.pdf
- Personal Informatics Self-Insight Review: https://www.tandfonline.com/doi/abs/10.1080/07370024.2016.1276456
- Mind Map (Wikipedia): https://en.wikipedia.org/wiki/Mind_map
- Forced-Choice Preference Elicitation: Discrete Choice Experiment (DCE) methodology

### 가챠/경제 참조
- Apple App Store Review Guidelines (확률 공개): https://developer.apple.com/app-store/review/guidelines/
- Roblox Creator Docs (가상 아이템 확률 공개): https://github.com/Roblox/creator-docs
- 한국 확률형 아이템 정보공개 제도: https://www.korea.kr/news/policyNewsView.do?newsId=148927317

---

> 이 문서는 UTF-8로 인코딩되어 있습니다.
