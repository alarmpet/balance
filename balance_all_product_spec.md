# 세상의 모든 밸런스 — 코딩 LLM 참조용 제품 기획서

문서 버전: v0.1  
작성 목적: Cursor, Codex, Claude Code, Gemini CLI 등 코딩 LLM이 이 문서를 기준으로 MVP 앱을 설계·구현할 수 있게 하기 위한 제품 명세서  
핵심 방향: Threads처럼 빠르게 읽고 반응하는 텍스트 기반 피드 + Obsidian처럼 내가 고른 선택들이 나중에 가치관 그래프로 연결되는 앱

---

## 1. 제품 한 줄 정의

**세상의 모든 밸런스는 사람들이 일상 속 애매한 선택을 A/B 질문으로 올리고, 모두가 한 번의 탭으로 선택·공감·저장하며, 시간이 지나면 내 선택들이 가치관 그래프로 연결되는 소셜 선택 앱이다.**

짧게 말하면:

> 세상은 선택으로 움직이고, 나는 내 선택으로 나를 알아간다.

---

## 2. 왜 이 방향인가

기존 아이디어였던 펫, 섬, 성향 RPG는 귀엽지만 첫 진입 설명이 길다. 반면 밸런스 질문은 즉시 이해된다.

사용자는 앱에 들어오자마자 다음 행동을 할 수 있어야 한다.

1. 질문을 본다.
2. A 또는 B를 고른다.
3. 사람들이 어떻게 골랐는지 본다.
4. 내 선택이 쌓여서 그래프가 된다.
5. 내가 궁금한 것도 올린다.

이 구조는 **읽기 쉽고, 선택하기 쉽고, 공유하기 쉽고, 나중에 다시 볼 이유가 있다.**

---

## 3. 핵심 제품 철학

### 3.1 Threads에서 가져올 것

- 짧은 텍스트 중심 피드
- 긴 글보다 즉각적인 반응
- 가벼운 공감, 댓글, 저장
- 알고리즘 추천 피드
- 부담 없는 작성 경험
- 누군가의 생각에 바로 올라타는 흐름

### 3.2 Obsidian에서 가져올 것

- 내 기록이 쌓일수록 의미가 커지는 구조
- 태그와 연결을 통한 자기 이해
- 그래프 뷰를 통한 시각적 통찰
- 한 번의 선택이 나중에 내 가치관 노드가 되는 경험
- 기록은 단순 로그가 아니라 생각의 지도라는 관점

### 3.3 우리가 새롭게 만들 것

Threads는 빠르지만 내 생각이 흘러가 버린다.  
Obsidian은 깊지만 진입 장벽이 높다.

이 앱은 둘 사이에 있다.

> 지금은 가볍게 고르고, 나중에는 깊게 보인다.

---

## 4. MVP 핵심 기능

MVP는 아래 4개만 구현한다.

1. **피드**: 사람들이 올린 밸런스 질문을 보고 A/B 선택
2. **작성**: 내가 궁금한 밸런스 질문 작성
3. **상세**: 투표 결과, 한줄 인사이트, 댓글 확인
4. **그래프**: 내가 고른 선택을 가치관 노드로 시각화

펫, O/X, 포획, 레벨 시스템은 MVP에서 제외하거나 나중에 보상 레이어로 확장한다.

---

## 5. 핵심 루프

### 5.1 기본 사용 루프

```text
피드 진입 → 질문 확인 → A/B 선택 → 결과 확인 → 공감/댓글/저장 → 다음 질문
```

### 5.2 작성 루프

```text
내 고민 발생 → A/B 질문 작성 → 카테고리 선택 → 익명 게시 → 투표 누적 → 결과 확인
```

### 5.3 자기 이해 루프

```text
여러 질문에 답변 → 선택 기록 누적 → 가치관 태그 자동 추출 → 그래프 생성 → 내 패턴 발견
```

### 5.4 공유 루프

```text
결과 카드 확인 → “나는 23% 소수파” 공유 → 친구 유입 → 친구도 선택 → 비교
```

---

