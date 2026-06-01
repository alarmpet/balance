# Personality Pet and Theme Gacha Economy Plan

작성 시각: 2026-06-01 23:45 KST

## 1. Executive Decision

밸런스 아일랜드에 확률형 카드 시스템을 넣는 방향은 가능하다. 다만 앱의 핵심 정체성은 "내 선택으로 자라는 성향 아바타"이므로, 확률형 카드는 대표 캐릭터 자체를 결정하는 시스템이 아니라 `캐릭터 카드/스킨/동료/섬 장식 수집`으로 붙이는 것이 가장 안전하다.

## 2026-06-02 Direction Update: Personality Pet + Theme Gacha

최신 방향은 `성향 펫 1마리 + 배경/테마 가챠 1슬롯`으로 단순화한다.

이전 카드 수집 설계에서 유지할 것:

- 확률 공개
- 조개 기반 보상 경제
- 출석/질문 참여 루프
- 중복 보상 처리
- 서버 RPC 기반 멱등성

변경할 것:

- 뽑기 대상은 캐릭터/펫 자체가 아니라 `펫이 사는 세계 테마`로 바꾼다.
- 펫은 사용자의 BIPI 성향과 로컬 이미지 에셋의 성향 태그를 매칭해 1마리만 생성한다.
- 모자, 옷, 신발, 시계 같은 파츠형 아이템은 MVP에서 제외한다.
- 중복 테마는 합성창을 열지 않고 자동 레벨업한다.

최종 사용자 문장:

> 질문을 풀면 내 성향과 닮은 펫이 태어나고, 보상으로 얻은 조개로 펫이 사는 세계 테마를 바꾼다.

이 구조가 더 나은 이유:

- 사용자는 "내 펫"과 "펫의 세계"만 이해하면 된다.
- 장착 슬롯은 배경/테마 1개뿐이라 UI가 단순하다.
- 펫마다 모자/옷 좌표를 맞출 필요가 없어 개발과 에셋 제작이 빠르다.
- 전설 보상은 펫 자체보다 배경 전체 변화로 표현할 때 훨씬 강하게 체감된다.
- 기존 `C:\Users\petbl\Desktop\alarmpetgo_`의 common/rare/legend 펫 이미지는 `초기 성향 펫 후보`와 `희귀도별 펫 초상화`로 쓸 수 있다.

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
- Apple App Store Review Guidelines 3.1.1은 구매형 loot box/randomized virtual item의 유형별 획득 확률을 구매 전에 공개하라고 요구한다: https://developer.apple.com/app-store/review/guidelines/
- Google Play Developer Program Policy는 구매형 randomized virtual items의 획득 확률을 구매 전, 가까운 맥락에서 명확히 공개해야 한다고 설명한다: https://support.google.com/googleplay/android-developer/answer/15402170?hl=en

## 2026-06-02 Economy Review Validation

외부 리뷰 `economy_review_report.md`의 지적 중 채택할 내용:

- `profiles_update_own`이 현재처럼 `WITH CHECK (auth.uid() = id)`만 가지면 `shell_balance`, `streak_count`, `total_participation_count`, `today_participation_count` 같은 경제/진행 필드를 클라이언트가 직접 수정할 수 있다. 이 항목은 실제 `supabase/migrations/202606011940_run_ready_security.sql`의 정책과 맞으므로 P0로 채택한다.
- 모바일 네트워크 재시도에서 중복 차감/중복 지급이 발생할 수 있으므로 `p_request_id` 기반 멱등성을 draw/fusion/theme RPC 최상단에서 먼저 확인해야 한다. 기존 `apply_shell_delta`에는 idempotency가 있으나, 테마 뽑기 결과 자체도 같은 request id에서 같은 결과를 반환해야 하므로 채택한다.
- 확률 정보 화면은 하드코딩하지 않고 실제 draw pool item weight에서 계산해야 한다. 계획서에 이미 같은 원칙이 있지만, API/RPC 수준의 명시가 부족하므로 `get_theme_probability_disclosure`를 추가한다.
- 클라이언트는 뽑기 버튼을 누르는 순간 `request_id`를 만들고 결과 수신 전까지 로컬에 보존해야 한다. 앱 종료/타임아웃 후 재시도해도 같은 request id를 보내야 하므로 채택한다.

