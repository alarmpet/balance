# Balance Island Personality Avatar and Island Gamification Plan

작성 시각: 2026-06-01 20:52 KST

## 1. Product Direction

밸런스 아일랜드의 핵심은 단순한 A/B 투표 앱이 아니라, 사용자의 선택이 매일 쌓여 "나와 닮은 캐릭터"와 "내 성향이 반영된 섬"을 성장시키는 게임형 성향 앱이 되는 것이다.

가장 강한 방향은 `캐릭터/아바타가 감정적 주인공`, `섬은 성장과 꾸미기의 무대`가 되는 구조다.

사용자 루프:

1. 오늘의 밸런스 질문을 본다.
2. A/B 선택을 한다.
3. 선택에 연결된 trait 점수가 쌓인다.
4. 누적 성향이 MBTI풍 캐릭터 프로필로 변한다.
5. 출석, 투표, 리액션, 질문 작성으로 조개 보상을 받는다.
6. 조개로 캐릭터를 케어하고 섬을 꾸민다.
7. 다음 날 캐릭터 상태, 섬 변화, 새 질문 보상을 확인하러 돌아온다.

이 구조가 좋은 이유:

- 캐릭터는 사용자가 감정 이입하는 대상이다.
- 섬은 장기 성장, 수집, 꾸미기, 공유를 담는 무대다.
- 밸런스 질문은 매일 성향을 갱신하는 가벼운 행동이다.
- 보상 경제는 매일 재방문 이유를 만든다.

## 2. Core Concept

서비스 문장:

> 매일 밸런스 질문에 답하면, 내 선택을 먹고 자라는 성향 캐릭터와 나만의 섬이 진화한다.

사용자에게 보여줄 표현은 "정식 심리검사"가 아니라 "게임형 성향 아바타"로 잡는다.

금지해야 할 표현:

- "당신의 진짜 성격을 정확히 진단합니다."
- "MBTI 검사보다 정확합니다."
- "심리 분석 결과"

권장 표현:

- "선택으로 자라는 나만의 밸런스 캐릭터"
- "요즘 내 선택 성향"
- "오늘의 성향 조류"
- "내 아바타가 이런 선택을 좋아해요"

## 3. Personality Model

MBTI를 그대로 복제하지 않는다. 상표/기대치/정확도 리스크가 있으므로, 앱 내부 모델은 독자적인 4축 체계로 만든다.

추천 이름: `BIPI`, Balance Island Personality Index.

4개 축:

1. 에너지 방향: `solo` vs `social`
   - 혼자 충전형 / 같이 충전형
2. 선택 방식: `safe` vs `adventure`
   - 안정 선택형 / 모험 선택형
3. 생활 리듬: `plan` vs `flow`
   - 계획 루틴형 / 즉흥 흐름형
4. 감정 표현: `calm` vs `express`
   - 차분 관찰형 / 솔직 표현형

16개 타입은 MBTI처럼 4글자로 만들되, 이름은 자체 세계관으로 붙인다.

예시:

- `SPCE`: 조용한 조개 정원사
- `SAFE`: 즉흥 파도 탐험가
- `PPCE`: 루틴을 짓는 등대지기
- `PAFE`: 번뜩이는 축제 항해사

각 타입은 사용자에게 이렇게 설명한다:

- 한 줄 칭호
- 대표 성향 3개
- 좋아하는 질문 카테고리
- 캐릭터 케어 팁
- 섬 성장 방향

## 4. Avatar Strategy

아바타는 "사용자 자신"을 직접 닮게 만드는 커스터마이즈 캐릭터보다, "내 성향을 반영하는 동반자 캐릭터"가 MVP에 더 적합하다.

이유:

- 얼굴/신체 커스터마이즈는 제작 범위가 커진다.
- 국내 앱 초반에는 귀여운 캐릭터 애착이 진입장벽이 낮다.
- 성향 변화가 캐릭터 표정, 의상, 말투, 행동으로 드러나면 반복 방문 동기가 강해진다.

MVP 캐릭터 체계:

- 기본 캐릭터 5종: 거북이, 여우, 수달, 고양이, 펭귄 같은 동물형은 귀엽지만, 앱 고유성을 위해 이름과 실루엣은 독자화한다.
- 캐릭터 타입은 trait 축에 따라 자동 배정된다.
- 사용자는 처음에 캐릭터를 고르는 것이 아니라, 첫 10개 질문 후 "성향 알"에서 캐릭터가 부화한다.
- 이후 선택 누적에 따라 캐릭터 성격, 말풍선, 액세서리, 포즈가 바뀐다.