## 6. 정보 구조 IA

하단 탭은 4개로 시작한다.

1. **피드**
   - 추천 밸런스
   - 오늘의 밸런스
   - 인기 밸런스
   - 내가 저장한 질문으로 확장 가능

2. **작성**
   - 선택 A 입력
   - 선택 B 입력
   - 카테고리 선택
   - 설명 입력
   - 익명/댓글/기간 설정

3. **그래프**
   - 내 선택 그래프
   - 주요 가치관 노드
   - 최근 선택 경향
   - 비슷한 사람

4. **마이**
   - 프로필
   - 내가 만든 질문
   - 내가 참여한 질문
   - 저장한 질문
   - 설정

---

## 7. 화면 명세

## 7.1 화면 1: 피드 홈

### 목적
사용자가 들어오자마자 바로 선택하게 만든다.

### 핵심 UI
- 상단 앱명: `세상의 모든 밸런스`
- 부제: `오늘도 세상은 선택으로 움직인다`
- 검색 아이콘
- 알림 아이콘
- 랭킹 또는 왕관 아이콘
- 질문 카드 리스트
- 플로팅 작성 버튼
- 하단 탭

### 대표 질문 카드 구조

```text
[카테고리 배지] 오늘의 밸런스

평생 라면 금지 vs 평생 치킨 금지

[A] 평생 라면 금지
[B] 평생 치킨 금지

42% ━━━━━ 58%
참여 12.4K명

공감 1.2K | 댓글 345 | 저장 2.1K
```

### 카드 데이터
- id
- title
- option_a_text
- option_b_text
- option_a_image_url optional
- option_b_image_url optional
- category
- vote_a_count
- vote_b_count
- comment_count
- empathy_count
- save_count
- created_at
- author_id
- is_anonymous

### UX 원칙
- 질문 하나를 읽는 데 2초 이내
- 선택 버튼은 엄지로 누르기 쉬운 크기
- 결과는 선택 후 즉시 표시
- 댓글보다 선택 결과가 먼저 보여야 함

---

## 7.2 화면 2: 밸런스 작성

### 목적
사용자가 고민을 쉽고 빠르게 질문으로 바꾸게 한다.

### 화면 구조

```text
밸런스 작성
헷갈리는 선택, 세상에 물어보세요

밸런스 질문 만들기
선택 A: 퇴근 후 바로 자기
VS
선택 B: 퇴근 후 2시간 자유시간 갖기

카테고리 선택
연애 | 회사 | 일상 | 돈 | 취향 | 공부

추가 설명 optional
요즘 피로가 너무 쌓여서 무조건 자야 할지,
그래도 내 시간을 가져야 할지 고민돼요 😥

익명으로 올리기 ON
댓글 허용 ON
투표 기간 24시간

[게시하기]
```

### 입력 제한
- 선택 A: 최대 40자
- 선택 B: 최대 40자
- 설명: 최대 120자
- 카테고리: 1개 필수
- 투표 기간: 24시간 기본값

### 작성 UX 원칙
- 긴 제목을 따로 쓰게 하지 않는다.
- A/B만 입력하면 제목은 자동 생성한다.
- 예: `퇴근 후 바로 자기 vs 퇴근 후 2시간 자유시간 갖기`
- 익명 기본값 ON 권장

---

## 7.3 화면 3: 밸런스 상세

### 목적
하나의 질문에 대해 결과, 이유, 사람들의 반응을 깊게 본다.

### 화면 구조

```text
밸런스 상세

친구 5명 깊게 사귀기 vs 지인 100명 넓게 알기

[A] 친구 5명 깊게 사귀기
[B] 지인 100명 넓게 알기

64% vs 36%
참여 18.2K명

한줄 인사이트
대부분은 깊은 관계의 안정감을 더 중요하게 생각했어요.

공감 1.8K | 저장 2.7K | 공유하기

댓글 812
- 넓어도 결국 남는 건 깊은 친구 몇 명이더라 😊
- 지인 백 명 있어도 막상 힘들 땐 연락할 사람 없던 적 많음 ㅠ
- 깊은 관계는 시간을 투자해야 생기지! 완전 공감 👍

[나도 투표하기] [비슷한 질문 보기]
```

