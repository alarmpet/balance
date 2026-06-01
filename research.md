# Balance Island MVP Deep Research Report

작성일: 2026-06-01  
분석 범위: `balance-island` 전체 정적 분석  
리뷰 보조: `GPT-5.3-Codex-Spark` 읽기 전용 리뷰어 에이전트 `019e829e-4cac-7060-96a9-1a638f2b1a04`

## 1. 프로젝트 개요

이 폴더는 React Native Expo + Expo Router + Zustand + Supabase 기반의 모바일 MVP이다. 앱의 핵심 경험은 사용자가 밸런스 게임 질문 카드를 인스타그램/틱톡 피드처럼 넘겨 보면서 A/B 선택지에 투표하고, 리액션을 남기고, 누적된 투표 성향으로 개인 섬과 캐릭터가 진화하는 구조다.

현재 파일 구조는 매우 작고 집중되어 있다.

```text
balance-island/
  package.json
  supabase/
    schema.sql
    functions/
      embed-question/index.ts
      refine-question/index.ts
  src/
    app/(tabs)/
      create.tsx
      index.tsx
      island.tsx
      profile.tsx
    components/feed/
      BalanceCard.tsx
    services/
      aiService.ts
      gamificationService.ts
      questionService.ts
    store/
      feedStore.ts
    types/
      database.types.ts
```

`package.json` 기준 주요 런타임 의존성은 `expo`, `expo-router`, `expo-image`, `react-native`, `zustand`, `@supabase/supabase-js`, `@expo/vector-icons`이다. 하지만 현재 `node_modules`는 없고, lockfile도 확인되지 않았다. 따라서 빌드/타입체크/런타임 검증은 수행되지 않은 상태다.

## 2. 작동 구조 이해

### 2.1 Supabase 데이터 모델

`supabase/schema.sql`은 밸런스 아일랜드의 백엔드 도메인을 한 파일에 구성한다. 핵심 테이블은 다음 역할을 가진다.

- `profiles`: Supabase Auth 사용자와 연결되는 앱 프로필. 닉네임, 아바타, 조개 재화, 연속 참여일, 누적 참여 수 등을 담는다.
- `categories`: 푸드, 라이프, 연애, 커리어, 문화 등 질문 카테고리 마스터.
- `questions`: 밸런스 질문 본문, A/B 선택지 텍스트와 이미지, 투표 수, 리액션 카운트, 임베딩 벡터, 공개 상태 등을 담는 중심 테이블.
- `question_traits`: 각 질문의 A/B 선택지가 어떤 성향 점수에 연결되는지 정의한다. 투표 후 `user_traits`에 누적될 성향 가중치의 원천이다.
- `votes`: 사용자의 질문별 A/B 투표 기록.
- `question_reactions`: 좋아요/재밌다/어렵다 반응 기록.
- `comments`: 질문별 댓글.
- `user_traits`: 사용자별 누적 성향 점수.
- `islands`, `characters`: 사용자의 섬/캐릭터 성장 상태.
- `achievements`, `user_achievements`, `rewards`, `notifications` 등: 게임화와 보상/알림 확장용.

또한 `match_questions_by_embedding` RPC로 질문 임베딩 벡터의 코사인 유사도를 계산해 중복 질문을 탐지하려는 설계가 들어 있다.

의도 자체는 명확하다. 질문 생성 시 AI가 문장을 다듬고 성향 매핑을 만들며, 임베딩 중복 검사를 통과하면 질문과 성향 매핑이 저장된다. 피드에서는 미투표 질문을 우선 노출하고, 투표/리액션/댓글을 통해 참여 데이터를 쌓는다. 마이페이지와 섬 화면은 `profiles`, `user_traits`, `islands`, `characters`를 읽어 게임화 UI로 보여준다.

### 2.2 피드 서비스와 Zustand 스토어

`src/services/questionService.ts`는 Supabase 클라이언트를 직접 사용한다.

- `fetchFeedQuestions`: 현재 사용자 식별 후, 이미 투표한 질문 ID를 가져오고, 질문 목록을 인기순/최신순/트렌딩 등으로 정렬한다.
- `submitVote`: `votes`에 투표를 삽입하고, 질문의 A/B 투표 카운트를 갱신하며, 연결된 `question_traits`를 기반으로 `user_traits`를 누적하려는 흐름이다.
- `submitReaction`: `question_reactions`에 반응을 기록한 뒤 질문의 리액션 카운트를 갱신한다.

`src/store/feedStore.ts`는 Zustand 스토어이며, 프론트엔드 피드 상태를 관리한다.

- 상태: `questions`, `userVotes`, `userReactions`, `isLoading`, `error`, `currentSort`
- 액션: `loadFeedQuestions`, `voteOnQuestion`, `reactToQuestion`, `clearError`, `reset`
- 투표/리액션은 낙관적 업데이트를 먼저 수행하고, 서비스 호출 실패 시 이전 상태로 롤백한다.

방향은 MVP에 적합하다. 다만 트랜잭션과 동시성은 아직 클라이언트 단에서 흉내 내는 수준이라, 실제 운영에서는 RPC/Edge Function 또는 DB trigger로 내려야 한다.

### 2.3 메인 피드 화면

`src/app/(tabs)/index.tsx`는 메인 피드 화면이다.

