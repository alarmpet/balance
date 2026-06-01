# Character Card Collection Economy Plan

작성 시각: 2026-06-01 23:45 KST

## 1. Executive Decision

밸런스 아일랜드에 확률형 카드 시스템을 넣는 방향은 가능하다. 다만 앱의 핵심 정체성은 "내 선택으로 자라는 성향 아바타"이므로, 확률형 카드는 대표 캐릭터 자체를 결정하는 시스템이 아니라 `캐릭터 카드/스킨/동료/섬 장식 수집`으로 붙이는 것이 가장 안전하다.

P0 전제 조건:

- 카드 경제 구현 전에 `profiles` 직접 업데이트 정책을 좁혀야 한다. 현재 구조에서 사용자가 `shell_balance`를 직접 수정할 수 있으면 뽑기/합성 경제는 즉시 무너진다.
- `profiles.shell_balance`, `total_participation_count`, `today_participation_count`, `streak_count` 같은 경제/진행 필드는 클라이언트 직접 update 금지 대상이다.
- 경제/진행 필드는 `submit_vote`, `claim_daily_checkin`, `care_avatar`, `draw_card_pack`, `fuse_cards` 같은 RPC에서만 변경한다.
- 모든 카드/재화 RPC는 클라이언트가 넘기는 `request_id` 또는 서버가 확정한 idempotency key를 unique key로 기록하고, 같은 요청은 같은 결과를 반환해야 한다.

최종 방향:

- 대표 아바타 성장: BIPI 성향과 참여 기록으로 결정한다.
- 카드 수집: 출석, 미션, 조개 재화, 이벤트로 획득한다.
- 카드 효과: 프로필 꾸미기, 섬 배치, 캐릭터 스킨, 말풍선, 이펙트에 사용한다.
- 유료 뽑기: MVP에서는 금지한다. 조개를 현금으로 판매하기 전까지는 무료/획득 재화 기반으로 검증한다.
- 확률 공개: 무료 뽑기라도 앱 안에서 확률표를 공개한다. 이후 유료 재화가 연결되면 게임산업법상 확률형 아이템 정보공개 의무 대상이 될 수 있으므로, 게임물/홈페이지/광고의 확률 표시 체계를 먼저 갖춘다.

정책 근거:

- 대한민국 정책브리핑에 따르면 2024년 3월 22일부터 게임산업진흥법 및 시행령에 따라 확률형 아이템 정보공개 제도가 시행되었고, 확률형 아이템은 직·간접적으로 유상 구매할 수 있는 아이템 중 우연적 요소로 종류, 효과, 성능 등이 결정되는 것을 말한다.
- 같은 자료는 게임물과 홈페이지 등에 확률 정보를 쉽게 표시해야 하며, 위반 시 시정요청, 시정권고, 시정명령 및 처벌 가능성이 있다고 설명한다.
- 따라서 밸런스 아일랜드는 "무료 보상형 카드"로 시작하되, 설계와 UI는 유료 전환 가능성을 전제로 투명하게 만든다.

출처:

- 대한민국 정책브리핑, "확률형 아이템 정보 22일부터 공개…위반 시 시정조치", 2024-03-22: https://www.korea.kr/news/policyNewsView.do?newsId=148927317

## 2. Asset Direction

사용자가 제공한 에셋은 이미 3단계 희귀도 체계에 잘 맞는다.

### Common

경로 예시:

- `C:\Users\petbl\Desktop\alarmpetgo_\svg\american shorthair.png`
- `C:\Users\petbl\Desktop\alarmpetgo_\svg\bichon.png`
- `C:\Users\petbl\Desktop\alarmpetgo_\svg\chameleon.png`

역할:

- 밝고 단순한 기본 카드.
- 신규 사용자에게 친근하게 보여주는 1차 수집 대상.
- 출석 랜덤 카드 대부분을 차지한다.

### Rare

경로 예시:

- `C:\Users\petbl\Desktop\alarmpetgo_\rare\rare-american shorthair.png`
- `C:\Users\petbl\Desktop\alarmpetgo_\rare\rare-bichon.png`
- `C:\Users\petbl\Desktop\alarmpetgo_\rare\rare-chameleon.png`

역할:

- 같은 종의 상위 스킨.
- 배경, 오라, 반짝임, 카드 프레임이 들어간 수집형 보상.
- 섬 화면에서 배치하면 작은 이펙트나 프로필 배지를 줄 수 있다.

### Legendary

경로 예시:

- `C:\Users\petbl\Desktop\alarmpetgo_\legend\20250602_0348_Cosmic Warrior 1.png`
- `C:\Users\petbl\Desktop\alarmpetgo_\legend\20250602_0348_Cosmic Warrior 2.png`
- `C:\Users\petbl\Desktop\alarmpetgo_\legend\20250602_0348_Cosmic Warrior 3.png`

역할:

- "별빛 수호자" 시리즈 같은 시즌 최상위 카드.
- 매일 보상 루프의 장기 목표.
- 대표 캐릭터를 대체하기보다, 전설 스킨/특수 포즈/섬 수호자 배치로 쓰는 편이 좋다.

중요한 스타일 결정:

- Common과 Rare는 현재 앱의 귀여운 섬 UI와 잘 맞는다.
- Legendary는 멋있지만 어둡고 강한 판타지 톤이므로, 앱 전체 첫인상에는 바로 쓰지 않는다.
- Legendary는 뽑기 결과 연출, 카드 상세, 특별 배치 화면에서만 강한 대비를 주는 "프리미엄 순간"으로 사용한다.

## 3. Collection Model

카드는 세 가지로 분리한다.

1. `species`: 기본 캐릭터 종류
2. `variant`: 희귀도와 외형
3. `copy`: 사용자가 보유한 장수

예:

- species: `american_shorthair`
- common variant: `american_shorthair_common`
- rare variant: `american_shorthair_rare`
- legendary variant: `cosmic_warrior_cat_01`

사용자는 카드를 "캐릭터 자체"로 소유하는 것이 아니라, 카드 복사본과 스킨을 수집한다.

보유 의미:

- 1장 보유: 도감 등록
- 2~9장 보유: 성장 재료
- 10장 보유: 합성 가능
- 특정 카드 1장 이상 보유: 프로필/섬에 배치 가능

중복 카드가 손해로 느껴지지 않게 하는 것이 핵심이다.

## 4. Draw Economy

### 기본 카드팩

이름: `오늘의 조개 카드`

획득 경로:

- 매일 출석 1회: 무료 1장
- 오늘 7/10 참여 달성: 추가 1장
- 조개 100개 사용: 1장
- 조개 900개 사용: 10장 묶음, 마지막 1장은 Rare 이상 보정

MVP에서는 현금 결제 없음.

### 기본 확률

사용자가 제안한 100장 풀을 그대로 앱에 맞게 정리한다.

| 희귀도 | 확률 | 100장 기준 | 설명 |
|---|---:|---:|---|
| Common | 90% | 90장 | 기본 캐릭터 카드 |
| Rare | 9% | 9장 | 오라/특수 배경/상위 스킨 |
| Legendary | 1% | 1장 | 시즌 전설 카드 |

10장 묶음 보정:

- 1~9번째: 기본 확률 적용
- 10번째: Rare 90%, Legendary 10%
- 이 보정 확률은 UI에 별도로 표시한다.

천장:

- 50회 연속 Legendary 미획득 시 다음 10장 묶음의 10번째 카드에서 Legendary 확률을 30%로 올린다.
- 100회 연속 Legendary 미획득 시 다음 10장 묶음의 10번째 카드는 Legendary 확정.
- 천장 카운트는 무료/조개 뽑기 모두 포함한다.
- 이벤트/보상 전용 확정권은 천장 카운트에 포함하지 않는다.

이유:

- 1% 전설은 목표가 되지만, 천장 없이 운영하면 장기 사용자에게 박탈감이 크다.
- 국내 사용자에게 확률형 아이템 불신이 강하므로, MVP부터 천장/기록/확률 공개를 넣는 것이 신뢰에 좋다.

## 5. Fusion Economy

사용자 제안인 "일반 10장 합성"은 좋은 재방문 동기다. 다만 10장을 날렸는데 아무것도 체감되지 않으면 피로감이 크므로, 합성은 항상 무언가를 보장해야 한다.

### Common 10장 합성

입력:

- 같은 Common 카드 10장

결과:

| 결과 | 확률 |
|---|---:|
| 같은 species Rare 카드 | 70% |
| 랜덤 Rare 카드 | 25% |
| 랜덤 Legendary 조각 1개 | 5% |

실패 없음.

### Rare 5장 합성

입력:

- 같은 Rare 카드 5장

결과:

| 결과 | 확률 |
|---|---:|
| 같은 species Rare+ 프레임 | 60% |
| 랜덤 Legendary 조각 3개 | 35% |
| 랜덤 Legendary 카드 | 5% |

### Legendary 조각

- Legendary 조각 30개 = 선택형 Legendary 카드 1장
- 조각은 종/시리즈 공용으로 시작한다.
- 장기적으로 시즌별 조각을 둘 수 있지만 MVP에서는 공용 조각이 낫다.

### 합성 보호 규칙

- 장착 중인 카드는 합성 재료로 자동 선택하지 않는다.
- 사용자가 마지막 1장만 보유한 카드는 합성 재료에서 제외한다.
- 합성 전 결과 확률과 소모 수량을 명확히 보여준다.
- 합성 결과는 `card_fusion_history`에 기록한다.

## 6. Retention Loop

하루 루프:

1. 앱 접속
2. 무료 카드 1장 열기
3. 피드 질문 7개 참여
4. 추가 카드 1장 획득
5. 중복 카드가 쌓이면 합성
6. 새 카드/스킨을 섬에 배치
7. 다음 전설 천장까지 남은 횟수 확인

주간 루프:

- 7일 출석: Rare 이상 카드팩
- 주간 질문 50개 참여: Legendary 조각 5개
- 주간 인기 질문 작성자: 시즌 카드팩 10장

시즌 루프:

- 4주 시즌 단위로 Legendary 3종 운영
- 시즌 종료 후에도 획득 카드는 유지
- 시즌 복각은 2~3개월 후 이벤트로 제공

## 7. UX Screens

### 출석 카드 오픈 모달

구성:

- 카드 뒷면: 조개 문양 + 반짝이는 파도
- 탭하면 뒤집힘
- Common은 밝은 pop 효과
- Rare는 오라와 해변 빛 효과
- Legendary는 별빛/카메라 흔들림/전용 사운드

버튼:

- `섬에 배치`
- `도감 보기`
- `한 장 더 뽑기`

### 카드 도감

탭:

- 전체
- 일반
- 레어
- 전설
- 합성 가능

카드 표시:

- 보유 수량
- 장착 여부
- 합성까지 남은 장수
- 출현 확률 보기

### 합성 화면

구성:

- 재료 카드 10장 슬롯
- 결과 후보 3개
- 확률표
- "마지막 1장은 보호됩니다" 안내

### 확률 정보 화면

항상 접근 가능한 위치:

- 카드팩 상세 하단
- 카드 도감 우상단
- 설정 > 확률 정보

내용:

- 카드팩별 희귀도 확률
- 10장 묶음 보정 확률
- 천장 규칙
- 합성 결과 확률
- 시즌 카드 목록
- 마지막 갱신일

## 8. Data Model

새 테이블:

### card_species

- `id uuid primary key`
- `slug text unique not null`
- `display_name text not null`
- `personality_affinity text[] default '{}'`
- `description text`
- `is_active boolean default true`
- `sort_order integer default 0`
- `created_at timestamptz default now()`

### card_variants

- `id uuid primary key`
- `species_id uuid references card_species(id)`
- `slug text unique not null`
- `display_name text not null`
- `rarity text check (rarity in ('common', 'rare', 'legendary'))`
- `series_key text not null default 'base'`
- `asset_url text not null`
- `thumbnail_url text`
- `is_limited boolean default false`
- `is_active boolean default true`
- `sort_order integer default 0`
- `created_at timestamptz default now()`

### card_draw_pools

- `id uuid primary key`
- `slug text unique not null`
- `display_name text not null`
- `cost_shells integer default 0`
- `draw_count integer default 1`
- `guarantee_rule jsonb default '{}'`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `is_active boolean default true`

### card_draw_pool_items

- `pool_id uuid references card_draw_pools(id)`
- `variant_id uuid references card_variants(id)`
- `weight integer not null`
- `is_guaranteed_candidate boolean default true`

### user_card_inventory