수정해서 채택할 내용:

- 리뷰가 제안한 `WITH CHECK (OLD.shell_balance = shell_balance ...)` 형태의 RLS SQL은 PostgreSQL policy에서 그대로 사용할 수 없다. 경제 필드 보호는 `profiles` update 권한 축소, 안전 컬럼만 UPDATE grant, 또는 `update_profile_display` RPC로 처리한다.
- 리뷰의 `draw_theme_pack` 예시는 아직 `card_draw_history`, `card_draw_pools` 이름을 사용한다. 최신 방향은 `theme_draw_history`, `theme_draw_pools`, `theme_skins`, `user_theme_inventory`이므로 구현 계획에서는 theme 명명으로 변환한다.
- Google Play/App Store 정책은 "앱 전체"보다 "게임 또는 loot box/랜덤 유료 아이템" 맥락에서 적용된다. MVP가 무료 보상형이라도 확률 공개 UI는 유지하되, 유료 재화 연결 전에는 별도 법무/스토어 심사 체크를 진행한다.

채택하지 않을 내용:

- 10연차 RPC 전체 SQL 예시는 가상 로직과 미완성 루프가 많아 그대로 계획서 구현 단계로 넣지 않는다. 대신 필요한 트랜잭션 순서와 멱등성 규칙만 반영한다.

## 2026-06-02 Implementation Status: Foundation Applied

구현한 범위:

- `supabase/migrations/202606020200_personality_pet_theme_economy.sql` 추가.
- `profiles_update_own` broad update policy 제거 및 `profiles` 직접 UPDATE 권한 회수.
- `update_profile_display` RPC 추가. 닉네임, 아바타 URL, bio, gender, age range, 선택 섬/캐릭터만 수정한다.
- `pet_species`, `pet_species_traits`, `user_pet_state` 추가.
- `theme_skins`, `theme_draw_pools`, `theme_draw_pool_items`, `user_theme_inventory`, `theme_draw_history`, `user_theme_pity`, `theme_probability_versions` 추가.
- `assign_personality_pet`, `get_theme_probability_disclosure`, `draw_theme_pack`, `claim_daily_theme_draw` RPC 추가.
- 기존 `care_avatar(text)`를 제거하고 `care_avatar(text, uuid)`로 교체해 유료 케어 액션은 request id 없이는 실패하게 했다.
- 일일 무료 테마는 클라이언트 request id를 믿지 않고 `daily_theme:{user_id}:{KST date}` 기반 deterministic id로만 지급한다.
- TypeScript DB 타입, `gamificationService`, `gamificationStore`, `island` 화면을 새 펫/테마 snapshot과 액션에 맞춰 확장했다.

검증:

- `npm.cmd run typecheck` 통과.
- `git diff --check` 통과.

남은 적용 단계:

- live Supabase SQL Editor에서 새 migration을 적용해야 한다.
- 적용 후 anon/auth smoke test가 필요하다: broad profile update 차단, `update_profile_display` 성공, `get_theme_probability_disclosure` 반환, `claim_daily_theme_draw` 같은 날 중복 호출 결과 동일, `draw_theme_pack` 같은 request id 결과 동일.

## 2. Personality Pet Matching

펫 매칭은 "실제 품종 성격 진단"이 아니라 "동물/품종의 대표 인상을 게임 성향 태그로 번역하는 시스템"이다. 사용자의 BIPI 점수와 펫 후보의 태그 벡터를 비교해 가장 가까운 펫을 부화시킨다.

### Matching Inputs

사용자 입력:

- `solo/social`
- `safe/adventure`
- `plan/flow`
- `calm/express`
- 보조 trait: `comfort`, `curious`, `aesthetic`, `leader`, `focus`, `gentle`, `playful`

펫 입력:

- species slug
- display name
- BIPI affinity vector
- primary trait tags
- source notes
- common image path
- rare image path
- legendary image path or legendary counterpart

매칭 방식:

1. 사용자의 `user_traits`를 BIPI 4축 점수로 정규화한다.
2. 각 펫 후보의 affinity vector와 cosine similarity 또는 weighted distance를 계산한다.
3. 가장 가까운 후보를 primary pet으로 부화시킨다.
4. 동점이면 사용자가 2~3개 후보 중 직접 고른다.
5. 부화 후 펫 species는 유지하고, 성향 변화는 말투/표정/테마 추천에 반영한다.

왜 species를 유지하나:

- 매일 성향이 조금 바뀔 때마다 펫이 바뀌면 애착이 끊긴다.
- 첫 부화는 "요즘 내 선택 성향과 가장 닮은 펫"이고, 이후에는 "내 펫이 나와 함께 성장한다"가 된다.

### Source-Grounded Trait Notes

자료는 공식 품종 단체, 동물복지 단체, 수의/펫 케어 자료를 우선한다. 앱 안에서는 출처 문구를 직접 노출하기보다 내부 매핑 근거로만 사용한다.

참고한 대표 근거:

- TICA는 American Shorthair를 good-natured, easy-going, adaptable, calm/devoted/playful 성향으로 설명한다: https://tica.org/breed/american-shorthair/
- AKC는 Bichon Frise를 peppy, curious, playful 성향으로 소개한다: https://www.akc.org/expert-advice/dog-breeds/bichon-frise/
- AKC는 Chihuahua를 charming, graceful, sassy, loyal, big-dog attitude 성향으로 소개한다: https://www.akc.org/dog-breeds/chihuahua/
- AKC Maltese 자료는 gentle, lively, playful 성향을 언급한다: https://www.akc.org/expert-advice/dog-breeds/glamor-charm-8-fun-facts-maltese/
- TICA는 Russian Blue를 sweet-tempered, loyal, intelligent, reserved with strangers, structure/routine 선호로 설명한다: https://tica.org/breed/russian-blue/
- RSPCA는 rabbits를 highly social, playful, inquisitive로 설명한다: https://www.rspca.org.uk/en/adviceandwelfare/pets/rabbits/behaviour
- RSPCA/PetSmart 계열 햄스터 자료는 햄스터를 nocturnal, solitary 성향으로 설명한다: https://www.rspca.org.uk/documents/1494939/7712578/Hamster%2Bfactfile%2B%28PDF%2B48KB%29.pdf/20e42d48-3b3a-4673-3725-05db30daa766?t=1559134492091
- chameleon care 자료는 chameleons를 solitary/territorial로 설명한다: https://static1.squarespace.com/static/5c8fbfe87d0c914f25ad6fa4/t/64d58f7c7781440451ebc97f/1691717504034/chameleon%281%29.pdf

### Initial Pet Mapping Table

아래 표는 `C:\Users\petbl\Desktop\alarmpetgo_\svg`와 `rare` 폴더의 펫 이미지명을 기준으로 한 1차 매핑이다. 실제 앱 seed에서는 영어 slug와 한국어 표시명을 함께 저장한다.