- `FlatList`로 밸런스 카드 목록을 렌더링한다.
- `onViewableItemsChanged`에서 현재 보이는 인덱스를 추적한다.
- 현재 카드 기준 다음 3개 카드의 A/B 이미지 URL, 총 6개를 `expo-image`의 프리패치 큐에 넣는 구조다.
- `BalanceCard` 컴포넌트와 Zustand 액션을 연결해 투표/리액션을 처리한다.

이 설계는 사용자가 빠르게 카드를 넘겨도 다음 카드 이미지가 미리 캐시되도록 만드는 좋은 방향이다. 다만 현재 코드 상태에서는 JSX/문자열 인코딩 손상 때문에 실제 컴파일 가능성이 매우 낮다.

### 2.4 질문 작성 및 AI 파이프라인

`src/app/(tabs)/create.tsx`와 `src/services/aiService.ts`가 질문 작성 파이프라인을 담당한다.

의도된 플로우:

1. 사용자가 제목, 선택지 A/B, 카테고리를 대략 입력한다.
2. `AI로 다듬기` 버튼을 누른다.
3. `refine-question` Edge Function이 OpenAI API를 호출해 tropical/game tone의 정제된 JSON을 반환한다.
4. 정제된 텍스트를 합쳐 `embed-question` Edge Function으로 임베딩을 생성한다.
5. `match_questions_by_embedding` RPC로 기존 질문과 유사도를 계산한다.
6. 최고 유사도 0.88 이상이면 등록 차단.
7. 최고 유사도 0.78 이상이면 경고 팝업.
8. 통과 시 `questions`와 `question_traits`를 저장한다.

요구사항의 UX 규칙은 코드 설계에 반영되어 있다. 하지만 실제 DB 타입, RLS, Edge Function 인증, vector 직렬화가 아직 위험하다.

### 2.5 게임화와 마이페이지

`src/services/gamificationService.ts`, `src/app/(tabs)/island.tsx`, `src/app/(tabs)/profile.tsx`가 게임화 UI를 구성한다.

`island.tsx`의 의도:

- `profiles.total_participation_count` 기준으로 50, 100, 300회 참여 구간을 계산한다.
- 참여 구간에 따라 섬 레벨과 캐릭터 타입을 클라이언트에서 산출한다.
- `user_traits`의 누적 점수 상위 2개 trait을 뽑아 성향 칭호를 동적으로 만든다.

`profile.tsx`의 의도:

- 연속 참여일 `streak_count`
- 보유 조개 `shell_balance`
- 오늘 참여율 진행도, 예: 7/10
- 게스트 상태와 Supabase Auth 로그아웃

화면 목표는 분명하지만, 현재 성장 상태가 서버에 지속적으로 쓰이는 구조가 아니라 클라이언트 계산에 머문다. 장기적으로는 `islands`, `characters`, `profiles`의 상태 업데이트 정책이 필요하다.

## 3. Critical Findings

### C1. 다수 파일의 한글 문자열 인코딩 손상 및 문법 파손

가장 먼저 해결해야 할 문제다. 여러 TSX/SQL 파일에서 한글이 mojibake로 깨졌고, 단순 표시 문제를 넘어 따옴표, 백틱, JSX 닫는 태그가 파손된 흔적이 있다. 이 상태라면 앱은 컴파일되지 않을 가능성이 높고, `schema.sql`도 적용 실패 가능성이 크다.

확인된 예:

- `src/app/(tabs)/create.tsx`: 카테고리 배열에서 `label: '?쇱씠??, description: ...`처럼 문자열 닫힘이 깨진 흔적.
- `src/app/(tabs)/create.tsx`: placeholder 문자열이 닫히지 않은 형태가 확인됨.
- `src/app/(tabs)/index.tsx`: `<Text ...>.../Text>`처럼 JSX 닫는 태그가 손상된 흔적.
- `src/app/(tabs)/island.tsx`: `name: '?덉떦 紐⑤옒??,`처럼 문자열이 닫히지 않은 형태.
- `src/app/(tabs)/profile.tsx`: ``value: `${profile?.streak_count ?? 0}??,``처럼 템플릿 문자열이 닫히지 않은 형태.
- `src/components/feed/BalanceCard.tsx`: ``return `${(count / 10000).toFixed(1)}留?;``처럼 백틱/문자열 종료가 깨진 흔적.
- `supabase/schema.sql`: seed 데이터의 한글 문자열과 따옴표가 깨진 흔적.

권장 조치:

1. 기능 추가를 멈추고 인코딩 복구를 먼저 수행한다.
2. 영향 파일을 UTF-8로 재작성한다.
3. PowerShell 출력 인코딩과 파일 저장 인코딩을 분리해서 확인한다.
4. 복구 후 `tsc` 또는 Expo 빌드가 최소한 파서 단계까지 통과하는지 확인한다.

### C2. `schema.sql`의 무조건 `DROP TABLE ... CASCADE`는 운영 데이터 전멸 위험

`supabase/schema.sql` 초반부에 핵심 테이블을 `DROP TABLE ... CASCADE`로 삭제하는 구조가 있다. 개발 초기화용으로는 편하지만, 마이그레이션이나 운영 재적용에 사용되면 사용자 프로필, 투표, 성향, 섬, 보상 데이터가 모두 사라진다.

