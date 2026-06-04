# Balance Island 디자인 시스템 업그레이드 계획서

> **작성일:** 2026-06-04
> **작성자:** Claude Opus 4.8
> **문서 상태:** 기획 제안 (실행 대기)
> **인코딩:** UTF-8
> **북극성 시안:** 3종 (① 글래스 피드 / ② 3D 코지 아일랜드 / ③ 네온 별자리 마인드맵)
> **연관 문서:** [[AI-Sessions/wiki/design/visual-ui-guidelines|Visual UI Guidelines]], [trendy-self-discovery-upgrade-plan.md](2026-06-04-trendy-self-discovery-upgrade-plan.md)

---

## 0. 먼저: 이 환경의 디자인 도구 가용성 (정직한 진단)

사용자가 언급한 "피그마 / 스티치 / 플러그인 / MCP / skills"를 **실제로 이 작업 환경에서 쓸 수 있는지** 먼저 확인했습니다.

| 도구 | 현재 상태 | 비고 |
|---|---|---|
| **Figma MCP** | ❌ 미연결 | MCP 레지스트리 검색 결과 없음. 아래 §3에서 연결 방법 제시 |
| **Google Stitch** | ⚠️ 외부 웹도구 | MCP 아님. 브라우저로 사용 후 export 필요 |
| **이미지 생성(generate_image류)** | ✅ 사용 이력 있음 | timeline 2026-06-03~04에 3D 시안 에셋 생성에 사용됨 |
| **Claude Preview / Claude in Chrome MCP** | ✅ 사용 가능 | 이번 세션에서 시각 QA에 실제 사용함 |
| **문서 skills (pptx/docx)** | ✅ 사용 가능 | 디자인 핸드오프 문서/덱 산출에 활용 가능 |

> **결론:** "Figma에서 바로 코드로" 자동화는 지금 당장은 불가(커넥터 미연결). 대신 **이미지 생성 + Preview MCP 시각 루프 + 토큰화된 코드 디자인 시스템**으로도 시안 수준을 충분히 끌어올릴 수 있습니다. Figma/Stitch는 "연결하면 가속되는 옵션"으로 §3에 설계해 둡니다.

---

## 1. 디자인 북극성: 3개 시안 해부

각 화면의 "이것이 있어야 시안처럼 보인다" 시그니처 요소를 분해합니다.

### ① 글래스 피드 (Home / 밸런스 카드)
- 상단 **Level/XP 헤더**: `Level 12 · Cozy Life · 78|425`, 우상단 아바타 + Review 배지.
- 배경: 파스텔 보케(bokeh) + 떠다니는 **컨페티 이모지**(😊😍💜⭐).
- 카드: **글래스모피즘 VS 레이아웃**, 좌우 대칭 3D 음식 에셋(해변 위 치킨 vs 야자수 빙수), 중앙 세로 구분선 + `VS` 배지.
- 결과 바: 단일 가로 트랙 `55% ─────○──── 45%` + 골드 강조, `14,310 votes`.
- CTA: 둥근 알약형 **VOTE NOW**.
- 하단 탭: Home·Discover·Play·Social·Profile (활성 탭 언더라인).

### ② 3D 코지 아일랜드 (Home / 섬)
- 배경: **석양 바다** 그라데이션 + 잔물결 반짝임.
- 상단 글래스 패널 `MY ISLAND` + `MOOD 92% / ENERGY 85%` 듀얼 게이지.
- 카드 2개: `PET MOOD: VERY HAPPY (92/100)` / `ENERGY LEVEL: READY FOR ADVENTURE (85/100)`.
- 중앙: **3D 골든 리트리버 + 입체 섬**(웅덩이, 야자수, 반짝이 파티클).
- 하단: `SHELL CURRENCY 🐚 2,840` / `TREASURE CHEST 💎 3 Gems` 대칭 배지.
- 전체를 감싸는 **폰 목업형 글래스 프레임**.