### 댓글 정책
- 짧은 댓글 중심
- 악성 댓글 방지를 위해 신고 기능 필요
- 초반에는 댓글보다 `공감 이유 칩`을 먼저 제공하는 것도 좋음

예시 이유 칩:
- 현실적으로 A
- 감정적으로 B
- 돈 때문
- 시간이 아까움
- 둘 다 싫음
- 고민 중

---

## 7.4 화면 4: 내 선택 그래프

### 목적
사용자가 자신의 선택이 어떤 가치관으로 연결되는지 본다.

### 화면 구조

```text
내 선택 그래프
내가 고른 답들이 어떤 가치관으로 이어지는지 한눈에 보기

[그래프 영역]
중앙: 나의 선택
주변 노드: 효율, 안정, 관계, 자유, 돈, 건강, 혼자시간, 도전

인사이트 카드 1
당신은 최근 '자유'와 '효율'을 자주 선택했어요.

인사이트 카드 2
가장 자주 고민한 주제: 일상 · 관계

인사이트 카드 3
이번 달 선택 성향: 신중 68% / 즉흥 32%

비슷한 사람
- 나와 92% 비슷한 선택
- 나와 87% 비슷한 선택
```

### 그래프 원칙
- 복잡한 Obsidian 그래프를 그대로 따라 하지 않는다.
- 사용자가 한눈에 이해할 수 있는 단순한 가치관 지도여야 한다.
- 노드는 8~12개까지만 보여준다.
- 누르면 관련 선택 기록 목록으로 이동한다.

### 기본 노드 후보
- 자유
- 안정
- 효율
- 관계
- 돈
- 건강
- 혼자시간
- 도전
- 감성
- 성장
- 현실
- 재미

---

## 8. 데이터 모델 초안

아래는 Supabase/PostgreSQL 기준 예시다.

### 8.1 users

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  avatar_url text,
  birth_year int,
  gender text,
  region text,
  created_at timestamptz default now()
);
```

### 8.2 balance_questions

```sql
create table balance_questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references users(id),
  title text not null,
  option_a text not null,
  option_b text not null,
  description text,
  category text not null,
  is_anonymous boolean default true,
  allow_comments boolean default true,
  status text default 'active',
  vote_ends_at timestamptz,
  created_at timestamptz default now()
);
```

### 8.3 balance_votes

```sql
create table balance_votes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references balance_questions(id) on delete cascade,
  user_id uuid references users(id),
  selected_option text check (selected_option in ('A', 'B')),
  created_at timestamptz default now(),
  unique(question_id, user_id)
);
```

### 8.4 comments

```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references balance_questions(id) on delete cascade,
  user_id uuid references users(id),
  body text not null,
  like_count int default 0,
  created_at timestamptz default now()
);
```

### 8.5 question_reactions

```sql
create table question_reactions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references balance_questions(id) on delete cascade,
  user_id uuid references users(id),
  reaction_type text check (reaction_type in ('empathy', 'save', 'share')),
  created_at timestamptz default now(),
  unique(question_id, user_id, reaction_type)
);
```

### 8.6 value_tags

```sql
create table value_tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  color text,
  icon text
);
```

### 8.7 question_value_tags

```sql
create table question_value_tags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references balance_questions(id) on delete cascade,
  option text check (option in ('A', 'B')),
  value_tag_id uuid references value_tags(id),
  weight numeric default 1.0
);
```

예시:
- 질문: `출근 2시간 줄이기 vs 연봉 10% 올리기`
- A = 자유, 건강, 효율
- B = 돈, 성장, 현실

### 8.8 user_value_scores

```sql
create table user_value_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  value_tag_id uuid references value_tags(id),
  score numeric default 0,
  updated_at timestamptz default now(),
  unique(user_id, value_tag_id)
);
```

### 8.9 similar_users_cache

```sql
create table similar_users_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  similar_user_id uuid references users(id) on delete cascade,
  similarity_score numeric,
  shared_vote_count int,
  updated_at timestamptz default now(),
  unique(user_id, similar_user_id)
);
```

---

## 9. API 명세 초안

### 9.1 GET /feed

추천 피드 질문 목록을 반환한다.

Query:
- cursor optional
- category optional

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "평생 라면 금지 vs 평생 치킨 금지",
      "optionA": "평생 라면 금지",
      "optionB": "평생 치킨 금지",
      "category": "일상",
      "voteA": 4200,
      "voteB": 5800,
      "commentCount": 345,
      "empathyCount": 1200,
      "saveCount": 2100,
      "userVote": null
    }
  ],
  "nextCursor": "..."
}
```