리뷰어 에이전트도 이 문제를 최상위 Critical로 지적했다.

권장 조치:

- 개발 초기화용 SQL과 운영 마이그레이션 SQL을 분리한다.
- `supabase/migrations` 기반의 증분 마이그레이션으로 전환한다.
- destructive reset 파일에는 파일명과 주석에 명확히 `dev reset only`를 표시한다.

### C3. RLS와 정책 부재

`schema.sql`에서 `ENABLE ROW LEVEL SECURITY`와 `CREATE POLICY`가 확인되지 않았다. Supabase 클라이언트를 모바일 앱에서 직접 쓰는 구조라면 RLS는 핵심 보안 경계다.

가능한 실패 모드:

- RLS가 꺼져 있으면 anon/client key로 과도한 데이터 접근 또는 쓰기가 가능하다.
- RLS를 나중에 켜면 정책 부재로 정상적인 앱 읽기/쓰기가 모두 막힐 수 있다.
- `votes`, `question_reactions`, `comments`, `profiles`, `user_traits`는 사용자 본인 권한 경계가 매우 중요하다.

권장 조치:

- 공개 읽기 가능한 테이블과 본인만 쓰기/수정 가능한 테이블을 구분한다.
- `profiles`: 본인 read/update, 공개 필드만 제한 공개.
- `votes`: authenticated 사용자 본인 insert/read, 중복 투표 제한.
- `question_reactions`: 본인 insert/delete/read.
- `comments`: 작성자 update/delete, 공개 질문 댓글 read.
- `user_traits`, `islands`, `characters`: 본인 read/write 또는 서버 RPC만 write.

### C4. Expo Router 레이아웃 파일 부재

현재 확인된 라우트 파일은 `src/app/(tabs)/index.tsx`, `create.tsx`, `island.tsx`, `profile.tsx`뿐이다. 하지만 Expo Router 앱이 정상 동작하려면 일반적으로 `src/app/_layout.tsx`와 탭 그룹용 `src/app/(tabs)/_layout.tsx`가 필요하다.

현재 구조에서는 라우트 파일이 있어도 앱의 네비게이션 셸이 구성되지 않을 가능성이 높다.

권장 조치:

- `src/app/_layout.tsx` 추가.
- `src/app/(tabs)/_layout.tsx` 추가.
- 탭 아이콘과 헤더 정책을 한곳에서 정의.

### C5. `profiles` 생성 경로 부재로 투표/게임화 실패 가능

`votes.user_id`가 `profiles.id`를 참조하는 구조라면, Supabase Auth 사용자가 생긴 직후 `profiles` row가 반드시 있어야 한다. 현재 스키마와 서비스 구조만 보면 신규 auth user 생성 시 `profiles`를 자동 생성하는 trigger/function이 확인되지 않는다.

가능한 결과:

- 사용자는 로그인되어 있지만 `profiles`가 없어 `votes` insert가 FK 오류로 실패.
- `gamificationService`가 프로필을 못 찾아 게스트 폴백으로 빠짐.
- 실제 사용자 성향 누적이 정상 저장되지 않음.

권장 조치:

- `auth.users` insert trigger로 `public.profiles`를 생성한다.
- 또는 앱 최초 진입 시 `upsertProfileForCurrentUser` RPC를 호출한다.
- RLS 정책과 함께 설계해야 한다.

## 4. Important Findings

### I1. `fetchFeedQuestions`의 투표 제외 필터가 UUID에서 깨질 수 있음

리뷰어 에이전트가 지적한 핵심 버그다.

`questionService.ts`의 형태는 대략 다음 의도다.

```ts
query.not('id', 'in', `(${votedQuestionIds.join(',')})`)
```

UUID를 따옴표 없이 직접 이어 붙이면 PostgREST/PG 파서에서 하이픈 포함 문자열이 정상 UUID 리터럴로 해석되지 않을 수 있다. 그 결과 피드 쿼리가 실패하거나, 이미 투표한 질문 제외가 동작하지 않을 수 있다.

권장 조치:

- PostgREST가 기대하는 UUID 문자열 포맷으로 안전하게 직렬화한다.
- 가능하면 DB RPC로 “현재 사용자에게 노출할 피드 질문”을 캡슐화한다.
- 클라이언트에서 직접 `in (...)` 문자열을 조립하는 방식을 피한다.

### I2. 벡터 임베딩 타입/직렬화 경로 불일치

`schema.sql`은 `questions.embedding VECTOR(1536)`을 의도한다. 하지만 TypeScript 타입은 `string | null`이고, `aiService.ts`는 임베딩 배열을 vector literal 문자열로 만들어 RPC와 insert에 전달한다.

이 방식은 Supabase/PostgREST/pgvector 조합에서 동작할 수도 있지만, 매우 취약하다.

위험:

- vector literal 문자열 형식이 조금만 어긋나도 insert/RPC 실패.
- `match_questions_by_embedding` RPC 인자 타입과 클라이언트 타입이 실제 DB 타입과 어긋날 수 있음.
- OpenAI 임베딩 차원이 모델 변경으로 달라지면 `VECTOR(1536)`과 충돌.

권장 조치:

- RPC 인자를 `vector(1536)`로 받고, 클라이언트 직렬화 규칙을 테스트로 고정한다.
- OpenAI 임베딩 모델을 상수로 고정하고, 차원 검증을 Edge Function에서 수행한다.
- 질문 저장도 가능하면 Edge Function/RPC 내부에서 처리한다.

### I3. `submitReaction`은 원자적이지 않아 카운트 유실 가능

현재 리액션 흐름은 대략:

1. `question_reactions` insert
2. 현재 질문 카운트 fetch
3. 증가된 카운트 update

이 패턴은 동시 요청에서 lost update가 발생할 수 있다. 예를 들어 두 사용자가 동시에 좋아요를 누르면 둘 다 같은 기존 카운트를 읽고 같은 증가 값을 저장할 수 있다.

권장 조치:

- `submit_reaction` RPC로 insert와 count update를 한 트랜잭션에서 처리한다.
- 더 좋은 방식은 `question_reactions` insert/delete trigger로 집계 카운트를 관리하는 것이다.

### I4. `submitVote`와 `user_traits` 누적도 서버 트랜잭션으로 내려야 함

투표는 도메인에서 가장 중요한 이벤트다. `votes`, `questions.vote_count_*`, `user_traits`, `profiles.total_participation_count`, 일일 참여/스트릭/보상까지 연결될 가능성이 크다.

클라이언트에서 여러 테이블을 순차적으로 갱신하면 중간 실패, 중복 요청, 네트워크 재시도, 앱 종료에 취약하다.

권장 조치:

- `submit_vote(question_id, selected_option)` RPC를 만든다.
- RPC 내부에서 중복 투표 검사, 투표 insert, 질문 카운트 증가, trait 누적, 프로필 참여 수/스트릭/재화 보상을 처리한다.
- 클라이언트는 RPC 결과만 받아 낙관적 상태를 확정한다.

### I5. 질문 생성 저장이 트랜잭션이 아님

`submitRefinedQuestion`은 질문을 먼저 insert한 뒤 `question_traits`를 insert하고, 실패 시 질문을 삭제하는 보상 로직에 가까운 구조다. RLS, 네트워크 실패, delete 실패가 겹치면 질문만 남거나 trait이 누락된 불완전 데이터가 생길 수 있다.

권장 조치:

- `create_question_with_traits` RPC로 질문과 traits insert를 한 트랜잭션에 묶는다.
- pending/approved 워크플로우와 moderation 필드를 명확히 둔다.

### I6. Edge Functions가 인증/요청 제한 없이 비용을 발생시킬 수 있음

`refine-question`과 `embed-question`은 OpenAI API를 호출한다. 현재 CORS가 `*`이고, 요청자의 Supabase JWT 검증이나 rate limit이 없다.

위험:

- 외부에서 직접 호출해 OpenAI 비용을 소진할 수 있음.
- 익명 사용자가 대량 호출 가능.
- prompt/input 크기 제한이 약하면 비용이 급격히 증가.

권장 조치:

- Authorization header의 Supabase JWT를 검증한다.
- authenticated 사용자만 호출 허용한다.
- IP/user별 rate limit 또는 quota를 둔다.
- 입력 길이와 호출 빈도를 제한한다.

### I7. 메인 피드 페이징/커서 미구현

현재 피드는 `FEED_LIMIT=30` 중심의 단발성 로딩 구조다. `FlatList`는 무한 스크롤 컨테이너처럼 보이지만, 실제 `onEndReached` 기반 추가 로딩/커서가 확인되지 않는다.

위험:

- 질문이 많아질수록 초기 30개 이후 접근성이 떨어진다.
- 사용자가 많이 투표하면 미투표 질문 필터 때문에 feed가 빠르게 비어 보일 수 있다.

권장 조치:

- `fetchFeedQuestions`에 cursor/offset/seen IDs를 추가한다.
- 이미 투표한 질문만 남은 경우 결과 카드 또는 재투표 불가 archive feed로 fallback한다.

### I8. 프리패치 API 사용은 버전 검증 필요

`src/app/(tabs)/index.tsx`는 `Image.prefetch(nextUrls, 'memory-disk')` 형태의 호출을 사용한다. Expo SDK/`expo-image` 버전에 따라 배열 인자와 cache policy 인자 지원 방식이 다를 수 있다.

권장 조치:

- 현재 설치된 `expo-image` 버전의 타입 정의로 확인한다.
- 불확실하면 URL별 `Image.prefetch(url, { cachePolicy: 'memory-disk' })` 또는 지원되는 정확한 시그니처로 변경한다.

### I9. 게임화 상태가 클라이언트 계산에 머문다

`island.tsx`는 참여 횟수와 상위 trait으로 섬 레벨/캐릭터 타입/칭호를 계산한다. MVP 화면용으로는 괜찮지만, DB의 `islands`, `characters` 테이블과 완전히 동기화되는 구조가 아니다.

위험:

- 화면마다 계산 결과가 바뀌거나, 서버 저장 상태와 다를 수 있다.
- 보상 지급, 업적 달성, 레벨업 연출을 정확히 한 번만 수행하기 어렵다.

권장 조치:

- 투표 RPC에서 참여 수 변화 후 레벨업 조건을 서버에서 판단한다.
- `islands`, `characters`, `user_achievements`, `rewards` 업데이트를 서버 트랜잭션으로 처리한다.

## 5. Minor Findings

- `node_modules`와 lockfile이 없어 재현 가능한 설치/검증이 어렵다.
- `tsconfig.json`, `app.json` 또는 `app.config.*`가 현재 파일 목록에서 확인되지 않았다.
- 테스트 파일이 없다.
- Expo Router 프로젝트인데 루트 레이아웃 파일이 없다.
- `process.env.EXPO_PUBLIC_*` 사용을 위한 타입/환경 설정이 정리되어 있지 않다.
- UI 문자열과 seed 데이터가 모두 앱 도메인에 중요하지만, 현 상태에서는 한글 인코딩 손상 때문에 UX 품질 검토가 불가능하다.
- `BalanceCard`의 낙관적 업데이트 롤백은 전체 질문 배열을 이전 상태로 되돌리는 방식이라, 동시에 다른 카드에서 발생한 상태 변화까지 되감을 수 있다.
- guest fallback이 `id: 'guest'` 고정값을 사용한다. 실제 저장 로직과 결합되면 혼선이 생길 수 있으므로 `isGuest` 플래그 기반의 별도 경로가 낫다.

## 6. 리뷰어 에이전트 추가 지적 요약

읽기 전용 리뷰어 `GPT-5.3-Codex-Spark`는 다음을 별도 위험으로 확인했다.

### Critical

- `supabase/schema.sql`의 `DROP TABLE ... CASCADE`는 재적용 시 운영 데이터 전멸 위험.
- `questionService.ts`의 UUID `not in (...)` 문자열 조립은 PostgREST 쿼리 실패 가능.
- RLS/Policy 부재는 Supabase 클라이언트 노출 구조에서 보안 리스크.

### Important

- pgvector 컬럼과 TypeScript/RPC 문자열 직렬화 경로가 불일치할 수 있음.
- 메인 피드가 `FEED_LIMIT=30` 단발 로딩이라 성장 후 페이징 문제가 생김.
- Edge Function이 인증 없이 호출 가능해 OpenAI 비용 남용 가능.
- guest profile fallback이 향후 사용자 맥락과 충돌 가능.

### Minor

- `expo-image` 프리패치 호출 방식은 SDK 버전별 동작 검증 필요.
- 초기 로딩/빈 목록에서 새로고침 표시 조건이 어색할 수 있음.
- 낙관적 업데이트 실패 시 전체 이전 목록 롤백은 상태 점프를 만들 수 있음.

## 7. 권장 복구 순서

1. **인코딩/문법 복구**
   - `schema.sql`, 모든 `tsx`, 주요 service 파일을 UTF-8로 재작성한다.
   - 한글 문자열을 복구하고 따옴표/백틱/JSX 태그가 정상인지 확인한다.

2. **기본 앱 셸 복구**
   - `src/app/_layout.tsx`와 `src/app/(tabs)/_layout.tsx`를 추가한다.
   - `app.json` 또는 `app.config.*`, `tsconfig.json` 존재 여부를 확인하고 없으면 추가한다.

3. **의존성 설치와 타입체크**
   - lockfile을 생성한다.
   - `npm install` 또는 프로젝트 표준 패키지 매니저 설치를 완료한다.
   - `npx tsc --noEmit` 또는 Expo 권장 타입체크를 실행한다.

4. **Supabase 스키마를 마이그레이션 체계로 분리**
   - reset SQL과 production migration을 분리한다.
   - RLS와 policy를 추가한다.
   - `auth.users` to `profiles` 생성 trigger를 추가한다.

5. **핵심 쓰기 로직을 RPC/Edge Function으로 이동**
   - `submit_vote`
   - `submit_reaction`
   - `create_question_with_traits`
   - 게임화 보상/성향 누적/카운트 갱신은 서버 트랜잭션에서 처리한다.

6. **AI 파이프라인 보안**
   - Edge Function JWT 검증.
   - rate limit.
   - 입력 길이 제한.
   - 임베딩 차원 검증.

7. **피드 확장성**
   - cursor 기반 pagination.
   - 유사도/인기도/최신순 정렬을 DB query 또는 RPC에 캡슐화.
   - 이미 투표한 질문이 많은 사용자를 위한 fallback feed.

8. **검증 자동화**
   - 최소 타입체크.
   - service 단위 테스트.
   - Supabase RPC smoke test.
   - Expo 화면 렌더 smoke test.

## 8. 현재 검증 상태

수행한 검증:

- 파일 목록 정적 확인.
- `package.json`, `supabase/schema.sql`, `src/types/database.types.ts`, `src/services/*`, `src/store/feedStore.ts`, `src/components/feed/BalanceCard.tsx`, `src/app/(tabs)/*` 정적 읽기.
- 읽기 전용 리뷰어 에이전트의 별도 정적 분석 결과 수신.
- `node_modules` 부재 확인.
- `research.md` 생성 전 기존 파일 부재 확인.

수행하지 못한 검증:

- TypeScript 컴파일.
- Expo 실행.
- Supabase 로컬 적용.
- Edge Function 실행.
- 실제 모바일/웹 렌더 확인.

사유:

- 현재 프로젝트에 `node_modules`가 없다.
- 이전 의존성 설치 시도는 PowerShell 실행 정책/시간 제한/승인 제한으로 완료되지 않았다.
- 따라서 이 보고서는 빌드 결과가 아니라 정적 구조 분석과 코드 리스크 리뷰에 기반한다.

## 9. 결론

앱의 제품 방향과 도메인 모델은 꽤 선명하다. 피드, 질문 작성 AI, 중복 검사, 성향 누적, 섬/캐릭터 성장까지 MVP의 주요 축이 모두 파일 구조에 반영되어 있다.

하지만 현재 작업물은 “기능 완성”보다 “복구가 먼저 필요한 상태”에 가깝다. 특히 한글 인코딩 손상이 문법 파손까지 만든 것으로 보이며, 이 문제를 해결하지 않으면 어떤 기능도 신뢰성 있게 검증할 수 없다. 그 다음으로는 Supabase RLS/트랜잭션/RPC 경계가 핵심이다. 모바일 클라이언트에서 직접 여러 테이블을 순차 갱신하는 현재 방식은 MVP 데모에는 가까워도, 실제 사용자 데이터와 보상 시스템을 다루기에는 위험하다.

즉시 다음 단계는 명확하다. UTF-8 코드 복구, Expo Router 앱 셸 추가, 타입체크 가능한 상태 만들기, Supabase 보안/트랜잭션 경계 정리 순서로 진행해야 한다.

## 2026-06-01 Run-Ready Remediation Status

- 해결됨: Expo Router root/tab layout, `app.json`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, `.gitignore`, npm lockfile을 추가했다.
- 해결됨: 주요 TSX 화면과 서비스 파일을 parser-safe UTF-8 코드로 교체해 TypeScript 컴파일이 통과하도록 했다.
- 해결됨: `@supabase/supabase-js`의 Expo Web 번들링 문제를 위해 `@opentelemetry/api`를 명시 의존성으로 추가했다.
- 해결됨: Expo doctor 지적에 따라 `expo-font`, `expo-constants`, `expo-linking`, `expo-status-bar`, Expo SDK 51 호환 `expo-image`, `react-native`, `react-native-safe-area-context` 버전을 맞췄다.
- 해결됨: `supabase/schema.sql`을 dev reset only로 표시하고, live project용 비파괴 migration `supabase/migrations/202606011940_run_ready_security.sql`을 추가했다.
- 해결됨: 클라이언트 투표/리액션 직접 다중 업데이트를 제거하고 `fetch_feed_questions`, `submit_vote`, `submit_reaction` RPC 호출 구조로 전환했다.
- 검증됨: `npm.cmd run typecheck` 성공.
- 검증됨: `npm.cmd run doctor` 17/17 성공.
- 검증됨: `http://localhost:8081` HTML 200, Expo Router entry bundle 200.
- 제한: Browser 플러그인은 런타임 오류로 사용하지 못했다. Chrome을 직접 열어 로컬 앱과 Supabase dashboard를 표시했다.
- 남음: 사용자가 Supabase 로그인/2FA를 완료한 뒤 Project URL과 anon key를 로컬 `.env`에 입력하고, core schema와 run-ready migration을 실제 Supabase 프로젝트에 적용해야 한다.

## 2026-06-01 Supabase Project Connection Status

- Supabase 프로젝트 `balance`의 project ref는 `ztcexgnelqtdzinfgoja`이며, 클라이언트 URL은 `https://ztcexgnelqtdzinfgoja.supabase.co`이다.
- Supabase의 최신 API Keys 화면에서는 기존 `anon public` 대신 `Publishable key`가 클라이언트용 공개 키로 표시된다. Expo 앱의 `EXPO_PUBLIC_SUPABASE_ANON_KEY`에는 이 publishable key를 사용한다.
- `.env`는 Git ignore 대상이며, 로컬 실행 환경에는 URL과 publishable key가 저장되었다. Secret key/service role key는 클라이언트나 저장소에 넣으면 안 된다.
- 실제 DB 적용 전 `supabase/schema.sql`과 `supabase/migrations/202606011940_run_ready_security.sql`을 비교하면서 `profiles.today_participation_count` 누락을 발견했다. 앱의 profile 화면과 gamification service는 이 컬럼을 이미 사용하고 있고, 보안 마이그레이션의 `handle_new_user` 및 `submit_vote`도 이 컬럼을 갱신하므로 기본 스키마에 추가해야 한다.

### Bootstrap SQL Repair Notes

- 최초 SQL Editor 실행은 `syntax error at or near "life"`로 실패했다. 실패 지점은 category seed였지만, root cause는 seed 영역 전체의 문자 인코딩 손상과 quote 손상이다.
- 깨진 한국어 seed를 줄 단위로 보수하면 이후 question/island/character seed에서도 같은 유형의 syntax error가 반복될 가능성이 높았다.
- 따라서 seed 구간을 ASCII 기반의 `supabase/seed_clean.sql`로 교체했다. 이 seed는 categories 5개, islands 5개, characters 5개, questions 30개, question_traits 60개를 생성한다.
- RPC 마이그레이션도 기본 schema와 일치하도록 수정했다. `questions.option_a_votes`/`option_b_votes`를 RPC 반환 alias `vote_count_a`/`vote_count_b`로 내보내고, `like_count`/`fun_count`/`hard_count`를 reaction alias로 내보낸다. category color 자리에는 현재 schema의 `emoji`를 사용한다.