진화 단계:

1. 알: 가입 직후, 질문 0~9개
2. 새싹 캐릭터: 질문 10개
3. 탐험가 캐릭터: 질문 50개
4. 섬지기 캐릭터: 질문 100개
5. 전설 캐릭터: 질문 300개

## 5. Island Strategy

섬은 캐릭터가 사는 공간이자 사용자의 성향 기록판이다.

섬 성장 기준:

- 총 참여 10개: 작은 모래섬 오픈
- 총 참여 50개: 집/오두막 오픈
- 총 참여 100개: 선착장/정원 오픈
- 총 참여 300개: 확장 섬/비밀 구역 오픈

섬 테마는 상위 trait 2개와 카테고리 참여 비율로 결정한다.

예시:

- 음식 질문 많이 참여 + adventure 높음: 맛탐험 야시장 섬
- 라이프 질문 많이 참여 + plan 높음: 루틴 정원 섬
- 연애 질문 많이 참여 + express 높음: 하트 라군 섬
- 커리어 질문 많이 참여 + safe 높음: 등대 오피스 섬
- 문화 질문 많이 참여 + flow 높음: 페스티벌 해변 섬

MVP에서는 실제 드래그 앤 드롭 꾸미기보다, 슬롯형 꾸미기를 추천한다.

슬롯:

- 배경
- 집
- 나무/식물
- 장식 오브젝트 3개
- 캐릭터 위치

이 방식은 구현이 훨씬 빠르고, 모바일 UI도 안정적이다.

## 6. Reward Economy

재화 이름은 `조개`를 유지한다.

기본 보상:

- 출석: 조개 10
- 오늘 첫 투표: 조개 5
- 투표 1회: 조개 1
- 오늘 7/10 참여 달성: 조개 20
- 리액션 3회: 조개 5
- 댓글 1회: 조개 5
- 질문 작성 승인: 조개 30
- 주간 인기 질문 작성자: 조개 100 + 배지

케어 재화 사용:

- 간식 주기: 조개 10
- 놀아주기: 조개 10
- 캐릭터 액세서리: 조개 50~300
- 섬 장식: 조개 80~500
- 섬 확장: 레벨 조건 + 조개 1,000

경제 원칙:

- 투표만 해도 매일 소소한 성장이 가능해야 한다.
- 꾸미기 고급 아이템은 3~7일 목표가 되어야 한다.
- 출석 보상만으로 모든 것을 살 수 있으면 질문 참여 동기가 약해진다.
- 유료화는 MVP 이후에만 검토한다. 초기에는 retention 검증이 먼저다.

## 7. Daily Care Loop

캐릭터 상태값:

- `mood`: 기분
- `energy`: 에너지
- `bond`: 친밀도
- `style_score`: 꾸미기 점수

상태 변화:

- 매일 접속하지 않으면 mood가 조금 내려간다.
- 질문을 풀면 energy가 올라간다.
- 케어 행동을 하면 bond가 오른다.
- 아이템 장착은 style_score를 올린다.

중요: 캐릭터가 사용자를 압박하면 안 된다. "방치해서 아프다" 같은 죄책감 UX는 피한다.

권장 문구:

- "기다리고 있었어!"
- "오늘 선택 덕분에 섬에 햇살이 들어왔어."
- "조개가 모였어. 작은 장식을 하나 놓아볼까?"

피해야 할 문구:

- "왜 안 왔어?"
- "캐릭터가 슬퍼합니다."
- "연속 출석이 끊겨 손해입니다."

## 8. UI Direction

첨부 이미지 스타일을 기준으로 잡는다.

핵심 스타일:

- 밝은 하늘색 배경
- 바다/섬/구름/야자수 요소
- 둥근 흰색 메인 카드
- 두꺼운 그림자와 말랑한 3D 아이콘
- 큰 한국어 제목
- 조개, 불꽃, 알림 배지
- 피드 카드는 이미지 중심 A/B 카드
- 하단에는 리액션, 보상, 오늘 참여 진행도

화면별 방향:

### 피드

- 상단: 햄버거, 로고, 연속 참여일, 조개, 알림
- 카드 배너: "오늘의 밸런스"
- 질문 제목: 큼직한 한국어 문장
- 선택지: A/B 이미지 카드
- 투표 전: 이미지 탭 유도
- 투표 후: 퍼센트바와 "내 캐릭터가 좋아한 선택" 표시
- 하단: 좋아요/재밌다/어렵다, 오늘 참여 7/10 progress

### 캐릭터