### ③ 네온 별자리 마인드맵 (인사이트 / Your Starry Mind)
- 배경: **딥 스페이스**(성운 + 별 + 달 + Orion/Draco 별자리 라벨).
- 중앙: 사용자 아바타 `Sarah's Universe`.
- 3개 클러스터: `FOOD & HEALTH`(주황) / `LIFE & BALANCE`(민트) / `ROMANCE & CONNECTIONS`(자홍) — 각 **네온 글로잉 노드** + 위성 노드.
- **근거 콜아웃**: "Connected via 'Consistent Hydration' — Q: How much water do you drink daily? (8/10 flow)" 처럼 노드에 질문/증거 툴팁.
- 상단 **Map View 토글**, 노드 펄싱 애니메이션, `N traits connected` 라벨.

---

## 2. 현재 디자인 시스템 감사 + 갭 분석

현재 토큰은 `src/theme/`에 이미 3-surface 골격을 갖춤(양호):

```
styles.ts   → THEME (colors.backgrounds.{feed,island,insight}, ui glass, shadows.{glow,glass}, typography, shapes)
surfaces.ts → SURFACES (radius, border, background, accent)
motion.ts   → MOTION (duration, scale, particle 절제 정책: maxActive 12)
```

| 영역 | 현재 | 시안 목표 | 갭 |
|---|---|---|---|
| 컬러 surface | feed/island/insight 3종 배열 존재 | 동일 3 surface | ✅ 구조 OK, **명명·확장 필요** |
| 그라데이션 | 배열만 있고 토큰화 약함 | 석양·보케·성운 | ⚠️ gradient 토큰 부재 |
| 글로우/네온 | `shadows.glow` 단일 | 카테고리별 네온(주황/민트/자홍) | ⚠️ 다색 글로우 토큰 필요 |
| Elevation | glass/glow 2종 | 3D 깊이 위계 | ⚠️ elevation 스케일 부재 |
| 타이포 | 5종(kicker~caption) | XP/배지/스탯 변형 | ⚠️ display/stat/badge 누락 |
| 모션 | 절제 정책 양호 | 펄싱·플로팅·컨페티 | ✅ 정책 유지, 토큰만 보강 |
| 아이콘/에셋 | 3D 에셋 일부 번들 | 풀세트 3D + 통화 아이콘 | ⚠️ 에셋 커버리지 |
| 다크모드 | insight만 다크 | surface별 고정 테마 | ⚠️ 시맨틱 토큰 일원화 |

> **핵심 진단:** 토큰 골격은 이미 있으나 ① **그라데이션·다색 글로우·elevation** 토큰이 비어 있고 ② surface 테마가 화면마다 하드코딩으로 흩어져 있습니다. 여기를 **시맨틱 토큰 1계층**으로 모으면 시안 일관성과 유지보수가 동시에 좋아집니다.

---

## 3. 도구 파이프라인 (연결하면 가속되는 옵션 포함)

### 3-A. 지금 당장 가능한 파이프라인 (커넥터 없이)
```
[generate_image] 3D 에셋·시안 변형 생성
        │
        ▼
[코드 토큰 시스템] src/theme/* 확장 (이 계획 §4)
        │
        ▼
[Preview MCP / Claude in Chrome] 실기 시각 QA 루프 (이번 세션에서 검증된 방식)
        │
        ▼
[expo export 빌드 게이트] 번들 무결성 확인
```

### 3-B. Figma 연결 시 (권장 업그레이드)
1. **Figma MCP 연결** — 두 옵션:
   - 공식 *Figma Dev Mode MCP* (Figma 데스크톱 → Preferences → Enable Dev Mode MCP Server), 또는
   - *Framelink Figma MCP*(오픈소스, `figma-developer-mcp`) — 파일 키 + 토큰으로 디자인 노드를 읽어 코드/토큰 추출.
2. **Tokens Studio for Figma**(플러그인)로 Figma Variables를 디자인 토큰 JSON으로 export.
3. **Style Dictionary**로 토큰 JSON → `src/theme/*.ts` 자동 생성(단일 진실원).
4. Figma 컴포넌트 → 코드 매핑 시 MCP로 노드 스펙(간격·반경·색)을 그대로 가져옴.

### 3-C. Google Stitch 활용
- Stitch(stitch.withgoogle.com)로 "글래스 피드/코지 아일랜드/네온 마인드맵" 프롬프트 기반 UI 변형 빠르게 탐색 → 마음에 드는 안을 **Figma로 export** → 3-B 파이프라인 합류. (Stitch는 MCP가 아니므로 사람이 브라우저로 수행)

