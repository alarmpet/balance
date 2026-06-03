# [Premium UI/UX Upgrade Plan] Balance Island 시안 100% 매칭 고도화

사용자가 제시한 고품질 3D/글래스모피즘/글로잉 시안 3종(Cozy Island, Starry Mind, Feed Premium Card)의 몽환적이고 입체적인 미감을 실제 React Native / React Native Web 코드베이스에 100% 완벽하게 매칭하여 구현하기 위한 상세 업그레이드 계획서입니다. 

기존의 단순하고 플랫한 스타일에서 탈피하여, 에이전트의 이미지 생성 스킬(skills)로 실감 나는 3D 에셋을 직접 도출하고, CSS 글래스모피즘 효과 및 SVG 네온 글로우 필터를 정밀 수정하여 시안과 동일한 'Premium Look & Feel'을 완성합니다.

---

## User Review Required

> [!IMPORTANT]
> **1. AI 이미지 생성 스킬(skills)을 활용한 3D 에셋 도출**
> 시안의 입체적인 톤을 살리기 위해, 에이전트가 직접 `generate_image` 툴을 사용하여 아래의 3D 그래픽 에셋들을 생성하고 프로젝트 `assets/` 경로에 탑재합니다.
> - **3D Cozy Island**: 석양 하늘 아래 3D 스타일로 구현된 떠 있는 섬과 귀여운 리트리버 강아지 (`assets/cozy-island-retriever.png`)
> - **3D Feed Options**: 바닷가 모래사장 위의 바삭한 후라이드 치킨 (`assets/feed/fried-chicken.png`), 야자수 아래의 시원한 팥빙수 (`assets/feed/shaved-ice.png`)
> - **3D Icons**: 입체적인 핑크 조개 (`assets/icons/shell.png`), 보석이 담긴 반짝이는 상자 (`assets/icons/gem-chest.png`)
>
> **2. 크로스플랫폼 글래스모피즘(Glassmorphic) 최적화**
> 모바일 네이티브 환경(iOS/Android)과 웹 환경 모두에서 동일한 frosted glass 질감을 낼 수 있도록 `GlassView` 컴포넌트의 테두리 하이라이트(1px white border) 및 그림자 섀도우를 시안 수준으로 강화합니다. 웹에서는 `backdropFilter: 'blur(24px) saturate(120%)'`를 주입합니다.

---

## Open Questions

> [!WARNING]
> * **질문**: 현재 웹 전용으로 구현되어 있는 배경 블러 효과(`filter: blur`) 외에, 모바일 기기에서의 성능을 위해 SVG 필터의 `stdDeviation` 값을 5~6 수준으로 고정하려 합니다. 혹시 모바일 전용 빌드 시 프레임 드랍이 우려된다면 일부 네온 글로우 효과를 이미지 배경 레이어로 대체할 수도 있습니다. 시안과 동일한 100% 실시간 렌더링 글로우 필터 방식을 그대로 고수해도 될까요?

---

## Proposed Changes

### 1. [Assets] 3D 에셋 및 아이콘 생성
에이전트의 이미지 생성 스킬을 활용하여 고품질의 3D 실감형 일러스트 에셋을 도출하고 이를 프로젝트에 내장합니다.

#### [NEW] [cozy-island-retriever.png](file:///c:/Users/petbl/balance/balance-island/assets/cozy-island-retriever.png)
- 시안 1의 Cozy Island와 골든 리트리버 강아지 일러스트가 포함된 3D 펫 배경 에셋.

#### [NEW] [fried-chicken.png](file:///c:/Users/petbl/balance/balance-island/assets/feed/fried-chicken.png)
- 시안 3의 A안 투표 옵션용 3D 후라이드 치킨 에셋.

#### [NEW] [shaved-ice.png](file:///c:/Users/petbl/balance/balance-island/assets/feed/shaved-ice.png)
- 시안 3의 B안 투표 옵션용 3D 팥빙수 에셋.

#### [NEW] [shell.png](file:///c:/Users/petbl/balance/balance-island/assets/icons/shell.png)
- 하단 재화 배지용 3D 핑크 조개 아이콘 에셋.

#### [NEW] [gem-chest.png](file:///c:/Users/petbl/balance/balance-island/assets/icons/gem-chest.png)
- 하단 보물 상자 배지용 3D 보석 상자 아이콘 에셋.

---

### 2. [Theme] 스타일 및 디자인 시스템 고도화
시안의 색감과 그림자, 둥근 모서리를 정교한 토큰으로 정의합니다.

#### [MODIFY] [styles.ts](file:///c:/Users/petbl/balance/balance-island/src/theme/styles.ts)
- **Gradients**: 피드 화면의 파스텔 톤 4각 그라데이션 및 밤하늘 성운 그라데이션 컬러 추가.
- **Glass Panel**: 더욱 선명한 Frosted 효과를 위해 투명도(`rgba(255,255,255,0.45)`) 및 경계선 하이라이트(`rgba(255,255,255,0.5)`) 값 조정.
- **Typography**: 시안에서 사용된 현대적이고 세련된 서체 비율(Outfit/Inter 느낌의 Boldness 및 자간 조정)에 맞추어 스타일링 수정.

---

### 3. [Feed] 글래스모피즘 투표 피드 화면 업그레이드
시안 3(Feed Vote Card)과 완벽하게 일치하는 구조로 리팩토링합니다.