| 펫 | 성향 키워드 | BIPI 매칭 | 앱 칭호 예시 |
|---|---|---|---|
| american shorthair | 안정적, 적응력, 균형, 다정함 | safe + calm + social | 느긋한 균형 탐험가 |
| bichon | 밝음, 호기심, 장난기, 사교성 | social + express + flow | 햇살 가득 리액션 요정 |
| chameleon | 관찰, 독립, 신중, 변화 적응 | solo + safe + calm | 조용한 색채 관찰자 |
| chihuahua | 당당함, 충성, 자기표현, 민첩함 | express + adventure + social | 작은 몸의 대담한 항해사 |
| maltese | 부드러움, 애정, 활기 | social + calm + express | 다정한 구름 동행자 |
| pomeranian | 활발함, 자신감, 표현력 | express + social + adventure | 반짝이는 무대 스타 |
| poodle | 영리함, 학습, 세련됨 | plan + social + aesthetic | 영리한 스타일 설계자 |
| retriever | 친화력, 안정감, 협력 | social + safe + calm | 모두의 든든한 친구 |
| ragdoll | 여유, 애정, 차분함 | calm + social + safe | 포근한 낮잠 수호자 |
| russian blue | 지성, 신중함, 루틴, 충성 | plan + solo + calm | 은빛 루틴 전략가 |
| siamese | 대화, 사회성, 호기심 | social + express + curious | 수다스러운 별빛 메신저 |
| rabbit | 사회성, 놀이, 탐색 | social + flow + curious | 통통 튀는 호기심 정원사 |
| hamster | 독립, 야행성, 저장, 은신 | solo + plan + safe | 밤의 조개 수집가 |
| turtle | 느긋함, 안정, 장기전 | safe + calm + plan | 천천히 이기는 철학자 |
| parrot | 표현, 소통, 화려함 | express + social + aesthetic | 컬러풀 토크 항해사 |
| goldfish/nemo | 흐름, 감상, 평온 | flow + calm + aesthetic | 물결 따라 쉬는 몽상가 |
| frog | 전환, 유연함, 장난기 | flow + adventure + curious | 점프하는 기분 탐험가 |
| lion/tiger | 리더십, 도전, 힘 | adventure + express + leader | 대담한 정글 선장 |
| deer/giraffe | 섬세함, 관찰, 우아함 | calm + safe + aesthetic | 고요한 숲의 감성가 |
| elephant/hippo | 안정, 보호, 느긋함 | safe + social + calm | 든든한 섬 지킴이 |

### Legendary Pet Handling

`legend` 폴더의 cosmic warrior, dragon, phoenix, unicorn 같은 이미지는 일반적인 "내 첫 펫"으로 바로 쓰기보다 특별 상태로 쓰는 편이 좋다.

권장 사용:

- 첫 부화: common/rare 기반의 친근한 펫
- 장기 성장: 같은 species의 rare 초상화 또는 aura 적용
- Legendary: `각성 스킨`, `시즌 수호자`, `테마 배경의 특별 출현 연출`

예:

- chameleon 성향 사용자가 우주/전설 테마를 장착하면 cosmic warrior chameleon 연출을 보여준다.
- bichon 성향 사용자가 별빛 테마를 장착하면 cosmic guardian bichon silhouette를 잠깐 등장시킨다.

이렇게 하면 전설 이미지의 강한 판타지 톤을 살리면서도, 앱의 기본 귀여운 펫 정체성을 해치지 않는다.

## 3. Theme Gacha Direction

가챠 대상은 펫이 아니라 `theme_skin`이다.

테마 예시:

| 희귀도 | 테마 예시 | 효과 |
|---|---|---|
| Common | 맑은 해변, 아늑한 방, 작은 정원 | 배경 이미지 변경 |
| Rare | 핑크빛 라군, 네온 카페, 비 오는 다락방 | 배경 + 작은 애니메이션 |
| Legendary | 우주 정거장, 심해 궁전, 별빛 왕국 | 배경 + 오라 + 전용 사운드/입장 연출 |

중복 처리:

- 같은 테마가 나오면 자동으로 theme level이 오른다.
- LV.1: 배경 획득
- LV.2: 작은 움직임/반짝임 추가
- LV.3: 펫 주변 오라 또는 배경 오브젝트 추가
- LV.5: 프로필 배지 또는 공유 카드 프레임 획득

테이블 용어도 기존 `card_*`에서 `pet_*`, `theme_*` 중심으로 점진적으로 바꾼다.