> **권장 순서:** 우선 3-A로 토큰 시스템부터 정리(즉시 효과) → 이후 팀이 Figma를 쓰면 3-B로 "디자인=코드" 단일 진실원 구축.

---

## 4. 토큰 아키텍처 업그레이드 (실행 핵심)

현재 `src/theme/`를 **시맨틱 토큰 1계층**으로 확장합니다. 비파괴적(기존 키 유지 + 추가).

### 4-1. gradients.ts (신규)
```ts
export const GRADIENTS = {
  feedBokeh: ['#FFF0F5', '#E6F3FF', '#F0E6FF', '#FFFFE0'],   // 파스텔 보케
  islandSunset: ['#fed7aa', '#fdba74', '#38bdf8', '#0ea5e9'], // 석양→바다
  insightNebula: ['#070b19', '#0b132b', '#1c2541']            // 딥 스페이스
} as const;
```

### 4-2. 다색 네온 글로우 토큰 (styles.ts shadows 확장)
```ts
glowByCluster: {
  food:    { shadowColor: '#f59e0b', shadowRadius: 16, shadowOpacity: 0.5 },
  life:    { shadowColor: '#14b8a6', shadowRadius: 16, shadowOpacity: 0.5 },
  romance: { shadowColor: '#d946ef', shadowRadius: 16, shadowOpacity: 0.5 }
}
```
(웹은 `InsightGraphCanvas`의 SVG `feGaussianBlur` 필터와 매칭. 이미 네온 구현이 있으므로 색만 토큰화)

### 4-3. elevation 스케일 (3D 깊이 위계)
```ts
elevation: { e1: '...', e2: '...', e3: '...' } // 카드/패널/플로팅 3단계
```

### 4-4. 타이포 변형 추가
`display`(레벨/Wrapped 헤드라인), `stat`(92/100 게이지 숫자), `badge`(LV·rarity) 추가.

### 4-5. surface 테마 일원화
화면별 하드코딩 색을 `THEME.surface('feed'|'island'|'insight')` 헬퍼로 모아, 컴포넌트는 surface만 선택.

---

## 5. 컴포넌트 업그레이드 백로그 (시안 → 코드 매핑)

| # | 컴포넌트 | 현재 파일 | 시안 갭 | 우선순위 |
|---|---|---|---|---|
| D1 | XP/레벨 헤더 | `app/(tabs)/index.tsx` 헤더 | Level·Cozy Life·78|425·아바타 배지 부재 | High |
| D2 | 밸런스 카드 | `components/feed/BalanceCard.tsx` | 결과 바 골드 강조·VS 배지 정교화·보케 배경 | High |
| D3 | 컨페티 이모지 레이어 | `app/(tabs)/index.tsx` particles | 진입 시 상시 떠다니는 앰비언트 컨페티 | Medium |
| D4 | 섬 듀얼 게이지/통화 배지 | `app/(tabs)/island.tsx` | MOOD/ENERGY 게이지·Gem 통화(현재 "준비 중") | High |
| D5 | 3D 펫/섬 에셋 깊이 | `assets/`, island hero | 파티클·플로팅·그림자 강화 | Medium |
| D6 | 네온 별자리 캔버스 | `components/insight/InsightGraphCanvas.tsx` | 클러스터 라벨(FOOD&HEALTH 등)·근거 콜아웃·Map View 토글·별자리 배경 라벨 | High |
| D7 | 중앙 "내 우주" 아바타 노드 | InsightGraphCanvas | 사용자 아바타 중심 노드 | Medium |
| D8 | 하단 탭바 | `app/(tabs)/_layout.tsx` | 아이콘·활성 인디케이터 통일(현 5탭 라벨 정합) | Medium |
| D9 | 디자인 토큰 시스템 | `src/theme/*` | §4 토큰 확장 | **선행(Foundation)** |

> **순서:** D9(토큰) → D1/D2/D4/D6(High, 시안 시그니처) → 나머지.

---

## 6. 실행 단계 + 검증 루프

```
Step 1. D9 토큰 확장 (gradients/glow/elevation/typo/surface) — 비파괴적
Step 2. High 컴포넌트(D1·D2·D4·D6)를 토큰 기반으로 리팩토링
Step 3. generate_image로 부족한 3D 에셋·통화 아이콘 보강 (S1 자체호스팅과 함께)
Step 4. Preview MCP로 화면별 시각 QA (mobile 375x812) — DOM/스크린샷
Step 5. expo export 빌드 게이트 + typecheck + validate:wiki/pet-assets
Step 6. (옵션) Figma MCP 연결 후 토큰을 Figma Variables ↔ Style Dictionary로 양방향 동기화
```