### 9.2 POST /questions

새 밸런스 질문을 생성한다.

Request:
```json
{
  "optionA": "퇴근 후 바로 자기",
  "optionB": "퇴근 후 2시간 자유시간 갖기",
  "description": "요즘 피로가 너무 쌓여서 고민돼요",
  "category": "회사",
  "isAnonymous": true,
  "allowComments": true,
  "voteDurationHours": 24
}
```

### 9.3 POST /questions/:id/vote

질문에 투표한다.

Request:
```json
{
  "selectedOption": "A"
}
```

Response:
```json
{
  "questionId": "uuid",
  "selectedOption": "A",
  "voteA": 6420,
  "voteB": 3580,
  "percentA": 64,
  "percentB": 36,
  "insight": "대부분은 깊은 관계의 안정감을 더 중요하게 생각했어요."
}
```

### 9.4 GET /me/graph

내 선택 그래프 데이터를 반환한다.

Response:
```json
{
  "nodes": [
    { "id": "freedom", "label": "자유", "score": 82, "color": "#7C5CFF" },
    { "id": "efficiency", "label": "효율", "score": 76, "color": "#4B8DFF" }
  ],
  "edges": [
    { "source": "my_choice", "target": "freedom", "weight": 0.8 },
    { "source": "freedom", "target": "efficiency", "weight": 0.6 }
  ],
  "insights": [
    "당신은 최근 '자유'와 '효율'을 자주 선택했어요.",
    "가장 자주 고민한 주제는 일상과 관계예요.",
    "이번 달 선택 성향은 신중 68%, 즉흥 32%예요."
  ],
  "similarUsers": [
    { "id": "u1", "similarity": 92, "keywords": ["자유", "효율", "도전"] }
  ]
}
```

---

## 10. 추천 알고리즘 초안

MVP에서는 복잡한 머신러닝을 쓰지 말고 점수 기반으로 시작한다.

### 10.1 피드 점수

```text
feed_score =
  log(vote_count + 1) * 0.35
+ log(comment_count + 1) * 0.20
+ log(save_count + 1) * 0.15
+ recency_score * 0.20
+ category_match_score * 0.10
```

### 10.2 추천 카테고리

초기 카테고리:
- 연애
- 회사
- 일상
- 돈
- 취향
- 공부
- 인간관계
- 라이프

### 10.3 비슷한 사람 계산

MVP에서는 같은 질문에 대한 선택 일치율로 계산한다.

```text
similarity = same_vote_count / shared_question_count
```

최소 shared_question_count가 20개 이상일 때만 노출한다.

---

## 11. AI 기능 기회

AI는 처음부터 전면에 내세우지 말고, 사용자를 돕는 보조 기능으로 둔다.

### 11.1 질문 다듬기

사용자가 애매하게 입력하면 AI가 A/B 질문으로 바꿔준다.

입력:
```text
요즘 피곤한데 퇴근하고 바로 잘지 운동할지 고민돼
```

출력:
```text
A. 퇴근 후 바로 자기
B. 퇴근 후 운동하고 자기
카테고리: 건강
태그: 회복, 자기관리, 피로
```

### 11.2 가치관 태그 자동 부여

질문과 선택지에 가치관 태그를 붙인다.

예:
```text
A. 퇴근 후 바로 자기 → 건강, 안정, 회복
B. 퇴근 후 2시간 자유시간 갖기 → 자유, 재미, 자기시간
```