- `user_id uuid references profiles(id)`
- `variant_id uuid references card_variants(id)`
- `quantity integer default 0`
- `locked_quantity integer default 0`
- `first_acquired_at timestamptz`
- `updated_at timestamptz default now()`
- primary key: `(user_id, variant_id)`

### card_draw_history

- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `pool_id uuid references card_draw_pools(id)`
- `variant_id uuid references card_variants(id)`
- `rarity text not null`
- `cost_shells integer default 0`
- `idempotency_key text unique not null`
- `pity_before integer not null`
- `pity_after integer not null`
- `created_at timestamptz default now()`

### user_card_pity

- `user_id uuid references profiles(id)`
- `pool_id uuid references card_draw_pools(id)`
- `legendary_miss_count integer default 0`
- `updated_at timestamptz default now()`
- primary key: `(user_id, pool_id)`

### card_fusion_recipes

- `id uuid primary key`
- `input_rarity text not null`
- `input_quantity integer not null`
- `same_species_required boolean default true`
- `result_rule jsonb not null`
- `is_active boolean default true`

### card_fusion_history

- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `recipe_id uuid references card_fusion_recipes(id)`
- `input_variant_ids uuid[] not null`
- `result_variant_id uuid`
- `result_fragment_type text`
- `result_fragment_amount integer default 0`
- `idempotency_key text unique not null`
- `created_at timestamptz default now()`

### user_card_fragments

- `user_id uuid references profiles(id)`
- `fragment_key text not null`
- `quantity integer default 0`
- `updated_at timestamptz default now()`
- primary key: `(user_id, fragment_key)`

## 9. Server RPC

모든 확률/재화/인벤토리 변경은 서버 RPC에서 처리한다. 클라이언트는 결과 표시만 한다.

공통 RPC 규칙:

- `auth.uid()`가 없으면 실패한다.
- 클라이언트에서 `user_id`를 받지 않는다.
- `p_request_id uuid`를 받거나 서버가 결정적 idempotency key를 만든다.
- `card_draw_history.idempotency_key` 또는 `card_fusion_history.idempotency_key`가 이미 있으면 기존 결과를 반환한다.
- 재화 차감과 인벤토리 증감은 같은 트랜잭션 안에서 처리한다.
- 인벤토리 차감 전에는 대상 row를 `FOR UPDATE`로 잠근다.
- 보유 수량은 절대 음수가 될 수 없다.

### claim_daily_card

역할:

- KST 기준 하루 1회 무료 카드 지급.
- `idempotency_key = daily_card:{user_id}:{yyyy-mm-dd}`.
- 중복 호출 시 기존 결과 반환.

### draw_card_pack

입력:

- `p_pool_slug text`
- `p_draw_count integer`
- `p_request_id uuid`

처리:

1. `auth.uid()` 확인
2. pool 활성 여부 확인
3. 조개 비용 계산
4. `apply_shell_delta`로 비용 차감
5. draw_count만큼 weighted random 수행
6. 10장 보정/천장 적용
7. inventory 증가
8. draw history 기록
9. pity 업데이트
10. 결과 배열 반환

재시도 규칙:

- 같은 `p_request_id`로 다시 호출하면 조개를 다시 차감하지 않고 같은 draw history 결과를 반환한다.
- 네트워크 타임아웃 후 사용자가 재시도해도 결과가 바뀌면 안 된다.
- `p_request_id`는 UI에서 카드팩 열기 버튼을 누르는 순간 생성하고, 결과 수신 전까지 유지한다.

### fuse_cards

입력:

- `p_recipe_id uuid`
- `p_input_variant_id uuid`
- `p_request_id uuid`

처리:

1. `auth.uid()` 확인
2. 보유 수량과 locked 보호 수량 확인
3. 재료 차감
4. fusion weighted random 수행
5. 결과 카드 또는 조각 지급
6. fusion history 기록
7. 결과 반환

재시도 규칙:

- 같은 `p_request_id`는 같은 합성 결과를 반환한다.
- 재료 차감은 한 번만 발생한다.
- 장착/잠금 수량은 `locked_quantity`로 보호한다.

### get_card_collection_snapshot

역할:

- 도감, 보유 수량, 합성 가능 상태, 천장 상태, 확률표를 한 번에 반환.

## 10. Security and Fairness Rules

필수:

- 클라이언트가 `user_id`를 넘기지 않는다.
- 모든 RPC는 `auth.uid()`를 사용한다.
- 모든 draw/fusion은 `p_request_id`를 받고 서버에서 idempotency key로 변환한다.
- 같은 idempotency key는 같은 결과를 반환해야 한다.
- 카드 확률표와 실제 pool weights가 같은 테이블에서 나온다.
- 운영자가 확률표와 실제 가중치를 따로 입력하지 않게 한다.
- `card_draw_history`는 삭제하지 않는다.
- 운영자용 확률 변경은 migration 또는 admin-only RPC로만 한다.
- `profiles_update_own` 정책은 닉네임, 아바타, bio 같은 안전한 표시 필드만 수정 가능하도록 바꾼다.
- `shell_balance`, streak, participation, inventory, pity, fusion, draw history는 클라이언트 직접 쓰기를 막는다.

난수:

- MVP에서는 PostgreSQL random 기반 weighted selection으로 충분하다.
- 단, 결과를 history에 즉시 기록하고, 확률표와 pool weights를 공개해 검증 가능하게 한다.
- 장기적으로 법적/감사 요구가 커지면 서버 Edge Function에서 seedable audit log를 추가한다.

## 11. Legal and Store Policy Guardrails

MVP 정책:

- 현금으로 조개를 판매하지 않는다.
- 카드팩은 출석/미션/무료 획득 조개로만 연다.
- 그래도 확률표는 앱 안에 공개한다.
- 미성년자에게 과금 유도 문구를 쓰지 않는다.
- "지금 안 뽑으면 손해" 같은 압박형 문구를 쓰지 않는다.

유료화 전 필수 체크:

- 게임산업법상 확률형 아이템 정보공개 의무 검토.
- 앱/홈페이지/광고 소재의 확률 표시 일치.
- Apple/Google 인앱결제 정책 검토.
- 청소년 보호/구매한도/환불 정책 검토.
- 확률 변경 시 공지와 버전 관리.
- 미성년자 보호 UX: 일일 카드팩 개봉 한도, 야간 푸시 억제, 과몰입 경고, 보호자 안내 문구를 검토한다.
- `profiles.age_range`를 활용하되, 연령 정보가 없을 때는 보수적인 기본 제한을 적용한다.

금지 문구:

- "이번엔 무조건 나와요"처럼 확률을 오해하게 하는 표현.
- "전설 못 뽑으면 뒤처져요" 같은 경쟁 압박.
- "한 번만 더"류의 과소비 유도.

권장 문구:

- "오늘 무료 카드가 도착했어요."
- "중복 카드는 합성 재료로 쓸 수 있어요."
- "확률과 천장 규칙을 확인할 수 있어요."

## 12. Balance Recommendations

초기 수치:

- 출석 무료 카드: 1장/일
- 7개 질문 참여: 1장/일
- 조개 단일 카드: 100개
- 조개 10장 카드팩: 900개
- 일일 평균 조개 획득: 30~60개
- 무료 사용자 월간 카드 획득 목표: 60~90장
- 무과금 MVP에서도 월 1회 이상 Rare 합성 경험 가능
- Legendary는 1~2개월 목표로 둔다.

이 수치의 의도:

- 매일 들어오면 계속 도감이 차야 한다.
- Rare는 체감 가능해야 한다.
- Legendary는 희귀하되, 천장으로 신뢰를 준다.
- 조개가 케어/섬꾸미기/카드팩 사이에서 선택지를 만들도록 한다.

## 13. Asset Pipeline

권장 위치:

- 원본: `assets/source/characters`
- 앱 번들 썸네일: `assets/images/cards`
- 원격 고해상도: Supabase Storage `card-assets`

처리:

1. 원본 PNG를 보존한다.
2. 앱용 썸네일 WebP 또는 압축 PNG를 만든다.
3. 카드 상세용 1024px 이미지를 만든다.
4. 파일명은 `species_rarity_series_v001.png`로 정규화한다.
5. `card_variants.asset_url`과 `thumbnail_url`에 저장한다.

예시:

- `american_shorthair_common_base_v001.png`
- `american_shorthair_rare_starlight_v001.png`
- `cosmic_warrior_cat_legendary_s01_v001.png`

## 14. MVP Phases

### Phase 1: Asset Catalog

