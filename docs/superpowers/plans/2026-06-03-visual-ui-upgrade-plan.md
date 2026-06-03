# Visual UI Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 구현된 Balance Island의 Choice Echo, 오늘의 발견, 섬 3모드, 확률 공개 UI를 더 선명하고 감성적인 자기발견 경험으로 보이게 만든다.

**Architecture:** 기존 Expo Router, React Native `StyleSheet`, `Animated`, `react-native-svg`, `expo-image`, `@expo/vector-icons`만 우선 사용한다. 새 애니메이션 라이브러리나 Lottie는 성능/번들 크기 검증 전에는 추가하지 않는다.

**Tech Stack:** Expo SDK 51, React Native 0.74, TypeScript, Zustand, Supabase, `react-native-svg`, `d3-hierarchy`, existing `src/theme/styles.ts`.

---

## 검토한 자료

- `C:\Users\petbl\.gemini\antigravity\brain\555dbaae-34db-475b-b7e5-31b02103f0b3\2026-06-03-visual-ui-upgrade-plan.md`
- `AI-Sessions/wiki/projects/balance-island-overview.md`
- `research.md`
- `CLAUDE.md`
- `docs/product/deep-research-upgrade-decisions.md`
- `docs/2026-06-03-deep-research-product-upgrade-review.md`
- `docs/superpowers/plans/2026-06-03-deep-research-product-upgrade.md`
- `src/theme/styles.ts`
- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/island.tsx`
- `src/components/feed/ChoiceEchoSheet.tsx`
- `src/components/insight/InsightGraphCanvas.tsx`
- `package.json`

## 문제점과 정정

1. 원본 계획은 “Glassmorphism, dynamic sky, particle, glowing graph”가 모두 P1처럼 보인다. 실제 제품 리스크 기준으로는 자기발견 루프를 흐리거나 모바일 성능을 해칠 수 있어 단계 분리가 필요하다.
2. `generate_image`로 시안을 먼저 만드는 것은 좋지만, 현재 앱에는 이미 `src/theme/styles.ts`, Choice Echo, 오늘의 발견, 섬 3모드가 구현되어 있다. 시안 작업은 구현 전 필수 단계가 아니라, 방향성 검증용 보조 단계로 둔다.
3. `Lottie-like`, 물리 드래그, 노드 관성, 전체 glow graph는 현재 dependency에 없다. 새 라이브러리 추가 없이 구현 가능한 범위와 보류 범위를 나눈다.
4. 지나친 둥근 모서리와 카드 중첩은 운영형 앱 UX를 흐릴 수 있다. 큰 화면 구조는 섹션/밴드 중심으로 정리하고, 카드 안에 또 카드가 들어가는 구조는 줄인다.
5. 현재 palette가 cyan/teal에 치우쳐 있다. feed, island, insight, decorate의 역할별 accent를 나누되, 보라/파랑 그라데이션 일변도는 피한다.
6. `src/app/(tabs)/index.tsx`의 `onOpenComments`가 `questionId`를 사용자 Alert에 노출한다. UI 고도화 전에 제거해야 한다.
7. particle animation은 재미는 있지만 `Math.random()` 기반 위치와 개수 제한이 약하다. 최대 동시 개수, pointerEvents, reduced-motion 대응을 명시한다.
8. insight graph의 glow/dash animation은 매력적이지만, 기본 섬 화면에서는 과밀한 graph가 아니라 local graph preview만 유지해야 한다.

## 채택할 디자인 원칙

- **Self-discovery first:** 모든 시각 효과는 “내 선택이 섬/펫/지도에 남는다”를 더 잘 보이게 해야 한다.
- **Low-cost wow:** 첫 업그레이드는 CSS-like surface, light shadow, SVG stroke, RN Animated로 가능한 효과만 쓴다.
- **Readable before dreamy:** 글자 대비, 버튼 터치 영역, 작은 화면 줄바꿈을 애니메이션보다 우선한다.
- **Motion as feedback:** 움직임은 투표, 반응, 펫 케어, 테마 획득처럼 사용자의 행동 결과에만 붙인다.
- **No diagnosis look:** 병원 검사표, MBTI 결과표, 과도한 등급표처럼 보이는 UI는 피한다.

## 파일 구조

### Create

- `src/theme/motion.ts`: animation duration, easing, reduced-motion fallback constants.
- `src/theme/surfaces.ts`: glass-like surface helper values, borders, shadows, role-based accents.
- `AI-Sessions/wiki/design/visual-ui-guidelines.md`: 이 계획의 장기 디자인 원칙 요약.

### Modify

- `src/theme/styles.ts`: existing `THEME`를 유지하되 surface/motion token을 import하게 정리한다.
- `src/app/(tabs)/index.tsx`: comment alert 정리, particle cap, feed background band 적용.
- `src/components/feed/ChoiceEchoSheet.tsx`: existing sheet를 glass surface와 safer button hierarchy로 정리한다.
- `src/app/(tabs)/island.tsx`: dynamic sky를 static token 기반으로 먼저 적용하고, 카드 중첩을 줄인다.
- `src/components/island/TodayDiscoveryCard.tsx`: discovery card를 섬의 첫 시각 신호로 강화한다.
- `src/components/insight/InsightGraphCanvas.tsx`: default graph는 glow보다 가독성과 선택 상태 강조를 우선한다.

### Do Not Modify

- 새 유료 IAP, NFT, 거래 기능은 추가하지 않는다.
- `react-native-reanimated`, `lottie-react-native`, gesture 라이브러리는 이 계획에서 추가하지 않는다.
- `AI-Sessions/raw/` 자료는 수정하지 않는다.
- 현재 작업 트리의 기존 기능 구현 변경은 이 계획서 작성 작업에서 되돌리지 않는다.

## Task 1: Theme Token 정리

**Files:**
- Create: `src/theme/motion.ts`
- Create: `src/theme/surfaces.ts`
- Modify: `src/theme/styles.ts`

- [ ] **Step 1: Create motion tokens**

Create `src/theme/motion.ts`:

```ts
export const MOTION = {
  duration: {
    press: 90,
    sheet: 220,
    particle: 1100,
    petIdle: 1800
  },
  scale: {
    pressed: 0.97,
    resting: 1
  },
  particle: {
    maxActive: 12,
    riseMin: 220,
    riseMax: 360
  }
} as const;
```

- [ ] **Step 2: Create surface tokens**

Create `src/theme/surfaces.ts`:

```ts
export const SURFACES = {
  radius: {
    panel: 18,
    sheet: 22,
    pill: 999
  },
  border: {
    light: 'rgba(255, 255, 255, 0.72)',
    cyan: '#bae6fd',
    teal: '#99f6e4',
    violet: '#ddd6fe'
  },
  background: {
    feed: '#e9fbf6',
    island: '#ecfeff',
    panel: 'rgba(255, 255, 255, 0.88)',
    softPanel: '#f8fafc',
    darkPanel: 'rgba(15, 23, 42, 0.72)'
  },
  accent: {
    discovery: '#0f766e',
    map: '#0ea5e9',
    decorate: '#7c3aed',
    reward: '#f59e0b',
    danger: '#be123c'
  }
} as const;
```

- [ ] **Step 3: Update `src/theme/styles.ts`**

Keep current exports but import the new tokens:

```ts
import { MOTION } from './motion';
import { SURFACES } from './surfaces';