#### [MODIFY] [BalanceCard.tsx](file:///c:/Users/petbl/balance/balance-island/src/components/feed/BalanceCard.tsx)
- **레이아웃**: 좌우 옵션 카드가 대칭으로 배치되고 가운데 세로 점선과 `VS` 동그라미가 깔끔하게 정렬되도록 조정.
- **이미지 및 텍스트**: 생성된 3D 치킨/빙수 에셋을 카드 전체 가비지를 채우도록 `contentFit="cover"` 처리하고 하단에 "Outfit, Semi-Bold, 18px" 형식의 텍스트 배치.
- **득표 결과 바**: 투표 후/전 상태에 따라 하단에 `VS` 골드 배지가 좌측에 부착된 단일 가로 트랙 프로그레스 바로 통합. 백분율 표기 및 표 수 텍스트 배치.
- **VOTE NOW 버튼**: 하단 중앙에 시안과 동일한 둥근 흰색 유리 질감의 "VOTE NOW" 버튼 추가.

#### [MODIFY] [index.tsx](file:///c:/Users/petbl/balance/balance-island/src/app/%28tabs%29/index.tsx)
- **헤더**: 상단 좌측의 "Balance Island" 로고 텍스트 및 우측의 톱니바퀴, 돋보기, 프로필 사진 엠블럼 구조 정렬.
- **상태 영역**: `Level 12 Cozy Life` 및 스태츠 정보가 담긴 반투명 글래스 요약 바의 패딩과 테두리를 시안과 동일하게 가공.
- **배경 스폿**: 배경에 4개의 색상 서클이 블러되어 몽환적으로 번져 있는 효과(`filter: blur(80px)`)를 완벽히 구현.

---

### 4. [Island] 3D Cozy Island & 펫 성장 화면 업그레이드
시안 1(Cozy Island)과 완벽하게 일치하는 구조로 리팩토링합니다.

#### [MODIFY] [island.tsx](file:///c:/Users/petbl/balance/balance-island/src/app/%28tabs%29/island.tsx)
- **My Island 바**: 상단에 배치된 조그만 섬 엠블럼 로고, `MOOD: 92%`, `ENERGY: 85%` 게이지 바가 가로로 깔끔하게 나열되는 글래스모피즘 요약 헤더 구현.
- **더블 스태츠 카드**: 좌우 배치된 `PET MOOD` (VERY HAPPY, 92/100) 및 `ENERGY LEVEL` (READY FOR ADVENTURE, 85/100) 박스를 시안의 파스텔 그린/오렌지 색상 및 폰트 크기로 개편.
- **3D Hero 아일랜드**: 중앙에 생성된 3D 리트리버 아일랜드 일러스트(`cozy-island-retriever.png`)를 배치하고, 머리 위에 둥둥 떠다니는 하트 애니메이션 및 펄싱 연출.
- **재화 배지**: 하단에 3D 핑크 조개와 보석 상자 아이콘이 글래스 패널 내부에 숫자와 함께 가로 정렬 배치된 배지 모듈 구성.

---

### 5. [Insight] Starry Mind (Neon Constellation) 마인드맵 업그레이드
시안 2(Your Starry Mind)와 완벽하게 일치하는 밤하늘 테마로 리팩토링합니다.

#### [MODIFY] [InsightGraphCanvas.tsx](file:///c:/Users/petbl/balance/balance-island/src/components/insight/InsightGraphCanvas.tsx)
- **우주 배경**: 어두운 심연의 밤하늘 배경 위에 반짝이는 별자리 은하수 스폿 배경과 우상단의 보름달 그래픽 배치.
- **네온 글로우 링**: SVG Defs 필터의 흐림 강도를 조절하여 `FOOD & HEALTH` (주황), `LIFE & BALANCE` (청록), `ROMANCE & CONNECTIONS` (자홍) 카테고리 링이 눈부시게 빛나는 연출.
- **별자리 연결선**: 주변 세부 노드들을 얇고 흐릿한 점선(Dashed connection lines)으로 이어 별자리 형상 극대화.
- **중앙 프로필**: 중앙에 빛나는 별자리 코어 대신 유저 프로필 사진 엠블럼과 이를 감싸는 우주 먼지 오로라 링 배치.
- **상세 말풍선**: 노드 선택 시 캔버스 내부에 공중 부양된 형태의 툴팁 말풍선("Connected via Consistent Hydration...")을 띄워 상세 성향 근거 제공.

---

## Verification Plan

### Automated Tests
- `npm run typecheck`를 실행하여 새로이 추가되는 3D 에셋 임포트 및 컴포넌트 간의 타입 정합성 검증.
- `npm run validate:wiki`를 통해 신규 작성한 업그레이드 계획서의 위키 링크 정합성 통과 검사.

### Manual Verification
- **웹 서버 실행 및 브라우저 확인**:
  ```powershell
  npm run web
  ```
  명령어로 Expo 웹 서버를 구동한 뒤 브라우저를 띄워,
  1. 피드 화면의 그라데이션 백그라운드 스폿 및 후라이드 치킨 VS 팥빙수 카드의 대칭 여부 검증.
  2. 섬 화면의 3D 리트리버 아일랜드 펄싱 애니메이션 및 게이지 수치 싱크 확인.
  3. 마인드맵의 네온 발광 링이 웹 그래픽 가속 상태에서 60FPS 모션 버벅임 없이 렌더링되는지 확인.
- **반응형 레이아웃 검사**: 브라우저 너비를 모바일 가로폭(360px ~ 420px)하고 데스크톱 가로폭으로 가변 조절하여 글래스모피즘 박스들의 정렬이 깨지지 않고 유연하게 축소되는지 검사.
