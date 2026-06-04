# Antigravity UI Gap Closure Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to execute this plan. Treat this as a verification-first repair plan, not a fresh redesign prompt.

Last updated: 2026-06-04

## Goal

Make the current Balance Island app visibly match the three Antigravity UI directions in a code-safe, data-safe way:

1. **Island:** sunset/ocean mood, central floating island and pet, glass HUD, shell/gem reward cards, premium bottom navigation.
2. **Feed:** pastel beach background, high-focus VS card, real question data, clear voting/result state.
3. **Insight:** dark starry value map, glowing category hubs, constellation links, readable node details, bottom navigation continuity.

The target is **visual equivalence**, not pixel-perfect reproduction. The app should feel like the mockups while preserving real product data, routing, accessibility, and Expo/React Native compatibility.

## Current Verified State

Automated checks run on 2026-06-04:

- `npm.cmd run typecheck` passed.
- `npm.cmd run validate:pet-assets` passed: 10 common, 10 rare, 3 legend.
- `npm.cmd run validate:wiki` passed.

Confirmed local assets exist:

- `assets/pets/cozy-island-retriever.png`
- `assets/feed/fried-chicken.png`
- `assets/feed/shaved-ice.png`
- `assets/icons/shell.png`
- `assets/icons/gem-chest.png`

Confirmed source changes already exist in the working tree:

- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/island.tsx`
- `src/app/_layout.tsx`
- related common/theme/insight/feed components

Do not overwrite or revert these changes blindly. Review and integrate them.

## Findings

### 1. The UI is partially implemented, not absent

The Antigravity direction is already partly present in code:

- Feed has pastel background spots, a premium header, glass vote panels, local fried-chicken/shaved-ice assets, and a central VS divider.
- Island has a decorate-mode premium hero using the cozy island asset, mood/energy HUD cards, shell/gem cards, and animated heart accents.
- Insight has a dark starry canvas, glowing color categories, constellation-like edges, and tooltip cards.

The user perception of "not applied" is valid because the visible app still presents parts of the older wide dashboard structure, especially on the island screen.

### 2. Island mockup is hidden behind mode and layout mismatch

The premium island treatment is currently tied to `activeMode === 'decorate'`. The default island experience still looks like a wide web dashboard with a small island thumbnail. This does not match the mockup where the central island/pet is the first-viewport hero.

Decision: make the premium island hero the primary island surface, then place discovery, branch map, and decorate tools underneath or inside focused tabs.

### 3. Insight map is outside the tab layout

`src/app/insight-map.tsx` is registered as a stack route in `src/app/_layout.tsx`, not as a tab route. Links from `src/components/feed/ChoiceEchoSheet.tsx` and island preview navigate to `/insight-map`, which can break the mockup's bottom-nav continuity.

Decision: create a tab-owned insight route and preserve `/insight-map` only as a redirect/compatibility entry if needed.

### 4. Feed contains visual-demo data that can damage trust

`src/components/feed/BalanceCard.tsx` currently uses simulated counts when total votes are zero:

- `14310`
- `11690`

It also uses visual mockup copy like `Outfit, Semi-Bold, 18px`. This helps resemble the mockup but makes the app feel fake when real data is empty.

Decision: remove fake metrics from production UI. Use a clearly marked demo/preview state only in Storybook-like preview code or seed content.

### 5. Header and reward numbers are hardcoded

Examples found:

- `Level 12`
- `78 | 425`
- `3 Gems`
- `Your Starry Mind`

Decision: every visible metric must either come from store/database state or be hidden until the feature is real. Hardcoded mock values are allowed only in screenshot fixtures and must not appear in runtime production screens.

### 6. Web-only visual effects explain some mismatch

`GlassView` uses web `backdropFilter`. Feed and insight backgrounds also rely on web-only `filter` / `webkitFilter`. These can look different or weak on native Expo builds.

Decision: treat blur as progressive enhancement. Web can use CSS blur; native should use stable translucent panels, borders, shadows, and optional `expo-blur` only if the dependency is intentionally added and verified.

### 7. Global document style injection is fragile

`src/app/_layout.tsx` injects a `document.createElement('style')` block at module load. It works in a browser-only path but is not the best Expo Router pattern and can duplicate styles under hot reload.

Decision: move this into a guarded effect or a small web-only component that checks for an existing style id.

### 8. Korean string display needs a source-level audit

PowerShell output shows mojibake in several files, while TypeScript still passes. This may be terminal encoding display, file encoding, or actual damaged source strings.

Decision: verify with UTF-8 file reads and browser screenshots. Restore user-facing Korean strings where actual runtime text is damaged.

## Architecture Decisions

1. Keep Expo SDK 51, React Native, Expo Router, `react-native-svg`, `expo-image`, Zustand, and Supabase.
2. Do not add a heavy animation framework for this pass.
3. Use `GlassView` as the single glass surface abstraction, but make platform fallbacks explicit.
4. Use existing local generated bitmap assets only after validating path, dimensions, and file size.
5. Keep the user's 10 common, 10 rare, 3 legend pet system. The cozy retriever island image is a hero environment asset, not the only pet identity.
6. Maintain Korean-first product copy. English labels can remain only where they are deliberate UI style tokens, such as `VS`.
7. The first implementation milestone is route/data/visibility correctness. Visual polish comes after that.

## Implementation Plan

### Phase 0: Baseline Snapshot And Safety

1. Capture current visible screenshots for:
   - `/`
   - `/island`
   - `/insight-map`
   - mobile width around 390 px
   - desktop width around 1280 px
2. Save the screenshots under `docs/visual-audit/2026-06-04/`.
3. Record pass/fail against these visible criteria:
   - premium island hero visible in first viewport
   - feed VS card visible without scrolling on mobile
   - insight screen keeps bottom navigation
   - no fake metrics visible
   - no broken Korean visible
4. Keep the existing dirty source changes. Stage only files intentionally changed in this phase.

### Phase 1: Route And Navigation Repair

1. Add an insight tab route:
   - create `src/app/(tabs)/insight.tsx`
   - move the current insight screen content there or wrap the existing screen component
2. Update navigation:
   - `src/components/feed/ChoiceEchoSheet.tsx`
   - `src/components/island/TodayDiscoveryCard.tsx`
   - `src/app/(tabs)/island.tsx`
3. Replace `/insight-map` pushes with the tab route.
4. Keep `src/app/insight-map.tsx` as a compatibility redirect if deep links already exist.
5. Update `src/app/(tabs)/_layout.tsx` to include an insight tab with premium nav styling.

Acceptance criteria:

- Insight opens with the same bottom tab bar as feed/island/profile.
- Browser back behavior remains understandable.
- Old `/insight-map` links do not dead-end.

### Phase 2: Production Data Integrity

1. Remove simulated vote counts from `BalanceCard`.
2. Replace `Outfit, Semi-Bold, 18px` with real option descriptions or a concise empty fallback.
3. Replace hardcoded feed header values with actual state:
   - level from island/gamification snapshot
   - progress from real XP or hide the progress badge
   - profile/avatar from auth profile
4. Replace `3 Gems` with real gem balance or hide the gem card until gem economy exists.
5. Ensure zero-vote questions display a polished empty state without pretending votes exist.

Acceptance criteria:

- Runtime UI does not show fake numeric metrics.
- Empty data looks intentional and still polished.
- No vote button auto-selects option A without an explicit option choice unless product design approves that interaction.

### Phase 3: Island First-Viewport Hero

1. Extract the current decorate-mode hero into components:
   - `src/components/island/CozyIslandHero.tsx`
   - `src/components/island/IslandHud.tsx`
   - `src/components/island/IslandRewardDock.tsx`
2. Render the hero as the top island section for all island modes.
3. Use the selected pet asset where available. Use `cozy-island-retriever.png` as an environment/hero fallback, not a replacement for the user's pet collection.
4. Rework the wide desktop layout so the hero has a constrained immersive frame instead of stretching into a sparse dashboard.
5. Move discovery cards, branch map preview, and decorate controls below the hero.

Acceptance criteria:

- On `/island`, the first viewport communicates "my island + my pet" immediately.
- Desktop does not reduce the island to a tiny thumbnail.
- Mobile does not require scrolling before the main island identity appears.

### Phase 4: Feed Visual Equivalence

1. Refactor `BalanceCard` into clear subcomponents:
   - `FeedOptionPanel`
   - `FeedVsDivider`
   - `FeedResultBar`
   - `FeedReactionRow`
2. Preserve real question data while matching the mockup hierarchy:
   - large glass vote card
   - two balanced options
   - central `VS`
   - compact result bar
   - bottom action row
3. Use local generated food images only when the question image URL or seed data intentionally maps to them.
4. Make the layout responsive:
   - side-by-side option cards on normal mobile and desktop
   - safe fallback stacking only below very narrow widths
5. Keep particles/background as decorative layers with `pointerEvents="none"`.

Acceptance criteria:

- The feed resembles the pastel beach VS mockup without fake copy or fake numbers.
- Long Korean option titles fit without overlap.
- Tapping the vote card never triggers an unintended default vote.

### Phase 5: Insight Starry Map

1. Move insight into tab navigation from Phase 1.
2. Keep the starry graph direction, but harden cross-platform rendering:
   - avoid relying on unsupported SVG filters for core visibility
   - use plain circles/rings/shadows as fallback
   - memoize graph layout and expensive derived data
3. Replace generic English copy with Korean-first product language:
   - `Your Starry Mind` -> `나의 성향 우주`
   - tooltip descriptions based on actual node evidence
4. Fix tooltip positioning inside the graph frame, not the full window width.
5. Add accessible labels for graph nodes and a non-visual summary section.

Acceptance criteria:

- The screen looks like a constellation/value map, not a generic card list.
- Tooltip stays inside the visible frame on mobile and desktop.
- Performance remains smooth with larger node counts.

### Phase 6: Glass And Motion System

1. Update `GlassView`:
   - web: `backdropFilter` with guarded style typing
   - native: translucent background, border, shadow, optional blur only after dependency verification
2. Add a small shared decorative particle component:
   - `src/components/common/FloatingParticles.tsx`
3. Add reduced-motion handling where practical:
   - disable loops or reduce duration when motion reduction is active
4. Move global web selection CSS from module load into a guarded web-only effect.

Acceptance criteria:

- Web glass remains strong.
- Native fallback still looks intentional.
- Hot reload does not append repeated global style tags.

### Phase 7: Visual QA Automation

1. Add a visual asset validator:
   - verify required files exist
   - verify image dimensions are at least app-usable size
   - warn when files are too large for runtime use
2. Add a screenshot checklist document under `docs/visual-audit/`.
3. Run:

```powershell
npm.cmd run typecheck
npm.cmd run validate:pet-assets
npm.cmd run validate:wiki
npm.cmd run build
```

4. Manually verify with Browser/Chrome:
   - local Expo web URL
   - deployed Vercel URL after push
   - mobile and desktop widths

Acceptance criteria:

- Every phase has before/after screenshots.
- The plan can be reviewed without guessing whether a mockup element was applied.

## File Change Checklist

Expected files to modify during execution:

- `src/app/_layout.tsx`
- `src/app/(tabs)/_layout.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/island.tsx`
- `src/app/(tabs)/insight.tsx`
- `src/app/insight-map.tsx`
- `src/components/common/GlassView.tsx`
- `src/components/feed/BalanceCard.tsx`
- `src/components/feed/ChoiceEchoSheet.tsx`
- `src/components/insight/InsightGraphCanvas.tsx`
- `src/components/island/TodayDiscoveryCard.tsx`
- new island/feed/common extracted components as listed above
- optional `scripts/validate-visual-assets.mjs`
- optional `docs/visual-audit/2026-06-04/README.md`

## Non-Goals For This Pass

- Do not redesign authentication.
- Do not rebuild the economy or gacha system.
- Do not replace the existing pet rarity asset set.
- Do not introduce a new UI framework.
- Do not publish fake metrics as production data.

## Reviewer Notes Incorporated

Read-only GPT-5.3-Codex-Spark review highlighted these risks and they are reflected above:

- insight route being outside the tab system
- web-only glass/blur mismatch
- inconsistent visual language across feed/island/insight
- default tab bar feeling less premium than the mockups
- possible Korean string quality issues
- fake data damaging trust
- graph responsiveness/performance risk
- missing accessibility and reduced-motion safeguards
- plan-to-implementation checklist gap

## Immediate Next Action

Execute Phase 0 and Phase 1 first. The highest-impact fix is not another asset pass; it is making the premium surfaces visible in the correct routes with real data and consistent navigation.