### 11.3 한줄 인사이트 생성

투표 결과를 자연어로 요약한다.

예:
```text
대부분은 깊은 관계의 안정감을 더 중요하게 생각했어요.
```

### 11.4 내 선택 월간 리포트

월말에 자동 생성:

```text
이번 달 당신은 자유와 효율을 자주 선택했어요.
돈보다 시간, 넓은 관계보다 깊은 관계를 선호하는 경향이 강했어요.
```

---

## 12. 차별화 포인트

### 12.1 단순 커뮤니티가 아니다

일반 커뮤니티는 글이 쌓인다.  
이 앱은 **선택 데이터가 쌓인다.**

### 12.2 단순 투표 앱이 아니다

일반 투표 앱은 결과를 보고 끝난다.  
이 앱은 **내 선택이 그래프로 남는다.**

### 12.3 단순 성향 테스트가 아니다

성향 테스트는 한 번 하고 끝난다.  
이 앱은 **매일 선택하면서 성향이 계속 업데이트된다.**

### 12.4 단순 Threads가 아니다

Threads는 생각을 흘려보낸다.  
이 앱은 생각을 **A/B 선택 데이터로 구조화**한다.

### 12.5 단순 Obsidian이 아니다

Obsidian은 사용자가 직접 기록하고 연결해야 한다.  
이 앱은 사용자가 선택만 하면 **자동으로 연결**한다.

---

## 13. MVP 우선순위

### P0: 반드시 구현

- 회원/익명 로그인
- 피드 질문 리스트
- A/B 투표
- 결과 퍼센트 표시
- 질문 작성
- 카테고리 선택
- 상세 화면
- 댓글 기본 기능
- 내 선택 기록 저장
- 선택 그래프 기본 화면

### P1: 있으면 좋음

- 저장 기능
- 공유 카드
- 비슷한 사람
- AI 질문 다듬기
- AI 가치관 태그
- 알림
- 랭킹

### P2: 나중 확장

- O/X 퀴즈
- 펫 보상
- 레벨/경험치
- 주간 리포트
- 친구 비교
- 질문 팩
- 유료 기능

---

## 14. 초기 시드 질문 예시

### 일상
- 평생 라면 금지 vs 평생 치킨 금지
- 평생 여름만 살기 vs 평생 겨울만 살기
- 하루 5시간 자고 돈 많이 벌기 vs 8시간 자고 적게 벌기

### 회사
- 출근 2시간 줄이기 vs 연봉 10% 올리기
- 회식 많은 좋은 팀 vs 회식 없는 평범한 팀
- 칼퇴 보장 월 300 vs 야근 많음 월 500

### 연애
- 매일 연락하지만 무뚝뚝한 사람 vs 연락은 적지만 다정한 사람
- 카톡 바로 답장하는 사람 vs 몰아서 답장하는 사람
- 취향 같은 사람 vs 생활 패턴 같은 사람

### 돈
- 지금 1억 받기 vs 10년 뒤 3억 받기
- 비싼 집 작은 평수 vs 싼 집 넓은 평수
- 부업으로 월 100 벌기 vs 주말 완전 쉬기

### 관계
- 친구 5명 깊게 사귀기 vs 지인 100명 넓게 알기
- 불편한 말 바로 하기 vs 참았다가 거리두기
- 생일 챙기는 친구 vs 힘들 때 연락 오는 친구

---

## 15. UI 스타일 가이드

### 전체 톤
- 텍스트 중심
- 흰 배경
- 라이트 그레이 카드
- 보라색 포인트
- 복잡한 캐릭터 최소화
- 읽기 쉬운 타이포그래피

### 컬러 예시

```text
Primary Purple: #6C4DFF
Secondary Blue: #4B8DFF
Accent Orange: #FF9F1C
Accent Pink: #FF5D7D
Text Primary: #111111
Text Secondary: #777777
Background: #FAFAFC
Card: #FFFFFF
Border: #ECECF2
```