MVP 핵심 테이블:

- `pet_species`
- `pet_species_traits`
- `user_pet_state`
- `theme_skins`
- `user_theme_inventory`
- `theme_draw_pools`
- `theme_draw_pool_items`
- `theme_draw_history`
- `user_theme_pity`
- `theme_probability_versions`

카드라는 단어는 UI에서 최소화한다. 사용자는 `카드팩`보다 `테마 뽑기`, `새 세계 열기`, `펫의 방 바꾸기`를 더 직관적으로 이해한다.

테마 뽑기 구현 원칙:

- 테마 뽑기 화면의 확률표는 `theme_draw_pool_items.weight`에서 직접 계산한다.
- 확률 공시 API는 실제 draw pool과 같은 row를 읽어야 하며, 운영자가 별도 문서에 수동 입력하지 않는다.
- 확률이 바뀌면 `theme_probability_versions`에 이전/이후 weight snapshot, 변경 사유, 적용 시각을 기록한다.
- 10회 묶음 보정과 천장 규칙은 기본 확률과 분리해 "기본 확률", "보정 슬롯 확률", "천장 적용 조건"으로 나누어 표시한다.
- 클라이언트는 draw 요청 전 `request_id`를 생성해 로컬에 저장하고, 결과 수신과 히스토리 확인이 끝난 뒤에만 제거한다.

## 4. Asset Direction

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

## 5. Collection Model

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

## 6. Draw Economy

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

## 7. Fusion Economy

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

## 8. Retention Loop

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

## 9. UX Screens

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

## 10. Data Model

최신 MVP 데이터 모델은 `pet_*`와 `theme_*`를 기준으로 한다. 아래 `card_*` 모델은 이전 카드 수집안의 참고 설계이며, 실제 구현에서는 같은 보안/멱등성 원칙만 가져오고 이름과 역할은 테마 중심으로 바꾼다.

### pet_species

- `id uuid primary key`
- `slug text unique not null`
- `display_name text not null`
- `description text`
- `base_rarity text check (base_rarity in ('common', 'rare'))`
- `common_asset_url text not null`
- `rare_asset_url text`
- `legendary_asset_url text`
- `is_active boolean default true`
- `sort_order integer default 0`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### pet_species_traits

- `id uuid primary key`
- `species_id uuid references pet_species(id) on delete cascade`
- `trait_key text not null`
- `affinity_score numeric not null`
- `source_label text`
- `source_url text`
- `created_at timestamptz default now()`
- unique: `(species_id, trait_key)`

### user_pet_state

- `user_id uuid references profiles(id) primary key`
- `species_id uuid references pet_species(id)`
- `nickname text`
- `level integer default 1`
- `experience integer default 0`
- `bond integer default 0`
- `mood integer default 70`
- `energy integer default 70`
- `assigned_trait_snapshot jsonb default '{}'`
- `assigned_at timestamptz default now()`
- `updated_at timestamptz default now()`

### theme_skins

- `id uuid primary key`
- `slug text unique not null`
- `display_name text not null`
- `rarity text check (rarity in ('common', 'rare', 'legendary'))`
- `background_asset_url text not null`
- `preview_asset_url text`
- `effect_key text`
- `series_key text not null default 'base'`
- `is_limited boolean default false`
- `is_active boolean default true`
- `sort_order integer default 0`
- `created_at timestamptz default now()`

### theme_draw_pools

- `id uuid primary key`
- `slug text unique not null`
- `display_name text not null`
- `cost_shells integer default 0`
- `draw_count integer default 1`
- `guarantee_rule jsonb default '{}'`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `is_active boolean default true`
- `created_at timestamptz default now()`

### theme_draw_pool_items

- `pool_id uuid references theme_draw_pools(id) on delete cascade`
- `theme_skin_id uuid references theme_skins(id) on delete cascade`
- `weight integer not null check (weight > 0)`
- `is_guaranteed_candidate boolean default true`
- primary key: `(pool_id, theme_skin_id)`