### RLS and Vote Side-Effect Repair Notes

- 두 번째 SQL Editor 실행은 `column "user_id" does not exist`로 실패했다.
- 원인은 `islands`와 `characters` RLS 정책이 존재하지 않는 `user_id` 컬럼을 참조한 것이다. 두 테이블은 사용자별 소유 데이터가 아니라 섬/캐릭터 마스터 데이터이므로 공개 읽기 정책(`USING (true)`)이 맞다.
- 기본 schema에는 `votes` INSERT trigger인 `on_vote_submitted`가 있고, runtime migration의 `submit_vote` RPC도 같은 카운트와 trait score를 갱신하고 있었다. 이 상태로 성공하면 한 번의 투표가 두 번 집계될 위험이 있다.
- 새 실행 SQL에서는 vote side-effect trigger를 제거하고, 클라이언트가 사용하는 `submit_vote` RPC를 단일 갱신 경로로 유지했다.

### Live Verification

- Supabase SQL Editor에서 새 프로젝트 bootstrap SQL이 성공했다.
- `fetch_feed_questions` RPC를 publishable key로 호출했을 때 seed 질문이 정상 반환되었다. 확인된 예시는 `New hobby entry`, `Stress recovery choice`, `Friday night battery`이다.
- 이 검증은 앱이 사용하는 공개 환경변수와 같은 URL/key 조합으로 수행되었으므로, 피드 화면의 기본 데이터 로딩 경로가 DB까지 연결된 상태임을 의미한다.

## 2026-06-01 Personality Avatar and Island Gamification Direction

- 새 제품 방향은 "밸런스 질문 선택이 성향 점수로 쌓이고, 그 결과로 나와 닮은 캐릭터/아바타와 섬이 성장하는 게임형 성향 앱"이다.
- 권장 중심축은 `캐릭터/아바타가 감정적 주인공`, `섬은 성장과 꾸미기 무대`다. 섬만 성장시키면 감정 이입이 약하고, 캐릭터만 두면 밸런스 아일랜드라는 세계관이 얇아진다.
- MBTI라는 이름과 구조를 직접 복제하지 않고, 자체 4축 `BIPI` 모델을 사용한다. 축은 `solo/social`, `safe/adventure`, `plan/flow`, `calm/express`로 설계한다.
- 결과 표현은 심리진단이 아니라 "게임형 성향 아바타", "요즘 내 선택 성향"으로 제한한다. 민감한 정신건강/성격 단정 표현은 피해야 한다.
- 보상과 조개 차감/지급은 클라이언트가 아니라 Supabase RPC에서 처리해야 한다. 출석, 투표, 리액션, 질문 작성, 아이템 구매는 모두 idempotency와 RLS를 고려해야 한다.
- 현재 seed 이미지는 AI 생성 이미지가 아니라 Unsplash 원격 placeholder다. 장기적으로 캐릭터/섬/아이템은 앱 전용 에셋 또는 Supabase Storage 기반 자체 이미지로 교체해야 한다.
- 상세 계획서는 `docs/superpowers/plans/2026-06-01-personality-avatar-island-gamification.md`에 작성했다.

### Gamification Review Report Validation

- 외부 리뷰 문서의 핵심 지적 중 `user_personality_snapshots`의 성능/이력 용도, `profiles` 현재 BIPI 캐시, 조개 ledger, RPC-only 경제 처리, egg 상태 예외 UI, daily mission progress 정의, Zustand store 분리, 섬 에셋 프리패치 제안은 현재 방향과 맞아 계획서에 반영했다.
- 리뷰 문서의 `purchase_decor_item(p_user_id, p_item_id)` 예시는 클라이언트가 `user_id`를 넘기는 형태라 그대로 쓰면 소유권 위조 위험이 있다. 계획서에는 `auth.uid()`를 내부에서 사용하는 방식으로 수정 반영했다.
- pg_cron 기반 매일 리셋은 운영상 유효하지만 MVP 1차에는 복잡도가 높다. 우선은 `submit_vote`와 `claim_daily_checkin`에서 KST 기준 날짜와 idempotency key로 lazy progress를 처리하는 방향이 더 안전하다.

## 2026-06-01 Korean Feed Recovery Status