각 단계는 기존 검증 3종(`typecheck`/`validate:wiki`/`validate:pet-assets`) + 빌드를 통과해야 머지.

---

## 7. 가드레일

- **모션 절제 정책 유지**(visual-ui-guidelines): `MOTION.particle.maxActive=12`, 과한 애니메이션 금지. 컨페티/펄싱은 앰비언트 수준으로.
- **성능**: SVG 네온 글로우는 노드 수 상한 + `react-native-skia`는 60fps가 꼭 필요한 곳만(계획서 §3-3 참조).
- **접근성**: 글래스 위 텍스트 대비비(WCAG AA), 게이지/배지에 텍스트 라벨 병기, 색만으로 정보 전달 금지(네온 색맹 대비 라벨).
- **다크/라이트**: insight=항상 다크, feed/island=라이트로 surface 고정. 시맨틱 토큰으로 일관.
- **저작권/에셋**: 외부 이미지 대신 generate_image/자체 에셋(연계: research.md S1 자체호스팅).

---

## 8. 리스크

| 리스크 | 대응 |
|---|---|
| Figma MCP 미연결로 자동화 불가 | 3-A(코드 토큰+Preview)로 선행, Figma는 후속 옵션 |
| RN-Web 애니메이션 루프로 스크린샷 캡처 지연 | DOM 텍스트/inspect 기반 QA 병행(이번 세션 검증됨) |
| 시안의 영어 카피·통화(Gem) vs 현 한글·"준비 중" | 카피/통화 정책을 먼저 확정 후 디자인 반영 |
| 토큰 리팩토링 회귀 | 비파괴적 추가 우선, 화면별 점진 전환 |

---

## 9. 한 페이지 요약

1. **지금 환경엔 Figma/Stitch MCP가 없다** → 코드 토큰 시스템 + 이미지 생성 + Preview MCP 루프로 선행, Figma는 연결 시 가속 옵션.
2. **토큰 골격은 이미 있다** → 비어 있는 **그라데이션·다색 글로우·elevation·타이포 변형**을 채우고 surface를 일원화(D9, 선행).
3. **시안 시그니처 4개부터**: XP 헤더(D1)·밸런스 카드 골드 결과바(D2)·섬 게이지/Gem(D4)·네온 클러스터+근거 콜아웃(D6).
4. **검증 루프**: 토큰→리팩토링→에셋→Preview QA→빌드 게이트.
5. **가드레일 유지**: 모션 절제·접근성 대비·자체 에셋.

---

## 부록 A: 시안별 디테일 체크리스트

**① 피드**: [ ] Level/XP 헤더 [ ] 보케 배경 토큰 [ ] 앰비언트 컨페티 [ ] VS 배지 [ ] 골드 결과바 [ ] VOTE NOW 알약 버튼
**② 섬**: [ ] 석양 그라데이션 토큰 [ ] MY ISLAND 글래스 패널 [ ] MOOD/ENERGY 듀얼 게이지 [ ] PET MOOD/ENERGY 카드 [ ] 3D 펫 플로팅 [ ] Shell/Gem 통화 배지
**③ 인사이트**: [ ] 성운 배경+별자리 라벨 [ ] 중앙 "내 우주" 아바타 [ ] 3 클러스터 네온(주황/민트/자홍) [ ] 근거 콜아웃 툴팁 [ ] Map View 토글 [ ] 노드 펄싱

## 부록 B: 참조

- 기존 디자인 가이드: [[AI-Sessions/wiki/design/visual-ui-guidelines|Visual UI Guidelines]]
- Figma Dev Mode MCP: https://help.figma.com (Dev Mode MCP Server)
- Framelink Figma MCP (오픈소스): https://github.com/GLips/Figma-Context-MCP
- Tokens Studio for Figma: https://tokens.studio
- Style Dictionary: https://amzn.github.io/style-dictionary
- Google Stitch: https://stitch.withgoogle.com

> 이 문서는 UTF-8로 인코딩되어 있습니다.
</content>