### user_theme_inventory

- `user_id uuid references profiles(id) on delete cascade`
- `theme_skin_id uuid references theme_skins(id) on delete cascade`
- `level integer default 1`
- `duplicate_count integer default 0`
- `is_equipped boolean default false`
- `first_acquired_at timestamptz default now()`
- `updated_at timestamptz default now()`
- primary key: `(user_id, theme_skin_id)`

### theme_draw_history

- `id uuid primary key`
- `user_id uuid references profiles(id) on delete cascade`
- `pool_id uuid references theme_draw_pools(id)`
- `theme_skin_id uuid references theme_skins(id)`
- `rarity text not null`
- `cost_shells integer default 0`
- `idempotency_key text not null`
- `request_id uuid not null`
- `draw_index integer not null`
- `was_duplicate boolean default false`
- `inventory_level_after integer default 1`
- `pity_before integer not null`
- `pity_after integer not null`
- `created_at timestamptz default now()`
- unique: `(user_id, request_id, draw_index)`
- index: unique `(user_id, idempotency_key, draw_index)`

### user_theme_pity

- `user_id uuid references profiles(id) on delete cascade`
- `pool_id uuid references theme_draw_pools(id) on delete cascade`
- `legendary_miss_count integer default 0`
- `updated_at timestamptz default now()`
- primary key: `(user_id, pool_id)`

### theme_probability_versions

- `id uuid primary key`
- `pool_id uuid references theme_draw_pools(id)`
- `version integer not null`
- `weight_snapshot jsonb not null`
- `guarantee_rule_snapshot jsonb not null`
- `change_reason text not null`
- `effective_at timestamptz default now()`
- `created_at timestamptz default now()`
- unique: `(pool_id, version)`

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

## 11. Server RPC

모든 확률/재화/인벤토리 변경은 서버 RPC에서 처리한다. 클라이언트는 결과 표시만 한다.

공통 RPC 규칙:

- `auth.uid()`가 없으면 실패한다.
- 클라이언트에서 `user_id`를 받지 않는다.
- `p_request_id uuid`를 받거나 서버가 결정적 idempotency key를 만든다.
- `theme_draw_history.idempotency_key`, `card_draw_history.idempotency_key`, 또는 `card_fusion_history.idempotency_key`가 이미 있으면 기존 결과를 반환한다.
- 재화 차감과 인벤토리 증감은 같은 트랜잭션 안에서 처리한다.
- 인벤토리 차감 전에는 대상 row를 `FOR UPDATE`로 잠근다.
- 보유 수량은 절대 음수가 될 수 없다.

### update_profile_display

역할:

- 사용자가 직접 수정 가능한 profile 필드를 닉네임, 아바타 URL, bio, 선택 표시 항목으로 제한한다.
- `shell_balance`, `streak_count`, `total_participation_count`, `today_participation_count`는 이 RPC에서 입력받지 않는다.

보안:

- `profiles_update_own` broad update policy를 제거하거나, `authenticated`의 table-level UPDATE 권한을 회수한다.
- 필요한 경우 `GRANT UPDATE (nickname, avatar_url, bio, gender, age_range, home_island_id, selected_character_id) ON public.profiles TO authenticated`처럼 안전 컬럼만 허용한다.
- 더 단순한 MVP 구현은 클라이언트의 직접 update를 전부 막고 `update_profile_display` SECURITY DEFINER RPC 하나만 공개한다.

### assign_personality_pet

역할:

- 사용자의 `user_traits`를 BIPI vector로 정규화한다.
- `pet_species_traits`의 affinity vector와 비교해 가장 가까운 species를 선택한다.
- 이미 `user_pet_state`가 있으면 species를 임의 교체하지 않고 기존 pet 상태를 반환한다.
- 동률 후보가 많으면 후보 배열을 반환하고, 클라이언트가 선택 확정 RPC를 호출한다.