export const THEME = {
  motion: MOTION,
  surfaces: SURFACES,
  colors: {
    backgrounds: {
      feed: ['#e9fbf6', '#f0fdfa'],
      island: ['#ecfeff', '#e0f2fe'],
      insight: ['#0f172a', '#1e293b']
    },
    accent: SURFACES.accent,
    ui: {
      glassBackground: SURFACES.background.panel,
      glassBorder: SURFACES.border.light,
      darkGlassBackground: SURFACES.background.darkPanel,
      darkGlassBorder: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textDarkPrimary: '#f8fafc',
      textDarkSecondary: '#cbd5e1'
    }
  },
  shadows: {
    glow: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 5
    },
    glass: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4
    }
  },
  typography: {
    kicker: { fontSize: 12, fontWeight: '900' as const, letterSpacing: 0, textTransform: 'uppercase' as const },
    heading: { fontSize: 28, fontWeight: '900' as const, lineHeight: 36 },
    title: { fontSize: 20, fontWeight: '900' as const, lineHeight: 26 },
    body: { fontSize: 14, fontWeight: '600' as const, lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 18 }
  },
  shapes: {
    borderRadiusCard: SURFACES.radius.panel,
    borderRadiusPill: SURFACES.radius.pill,
    borderRadiusSheet: SURFACES.radius.sheet
  }
};
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected: `Exit 0`.

## Task 2: Feed 화면의 즉각 반응 정리

**Files:**
- Modify: `src/app/(tabs)/index.tsx`
- Modify: `src/components/feed/BalanceCard.tsx`
- Modify: `src/components/feed/ChoiceEchoSheet.tsx`

- [ ] **Step 1: Remove question id from comment alert**

In `src/app/(tabs)/index.tsx`, replace:

```tsx
onOpenComments={(questionId) => Alert.alert('댓글', `${questionId} 댓글 화면은 다음 단계에서 연결합니다.`)}
```