- 제공 에셋을 common/rare/legendary로 분류한다.
- 앱용 썸네일을 생성한다.
- `card_species`, `card_variants` seed를 만든다.
- 도감 UI에서 정적 catalog를 보여준다.

### Phase 2: Daily Free Card

- `claim_daily_card` RPC 추가.
- 출석 시 무료 카드 1장 지급.
- 카드 오픈 모달 구현.
- draw history와 inventory 저장.

### Phase 3: Shell Card Pack

- 조개로 1장/10장 카드팩 열기.
- 10장 보정과 천장 구현.
- 확률 정보 화면 구현.

### Phase 4: Fusion

- Common 10장 합성.
- Rare 5장 합성.
- Legendary fragment 시스템.
- 합성 화면 구현.

### Phase 5: Island Integration

- 보유 카드를 섬에 배치.
- Rare/Legendary는 섬 이펙트 또는 프로필 배지 제공.
- 대표 아바타와 수집 카드의 역할을 UI에서 명확히 분리.

## 15. Open Risks

### P0

- `profiles_update_own`이 경제 필드 직접 수정을 허용하면 카드팩/합성 경제가 성립하지 않는다. 카드 시스템 구현 전 별도 security migration으로 막아야 한다.
- draw/fusion/구매 RPC가 request id 기반 멱등성을 보장하지 않으면 네트워크 재시도에서 과다 차감 또는 중복 지급이 발생한다.

### P1

- 유료 조개 판매를 붙이는 순간 확률형 아이템 정보공개, 앱마켓 정책, 청소년 보호 리스크가 커진다.
- 확률/합성 결과를 클라이언트에서 처리하면 조작 가능성이 높다.
- 확률표와 실제 DB weight가 분리되면 운영 사고가 날 수 있다.

### P2

- Legendary 이미지 톤이 현재 밝은 섬 UI와 다를 수 있다.
- 카드팩이 너무 강하면 밸런스 질문 참여보다 뽑기가 주인공이 될 수 있다.
- 중복 카드 소모가 과하면 사용자가 손해로 느낄 수 있다.

### P3

- 에셋 용량이 크면 Expo 로딩과 앱 용량이 커진다.
- 도감/합성 UI가 많아지면 MVP 범위가 커진다.
- 시즌제를 너무 빨리 넣으면 운영 부담이 생긴다.

## 16. Reviewer Findings Incorporated

읽기 전용 리뷰어가 제시한 주요 지적과 반영 여부:

- 반영: 카드 경제 구현 전 `profiles.shell_balance` 직접 업데이트 가능성을 막는 security migration을 P0 전제 조건으로 추가했다.
- 반영: 모든 뽑기/합성 RPC는 `p_request_id` 기반 멱등성으로 설계하고, 같은 요청은 같은 결과를 반환해야 한다고 명시했다.
- 반영: 인벤토리는 `(user_id, variant_id)` 유니크, 수량 upsert, `FOR UPDATE` 차감, 음수 방지, `locked_quantity` 보호를 요구사항으로 넣었다.
- 반영: 확률 정보 공개, 변경 이력, 천장 포함 최종 확률 표시, 합성 확률 표시를 별도 UX로 명시했다.
- 반영: 미성년자 보호와 과몰입 억제를 유료화 전 체크가 아니라 기본 가드레일로 추가했다.
- 반영: 에셋은 `asset_id`, version, hash, cdn path를 가진 메타데이터와 배포/롤백 파이프라인이 필요하다고 정리했다.

## 17. Recommended Next Step

바로 구현하지 말고, 다음 순서로 가는 것이 좋다.

1. `profiles_update_own` 정책을 먼저 좁힌다.
2. 제공된 에셋을 앱용 asset catalog로 정리한다.
3. common/rare/legendary 각각 3종만 MVP 샘플로 넣는다.
4. 무료 출석 카드 1장만 먼저 구현한다.
5. 유저 인벤토리와 카드 오픈 모달을 검증한다.
6. 그 다음 조개 카드팩과 합성을 추가한다.

가장 중요한 원칙:

- 카드 시스템은 밸런스 질문 참여를 강화해야 한다.
- 대표 아바타는 성향 기반으로 유지한다.
- 확률은 숨기지 않고 보여준다.
- 유료화는 법적/정책 체크 전에는 넣지 않는다.