- 기존 `supabase/seed_clean.sql`의 영어 categories/islands/characters/questions를 한국어 MVP seed로 교체했다. 질문은 푸드, 라이프, 연애, 커리어, 문화 각 6개씩 총 30개이며, 선택지마다 BIPI 기본축 trait key(`safe`, `adventure`, `plan`, `flow`, `solo`, `social`, `calm`, `express`)를 매핑했다.
- live Supabase에는 전체 destructive reset 대신 `supabase/replace_korean_seed.sql`을 사용한다. 이 파일은 fresh project의 공식 seed 질문을 삭제하고 한국어 seed를 다시 넣는다. 실사용 투표가 쌓인 뒤에는 이 방식이 투표 데이터를 지울 수 있으므로 금지해야 한다.
- 리뷰어 지적대로 `islands`와 `characters`는 사용자 소유 테이블이 아니라 마스터 데이터다. `src/services/gamificationService.ts`가 존재하지 않는 `user_id` 컬럼으로 조회하던 오류를 수정하고, `src/types/database.types.ts`도 실제 schema에 맞게 보정했다.
- 피드 UI의 `votes`, `Option A/B`, 상단 `Balance Island`, 섬/프로필의 일부 영어 문구를 한국어로 교체했다.
- 현재 seed 이미지는 여전히 Unsplash placeholder다. 상용 전환 전에는 앱 전용 이미지 또는 Supabase Storage 기반 자체 에셋으로 교체해야 한다.
- Supabase live DB에 `replace_korean_seed.sql`이 성공 적용되었고, `fetch_feed_questions` RPC가 한국어 질문을 반환하는 것을 확인했다. 현재 앱 피드의 기본 데이터 경로는 한국어 seed 기준으로 동작한다.

## 2026-06-01 Gamification Foundation Implementation Status

- 읽기 전용 리뷰어 에이전트가 지적한 핵심 리스크는 `replace_korean_seed.sql`의 운영 재실행 위험, `submit_vote`의 승인 질문 검증 부족, profile 숫자 직접 증분 기반 경제 모델, gamification RPC/type 미정의, feed user state 동기화 부족이다.
- 새 migration `supabase/migrations/202606012125_gamification_foundation.sql`은 `shell_ledger`, `user_avatar_state`, `user_personality_snapshots`를 추가하고, 보상 지급/차감은 `apply_shell_delta`의 `idempotency_key` 기반 원장 기록으로 처리한다.
- `submit_vote` RPC는 승인된 질문(`status = 'approved'`)을 `FOR UPDATE`로 확인한 뒤 투표를 저장하고, 질문 카운트, 프로필 참여 수, 조개 원장, 아바타 성장, 성향 점수를 한 트랜잭션 경계 안에서 갱신하도록 교체했다.
- `claim_daily_checkin`은 KST 날짜 기반 idempotency key로 하루 1회 조개 보상을 지급한다. 이미 받은 날에는 기존 ledger row를 반환하되, 아바타 mood/energy/bond가 반복 상승하지 않도록 `awarded` 조건을 추가했다.
- `care_avatar`는 `snack`, `play`, `praise` 액션을 제공한다. `snack`과 `play`는 조개 차감 원장을 거치며, `praise`는 무료 친밀도 액션이다.
- 클라이언트에는 `gamificationService`와 `gamificationStore`를 분리해 snapshot, 출석 보상, 아바타 케어, 로그아웃을 관리한다. `profile`과 `island` 화면은 같은 Zustand snapshot을 공유한다.
- `database.types.ts`는 기존 17개 핵심 테이블과 새 게임화 테이블/RPC를 포함하도록 확장했다.
- 검증됨: `npm.cmd run typecheck` 성공.
- 검증됨: `supabase/migrations/202606012125_gamification_foundation.sql` quote/dollar quote scan 성공.
- 제한: 새 migration은 아직 live Supabase SQL Editor에 적용되지 않았다. publishable key로 DDL을 실행할 수 없으므로 사용자가 SQL Editor에서 migration을 실행한 뒤 RPC smoke test를 진행해야 한다.

## 2026-06-01 Live Gamification RPC and Feed State Follow-Up

- 사용자가 live Supabase에 gamification foundation migration 적용 성공을 확인했다.
- publishable key 기반 REST smoke test에서 `fetch_feed_questions`는 3개 한국어 질문을 반환했다. `claim_daily_checkin`과 `care_avatar`는 anon 호출에서 `Authentication required`를 반환해 함수 존재와 auth guard가 확인되었다.
- 읽기 전용 리뷰어가 `fetchGamificationSnapshot` 쿼리 에러 무시, feed `userVote/userReaction` 미동기화, `fetchFeedQuestions` sort 파라미터 미사용, `apply_shell_delta` idempotency race 가능성을 지적했다.
- 새 follow-up migration `supabase/migrations/202606012330_feed_state_and_ledger_hardening.sql`을 추가했다. 이 migration은 `apply_shell_delta`에 idempotency key 필수 검사와 `pg_advisory_xact_lock(hashtext(...))`를 넣어 같은 키의 동시 요청을 직렬화한다.
- 같은 migration에서 `fetch_feed_questions`를 `p_sort` 지원 함수로 교체하고, `user_vote`, `user_reaction`을 반환하도록 확장했다. 서버 정렬은 투표하지 않은 질문을 먼저 보여주고, `latest`, `trending`, `popular` 조건을 반영한다.
- 클라이언트 `questionService`는 `p_sort`를 RPC에 넘기고 `user_vote/user_reaction`을 `userVote/userReaction`으로 복원한다.
- `gamificationService`는 profile/traits/avatar/ledger/island/character 쿼리 에러를 기본값으로 숨기지 않고 명시적으로 throw한다.
- 검증됨: `npm.cmd run typecheck` 성공.
- 검증됨: `supabase/migrations/202606012330_feed_state_and_ledger_hardening.sql` quote/dollar quote scan 성공.
- 제한: follow-up migration은 클립보드에 복사되었으나, live DB에는 사용자가 SQL Editor에서 별도 실행해야 한다.