### claim_daily_theme_draw

역할:

- KST 기준 하루 1회 무료 테마 뽑기.
- `idempotency_key = daily_theme:{user_id}:{yyyy-mm-dd}`.
- 중복 호출 시 기존 `theme_draw_history` 결과를 반환한다.

### draw_theme_pack

입력:

- `p_pool_slug text`
- `p_draw_count integer`
- `p_request_id uuid`

처리:

1. `auth.uid()` 확인
2. `p_request_id` null/중복 여부를 `theme_draw_history`에서 먼저 확인
3. 이미 같은 request 결과가 있으면 조개 차감 없이 기존 draw rows를 반환
4. `theme_draw_pools` 활성 여부와 비용 계산
5. `apply_shell_delta`로 조개 비용 차감, idempotency key는 `theme_draw_cost:{user_id}:{p_request_id}`
6. `theme_draw_pool_items.weight` 기반 weighted random 수행
7. 10회 묶음 보정/천장 적용
8. `user_theme_inventory` upsert, 중복이면 `duplicate_count`와 `level` 자동 증가
9. `theme_draw_history`에 draw_index별 결과 기록
10. `user_theme_pity` 업데이트
11. 결과 배열 반환

재시도 규칙:

- 같은 `p_request_id`는 같은 테마 결과를 반환한다.
- 비용 차감은 한 번만 발생한다.
- 앱 종료/타임아웃 후 재시도해도 클라이언트는 같은 request id를 다시 보낸다.

### get_theme_probability_disclosure

역할:

- `theme_draw_pool_items.weight`를 합산해 실제 희귀도/개별 테마 확률을 계산한다.
- 10회 묶음 보정, 천장 조건, 현재 적용 중인 `theme_probability_versions.version`을 함께 반환한다.
- 프론트의 확률 정보 팝업과 설정 화면은 이 RPC 결과만 표시한다.

반환 항목:

- pool slug/name
- probability version
- rarity별 기본 확률
- theme별 기본 확률
- guarantee rule
- pity rule
- last effective date

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

## 12. Security and Fairness Rules

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

profile 쓰기 잠금 세부 원칙:

- 현재 broad policy `WITH CHECK (auth.uid() = id)`는 경제 필드 보호에 충분하지 않다.
- RLS policy만으로 `OLD.shell_balance = NEW.shell_balance` 같은 column immutability를 직접 표현하지 않는다. PostgreSQL RLS policy에는 리뷰 예시처럼 `OLD`를 쓰는 방식이 맞지 않는다.
- 우선순위 1안: `profiles`에 대한 클라이언트 직접 UPDATE를 제거하고 `update_profile_display` RPC만 공개한다.
- 우선순위 2안: table-level UPDATE 권한을 회수한 뒤 안전 컬럼에만 column-level UPDATE grant를 부여한다.
- 경제 필드 변경은 `submit_vote`, `claim_daily_checkin`, `care_avatar`, `draw_theme_pack` 같은 SECURITY DEFINER RPC와 `shell_ledger`를 통해서만 발생한다.

테마 뽑기 멱등성 세부 원칙:

- draw RPC 시작 직후 `theme_draw_history`에서 `(user_id, request_id)`의 기존 결과를 확인한다.
- 기존 결과가 있으면 비용 차감, 난수 선택, inventory update를 다시 실행하지 않는다.
- 새 요청이면 비용 차감 idempotency key와 draw history idempotency key를 같은 `p_request_id`에서 파생한다.
- 하나의 10회 묶음 결과는 draw_index별로 저장해 재조회 순서가 안정적이어야 한다.

난수:

- MVP에서는 PostgreSQL random 기반 weighted selection으로 충분하다.
- 단, 결과를 history에 즉시 기록하고, 확률표와 pool weights를 공개해 검증 가능하게 한다.
- 장기적으로 법적/감사 요구가 커지면 서버 Edge Function에서 seedable audit log를 추가한다.