- 내 캐릭터가 중앙에 크게 표시
- 타입 칭호, BIPI 4축 그래프
- 기분/에너지/친밀도
- 케어 버튼 3개: 간식, 놀기, 칭찬
- 다음 진화까지 progress

### 섬

- full-bleed 섬 배경
- 슬롯형 장식 배치
- 보유 장식 inventory
- 섬 레벨과 확장 조건

### 상점

- 조개로 살 수 있는 장식/액세서리
- MVP에서는 결제 없음
- 아이템은 rarity와 unlock condition 표시

## 9. Data Model Additions

현재 schema를 유지하면서 아래 테이블을 추가하는 방향이 좋다.

### personality_axes

- `id`
- `axis_key`: solo_social, safe_adventure, plan_flow, calm_express
- `left_key`
- `right_key`
- `label`

### user_personality_snapshots

- `id`
- `user_id`
- `type_code`
- `type_title`
- `solo_social_score`
- `safe_adventure_score`
- `plan_flow_score`
- `calm_express_score`
- `primary_trait_key`
- `secondary_trait_key`
- `computed_at`

### avatar_species

- `id`
- `slug`
- `name`
- `base_image_url`
- `description`
- `primary_axis_affinity`

### user_avatar_state

- `user_id`
- `species_id`
- `type_code`
- `evolution_stage`
- `level`
- `experience`
- `mood`
- `energy`
- `bond`
- `equipped_accessory_ids`
- `updated_at`

### island_decor_items

- `id`
- `slug`
- `name`
- `slot_type`
- `rarity`
- `price_shells`
- `image_url`
- `unlock_condition`

### user_inventory_items

- `user_id`
- `item_id`
- `quantity`
- `acquired_at`

### user_island_layouts

- `user_id`
- `island_level`
- `background_item_id`
- `house_item_id`
- `plant_item_id`
- `decor_slot_1_item_id`
- `decor_slot_2_item_id`
- `decor_slot_3_item_id`
- `updated_at`

서버 RPC:

- `submit_vote`: trait 점수 + 보상 + daily mission progress까지 함께 처리
- `claim_daily_checkin`: 출석 보상 처리
- `care_avatar`: 조개 차감 + mood/energy/bond 증가
- `purchase_item`: 조개 차감 + inventory 추가
- `equip_island_item`: layout 업데이트
- `compute_personality_snapshot`: trait 점수 정규화 후 BIPI 타입 계산

## 10. Trait Mapping

질문은 기존 `question_traits`를 유지하되, 각 선택지는 BIPI 축 점수와 일반 trait 점수를 모두 올린다.

예시:

질문: "짜장면 vs 짬뽕, 오늘 딱 하나만 먹는다면?"

- A 짜장면:
  - `safe`: 1.2
  - `comfort`: 1.4
  - `calm`: 0.5
- B 짬뽕:
  - `adventure`: 1.2
  - `spicy_energy`: 1.4
  - `express`: 0.5

DB 안정성을 위해 trait key는 영어 snake_case를 유지하고, 앱에서 한국어 라벨로 매핑한다.

예:

- `safe` -> 안정 선택형
- `adventure` -> 모험 선택형
- `plan` -> 계획 루틴형
- `flow` -> 즉흥 흐름형

## 11. Content Strategy

국내 초기 사용자에게 맞는 질문 카테고리:

- 음식: 짜장면/짬뽕, 민초, 떡볶이 맵기, 야식, 카페 메뉴
- 라이프: 집콕/외출, 계획/즉흥, 소비/저축, 아침형/밤형
- 연애: 연락 빈도, 데이트 방식, 표현 방식, 갈등 해결
- 커리어: 안정/도전, 협업/몰입, 피드백 방식, 성장 방식
- 문화: 영화/드라마, 콘서트, 여행, 게임, 전시

질문 문체:

- 짧고 말맛 있게
- 한국어 구어체
- 선택지 설명은 2~3줄
- 과도한 밈은 피하고, 오래 가는 생활감 있는 표현 사용

## 12. Image Strategy

현재 이미지:

- 현재 seed 이미지는 AI 생성 이미지가 아니다.
- 대부분 Unsplash 원격 이미지 URL이다.
- MVP 실행을 위한 placeholder 성격이다.

추천 방향:

1. 피드 음식/장소 이미지는 초기에는 실제감 있는 이미지가 좋다.
2. 캐릭터/섬/아이템은 앱 고유성이 필요하므로 AI 생성 또는 전용 일러스트 에셋을 써야 한다.
3. 법적/브랜드 리스크를 줄이려면 seed에 외부 URL을 장기 사용하지 않는다.
4. 앱 전용 에셋은 `assets/images` 또는 Supabase Storage에 저장한다.