### 컴포넌트
- Rounded card radius: 20~28px
- Button radius: 16~24px
- Bottom tab height: 72~88px
- Main question font: 20~24px bold
- Percent font: 28~36px bold

---

## 16. 개발 스택 제안

### 모바일 앱
- React Native + Expo
- TypeScript
- Zustand or Jotai for local state
- React Query for server state
- Reanimated optional

### 백엔드
- Supabase
- PostgreSQL
- Row Level Security
- Edge Functions for AI tasks

### AI
- OpenAI GPT-4o-mini or equivalent low-cost model
- 사용처: 질문 다듬기, 태그 추출, 인사이트 생성

### 그래프 시각화
- React Native SVG
- D3-force logic optional
- MVP에서는 force-directed graph보다 수동 원형 레이아웃 권장

---

## 17. 코딩 LLM에게 줄 구현 지시 프롬프트

아래 프롬프트를 Cursor, Codex, Claude Code 등에 넣으면 된다.

```text
너는 시니어 모바일 앱 개발자이자 제품 설계자다.
첨부된 문서 "세상의 모든 밸런스 — 코딩 LLM 참조용 제품 기획서"를 기준으로 React Native + Expo + TypeScript 앱 MVP를 구현해라.

우선순위는 다음과 같다.
1. 피드 화면
2. 밸런스 작성 화면
3. 밸런스 상세 화면
4. 내 선택 그래프 화면
5. 임시 목데이터 기반 네비게이션

요구사항:
- 하단 탭: 피드, 작성, 그래프, 마이
- UI는 흰 배경, 둥근 카드, 보라색 포인트의 미니멀 스타일
- 모든 화면 텍스트는 한국어
- 목데이터로 먼저 동작하게 만들 것
- 투표 시 A/B 퍼센트가 즉시 업데이트되는 느낌을 줄 것
- 내 선택 그래프는 일단 정적 노드 그래프로 구현해도 된다
- 컴포넌트를 재사용 가능하게 분리할 것
- 나중에 Supabase 연동이 쉬운 구조로 만들 것

생성할 기본 구조:
/src
  /app
  /components
  /screens
  /data
  /types
  /utils

먼저 구현 계획을 간단히 출력한 뒤 코드를 작성해라.
```

---

## 18. MVP 성공 기준

초기 성공 기준은 매출이 아니라 반복 사용성이다.

핵심 지표:
- 첫 방문 투표 완료율
- 사용자가 첫 세션에서 푼 질문 수
- 질문 작성률
- D1 리텐션
- D7 리텐션
- 공유 카드 저장/공유율
- 그래프 탭 진입률
- 내 선택 기록 20개 이상 쌓은 유저 비율

초기 목표:
- 첫 세션 5문항 이상 선택률 60% 이상
- 질문 작성률 5% 이상
- 그래프 탭 진입률 30% 이상
- D1 리텐션 25% 이상

---

## 19. 최종 제품 컨셉 문장

앱 소개 문구 후보:

1. **세상의 모든 밸런스 — 오늘도 세상은 선택으로 움직인다.**
2. **사람들은 뭘 고를까? 나는 왜 이걸 골랐을까?**
3. **한 번의 선택이 쌓여 나만의 가치관 지도가 됩니다.**
4. **가볍게 고르고, 깊게 나를 알아가는 선택 피드.**
5. **Threads처럼 빠르게, Obsidian처럼 쌓이는 밸런스 앱.**

가장 추천하는 메인 카피:

> **가볍게 고르고, 깊게 나를 알아가는 선택 피드.**

---

## 20. 결론

이 앱의 핵심은 펫도, 성향 테스트도, 퀴즈도 아니다.

핵심은 **선택**이다.

사람들은 매일 작고 애매한 선택 앞에서 흔들린다.  
이 앱은 그 순간을 가볍게 올리고, 모두의 선택을 보고, 내 선택이 쌓여 나를 설명해주는 구조다.

최종 제품 정의:

> **세상의 모든 밸런스는 사람들의 선택을 피드로 만들고, 내 선택을 그래프로 바꾸는 앱이다.**