## 13. Legal and Store Policy Guardrails

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
- Apple App Store의 loot box/randomized virtual item odds 공개 요구 검토.
- Google Play의 랜덤 가상 아이템/확률 공개 정책 검토.
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

## 14. Balance Recommendations

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

## 15. Asset Pipeline

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

## 16. MVP Phases

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

## 17. Open Risks

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

## 18. Reviewer Findings Incorporated

읽기 전용 리뷰어가 제시한 주요 지적과 반영 여부:

- 반영: 카드 경제 구현 전 `profiles.shell_balance` 직접 업데이트 가능성을 막는 security migration을 P0 전제 조건으로 추가했다.
- 반영: 모든 뽑기/합성 RPC는 `p_request_id` 기반 멱등성으로 설계하고, 같은 요청은 같은 결과를 반환해야 한다고 명시했다.
- 반영: 인벤토리는 `(user_id, variant_id)` 유니크, 수량 upsert, `FOR UPDATE` 차감, 음수 방지, `locked_quantity` 보호를 요구사항으로 넣었다.
- 반영: 확률 정보 공개, 변경 이력, 천장 포함 최종 확률 표시, 합성 확률 표시를 별도 UX로 명시했다.
- 반영: 미성년자 보호와 과몰입 억제를 유료화 전 체크가 아니라 기본 가드레일로 추가했다.
- 반영: 에셋은 `asset_id`, version, hash, cdn path를 가진 메타데이터와 배포/롤백 파이프라인이 필요하다고 정리했다.
- 반영: `economy_review_report.md` 검토 후 `profiles_update_own` broad policy가 실제 schema/migration과 맞는 P0 위험임을 재확인했고, 단순 RLS `OLD` 비교 SQL 대신 직접 UPDATE 제거 또는 column-level UPDATE grant/RPC 방식으로 수정 반영했다.
- 반영: 테마 뽑기 결과 자체도 `p_request_id`로 멱등해야 하므로 `theme_draw_history`, `draw_index`, 로컬 request id 보존 규칙을 추가했다.
- 반영: 확률 정보는 하드코딩 화면이 아니라 `theme_draw_pool_items.weight`와 `theme_probability_versions`에서 계산하는 `get_theme_probability_disclosure` RPC로 노출하도록 보강했다.

## 19. Recommended Next Step

바로 구현하지 말고, 다음 순서로 가는 것이 좋다.

1. `profiles_update_own` broad policy를 제거하거나 안전 컬럼/RPC 방식으로 좁히는 security migration을 먼저 만든다.
2. `update_profile_display` RPC를 추가해 닉네임, 아바타, bio 등 표시 필드만 수정한다.
3. 제공된 에셋을 `pet_species` 후보로 정리하고, common/rare/legend 이미지를 매칭한다.
4. 동물/품종 성향 자료를 `pet_species_traits` seed로 만든다.
5. BIPI 사용자 점수와 펫 affinity vector를 비교해 첫 펫을 부화시키는 `assign_personality_pet` RPC를 만든다.
6. `theme_skins`, `theme_draw_pools`, `theme_draw_pool_items`, `theme_draw_history`, `user_theme_inventory`, `user_theme_pity`, `theme_probability_versions`를 설계한다.
7. `get_theme_probability_disclosure` RPC를 먼저 만들어 실제 weight 기반 확률 표시를 검증한다.
8. 무료 출석 테마 뽑기 1회와 `p_request_id` 재시도 멱등성을 구현한다.
9. 중복 테마 자동 레벨업을 검증한다.
10. 그 다음 조개 기반 테마 뽑기와 전설 천장을 추가한다.

가장 중요한 원칙:

- 카드/테마 시스템은 밸런스 질문 참여를 강화해야 한다.
- 대표 펫은 성향 기반으로 유지한다.
- 확률은 숨기지 않고 보여준다.
- 유료화는 법적/정책 체크 전에는 넣지 않는다.