MVP 이미지 단계:

- 1단계: 한국어 질문 + 안정적인 placeholder 이미지
- 2단계: 캐릭터/섬/아이템 전용 AI 이미지 30~50개 생성
- 3단계: 선택지 이미지까지 카테고리별 템플릿화

## 13. MVP Implementation Phases

### Phase 1: Korean Feed Recovery

목표:

- 현재 영어 seed를 한국어 질문 30개로 교체
- 깨진 한글 UI 문구 복구
- 피드 화면을 첨부 이미지 방향으로 1차 리디자인

완료 기준:

- 피드에 한국어 질문 표시
- A/B 카드 이미지 표시
- 투표 후 퍼센트 표시
- 오늘 참여 progress 표시

### Phase 2: BIPI Personality Core

목표:

- trait 점수를 4축 성향으로 정규화
- user personality snapshot 생성
- 캐릭터 타입/칭호 계산

완료 기준:

- 사용자가 10개 질문 후 타입 결과를 받음
- 캐릭터 탭에서 타입/칭호/성향 막대 표시

### Phase 3: Avatar Care

목표:

- user_avatar_state 추가
- 출석/질문 보상으로 캐릭터 케어
- mood/energy/bond 표시

완료 기준:

- 조개 사용 케어 버튼 동작
- 친밀도/에너지 UI 갱신
- 다음 진화까지 progress 표시

### Phase 4: Island Decoration

목표:

- 슬롯형 섬 꾸미기
- inventory와 item purchase
- 섬 레벨별 배경 확장

완료 기준:

- 조개로 아이템 구매
- 섬 슬롯에 아이템 장착
- 앱 재실행 후 layout 유지

### Phase 5: Retention and Sharing

목표:

- 출석 캘린더
- 주간 인기 질문 보상
- 내 캐릭터/섬 공유 이미지

완료 기준:

- 7일 streak 보상
- 캐릭터 결과 카드 저장/공유

## 14. Risks and Guardrails

### Personality Accuracy Risk

위험:

- 사용자가 성향 결과를 진단처럼 받아들일 수 있다.

대응:

- "게임형 성향"이라고 명확히 표현한다.
- 결과는 단정형보다 현재 선택 경향으로 쓴다.
- 민감한 정신건강/연애 조언은 피한다.

### Economy Inflation Risk

위험:

- 조개를 너무 많이 주면 꾸미기 목표가 빨리 소진된다.
- 너무 적게 주면 피로감이 생긴다.

대응:

- MVP에서는 가격표와 보상표를 고정하지 말고 원격 config화한다.
- 일일 평균 획득량을 30~60 조개로 시작한다.

### Scope Risk

위험:

- 캐릭터 생성, 섬 꾸미기, 상점, 미션, AI 질문 생성이 한 번에 들어가면 MVP가 무거워진다.

대응:

- 먼저 한국어 피드 + 성향 계산 + 캐릭터 결과를 완성한다.
- 꾸미기는 슬롯형 MVP로 제한한다.

### Asset Risk

위험:

- 외부 이미지 URL은 품질/저작권/로딩 안정성 리스크가 있다.

대응:

- 캐릭터/섬/아이템은 전용 에셋으로 교체한다.
- Unsplash는 임시 feed placeholder로만 사용한다.

### Supabase Security Risk

위험:

- 재화/보상/구매를 클라이언트에서 처리하면 조작 가능하다.

대응:

- 조개 지급/차감은 모두 RPC에서 처리한다.
- RLS는 user_id 소유권 기준으로 제한한다.
- idempotency key로 중복 보상을 막는다.

## 15. Immediate Next Actions

권장 다음 작업 순서:

1. 영어 seed를 한국어 seed로 교체한다.
2. 깨진 한국어 UI 문자열을 복구한다.
3. 피드 화면을 첨부 이미지 스타일로 리디자인한다.
4. `BIPI` 성향 축과 타입 매핑 테이블을 추가한다.
5. 캐릭터 탭을 `내 캐릭터` 중심으로 재구성한다.
6. 조개 보상 RPC를 확장한다.
7. 섬 꾸미기는 슬롯형으로 1차 구현한다.

최우선 결정:

- 앱의 주인공은 "섬"이 아니라 "내 성향 캐릭터"다.
- 섬은 캐릭터의 집이자 성장/꾸미기 보드다.
- MBTI는 직접 사용하지 않고, 자체 4축 BIPI 모델을 사용한다.
- 심리진단이 아니라 게임형 성향 아바타로 포지셔닝한다.