with:

```tsx
onOpenComments={() => Alert.alert('댓글', '댓글 화면은 다음 단계에서 연결합니다.')}
```

- [ ] **Step 2: Cap reaction particles**

Before adding a new particle in `spawnParticles`, cap active particles:

```ts
setParticles((prev) => {
  const next = [...prev.slice(-11), newParticle];
  return next;
});
```

- [ ] **Step 3: Use theme motion values**

Import:

```ts
import { THEME } from '../../theme/styles';
```

Replace hardcoded particle duration/rise values with:

```ts
const rise = THEME.motion.particle.riseMin + Math.random() * (THEME.motion.particle.riseMax - THEME.motion.particle.riseMin);
const duration = THEME.motion.duration.particle + Math.random() * 240;
```

- [ ] **Step 4: Verify feed**

Run:

```powershell
npm.cmd run typecheck
```

Expected: `Exit 0`.

Manual QA:

- Tap a vote option.
- Choice Echo opens immediately.
- Tap reactions quickly 10+ times.
- UI remains responsive and particle count does not flood the screen.

## Task 3: Choice Echo를 프리미엄이지만 조용하게 개선

**Files:**
- Modify: `src/components/feed/ChoiceEchoSheet.tsx`

- [ ] **Step 1: Use surface tokens**

Import:

```ts
import { THEME } from '../../theme/styles';
```

Update `sheet`, `echoMessageBox`, and button colors:

```ts
sheet: {
  backgroundColor: THEME.surfaces.background.panel,
  borderColor: THEME.surfaces.border.light,
  borderTopLeftRadius: THEME.shapes.borderRadiusSheet,
  borderTopRightRadius: THEME.shapes.borderRadiusSheet,
  borderWidth: 1,
  paddingBottom: 34,
  paddingTop: 10,
  ...THEME.shadows.glass
},
echoMessageBox: {
  backgroundColor: '#ecfdf5',
  borderColor: '#99f6e4',
  borderRadius: THEME.shapes.borderRadiusCard,
  borderWidth: 1,
  flexDirection: 'row',
  gap: 10,
  padding: 16
}
```

- [ ] **Step 2: Keep CTA hierarchy clear**

Primary button remains “내 지도 보기”; close button stays visually quieter. Do not add extra explanatory body text.

- [ ] **Step 3: Verify**

Manual QA:

- Choice Echo text fits on 360px wide viewport.
- Sheet is readable over the backdrop.
- Buttons are at least 48px high.

## Task 4: Island 화면을 Dynamic Sky처럼 보이게 하되 가볍게 유지

**Files:**
- Modify: `src/app/(tabs)/island.tsx`

- [ ] **Step 1: Add local sky phase helper**

Add above `IslandScreen`:

```ts
function getSkyPhase(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return { top: '#ffedd5', mid: '#bae6fd', sun: '#fde68a' };
  if (hour >= 11 && hour < 17) return { top: '#bae6fd', mid: '#e0f2fe', sun: '#fef3c7' };
  if (hour >= 17 && hour < 21) return { top: '#fda4af', mid: '#c4b5fd', sun: '#fb7185' };
  return { top: '#172554', mid: '#312e81', sun: '#f8fafc' };
}
```

- [ ] **Step 2: Use phase in hero**

Inside `IslandScreen`:

```ts
const skyPhase = useMemo(() => getSkyPhase(), []);
```

Apply to `styles.sky` via inline style:

```tsx
<View style={[styles.sky, { backgroundColor: skyPhase.top }]}>
  <View style={[styles.skyBand, { backgroundColor: skyPhase.mid }]} />
  <View style={[styles.sun, { backgroundColor: skyPhase.sun }]} />
  <View style={styles.cloudSmall} />
  <View style={styles.cloudLarge} />
</View>
```

- [ ] **Step 3: Add `skyBand` style**

```ts
skyBand: {
  bottom: 0,
  height: 44,
  left: 0,
  opacity: 0.72,
  position: 'absolute',
  right: 0
}
```

- [ ] **Step 4: Verify**

Manual QA:

- The sky looks different enough without moving gradients.
- Text over the hero remains readable.
- No new dependency was added.

## Task 5: Insight Map의 glow는 상세 화면에서만 절제해서 적용

**Files:**
- Modify: `src/components/insight/InsightGraphCanvas.tsx`

- [ ] **Step 1: Strengthen selected node**

Keep all nodes readable. Only selected node gets stronger stroke:

```tsx
<Circle
  cx={node.x}
  cy={node.y}
  r={selected ? radius + 5 : radius}
  fill={selected ? '#fff7ed' : '#ffffff'}
  stroke={selected ? '#f59e0b' : node.color}
  strokeWidth={selected ? 4 : 3}
/>
```

- [ ] **Step 2: Do not add animated dash yet**

Do not add `Animated` SVG stroke dash animation in this task. It is deferred until mobile performance profiling exists.

- [ ] **Step 3: Verify**

Manual QA:

- Default graph stays readable.
- Selected node is obvious.
- Labels do not overlap enough to block interaction.

## Task 6: Create 화면은 “마법 콘셉트”보다 상태 명확성이 우선

**Files:**
- Modify: `src/app/(tabs)/create.tsx`
- Modify: `src/services/aiService.ts`

- [ ] **Step 1: Keep AI refine as 준비 중 if stubbed**

If `aiService.ts` still returns mock data, create screen must show a 준비 중 state instead of implying live AI generation.

Use this alert copy:

```ts
Alert.alert('준비 중', 'AI 다듬기와 중복 검사는 실제 Edge Function 연결 후 다시 열 예정입니다.');
```

- [ ] **Step 2: Avoid cauldron/heavy magic visuals**

Use a small sparkle icon or subtle accent border only. Do not add a large wizard/cauldron illustration until the feature is live.

- [ ] **Step 3: Verify**

Manual QA:

- User cannot mistake mock AI for a live feature.
- Create screen remains usable without animation.

## Task 7: Wiki 디자인 가이드 저장

**Files:**
- Create: `AI-Sessions/wiki/design/visual-ui-guidelines.md`
- Modify: `index.md`
- Modify: `log.md`

- [ ] **Step 1: Create wiki design guide**

Create `AI-Sessions/wiki/design/visual-ui-guidelines.md`:

```md
---
type: design
date: 2026-06-03
status: active
source: docs/superpowers/plans/2026-06-03-visual-ui-upgrade-plan.md
---

# Visual UI Guidelines

## Summary

Balance Island의 시각 효과는 자기발견 루프를 강화할 때만 사용한다. 펫은 감정 아바타, 섬은 자기지식 공간, 지도는 근거 연결을 보여주는 도구다.

## Rules

- Motion is feedback, not decoration.
- Feed는 빠른 선택과 Choice Echo 체감을 우선한다.
- Island는 발견, 가지 지도, 꾸미기 모드가 한눈에 구분되어야 한다.
- Insight graph는 기본 화면에서 과밀하면 안 된다.
- Glass effect는 surface 위계를 만드는 정도로만 쓴다.
- 유료/진단/MBTI처럼 보이는 시각 언어는 피한다.
- 새 animation dependency는 성능 근거가 생긴 뒤 도입한다.

## Links

- [[AI-Sessions/wiki/projects/balance-island-overview]]
- [[docs/product/deep-research-upgrade-decisions]]
- [[docs/superpowers/plans/2026-06-03-visual-ui-upgrade-plan]]
```

- [ ] **Step 2: Add index link**

In `index.md`, under `## Concepts` or after `## Decisions`, add:

```md
## Design

- [[AI-Sessions/wiki/design/visual-ui-guidelines|Visual UI Guidelines]] — 자기발견 루프를 강화하는 시각/모션 원칙
```

- [ ] **Step 3: Append log line**

Append to `log.md`:

```text
2026-06-03 22:10 | save | Visual UI 계획을 wiki 기준에 맞게 재검토하고 디자인 가이드로 정리 | [[docs/superpowers/plans/2026-06-03-visual-ui-upgrade-plan]], [[AI-Sessions/wiki/design/visual-ui-guidelines]]
```

## Deferred

- `generate_image` mockups: 구현 방향이 흔들릴 때만 사용한다.
- `react-native-reanimated`: gesture-heavy interaction을 만들 때 별도 계획으로 검토한다.
- `lottie-react-native`: asset pipeline과 bundle size 검증 뒤 검토한다.
- draggable insight graph: 모바일 interaction QA와 graph density 정책이 확정된 뒤 검토한다.
- full animated gradient sky: 정적 phase sky가 충분하지 않을 때만 도입한다.

## Verification

Run:

```powershell
npm.cmd run typecheck
npm.cmd run validate:wiki
npm.cmd run validate:pet-assets
```

Expected:

- TypeScript exits 0.
- Wiki lint exits 0.
- Pet asset validation exits 0.

Manual QA:

- Feed: vote, echo, reaction particles.
- Island: discovery mode, branch map mode, decorate mode.
- Theme probability sheet: opens and remains readable.
- Insight map: selected node is visible and labels are readable.
- Create: AI refine does not pretend to be live if still stubbed.
