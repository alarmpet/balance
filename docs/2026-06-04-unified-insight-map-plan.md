# 통합 인사이트 맵 계획서: Obsidian × 마인드맵 단일 자기지도

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재처럼 발견/섬 지형/별자리로 나뉜 복잡한 인사이트 경험을, Obsidian의 연결 가시성과 마인드맵의 위계를 섞은 하나의 심플하고 트렌디한 자기지도로 통합한다.

**Architecture:** 백엔드/RPC는 그대로 두고 `src/screens/InsightMapScreen.tsx`가 하나의 메인 캔버스를 렌더링한다. `src/components/insight/InsightGraphCanvas.tsx`는 중심의 나/펫, 3~4개 성향 클러스터, 근거 선택 노드, 상황별 다른 나 콜아웃을 한 화면에서 점진 공개한다.

**Tech Stack:** React Native, Expo Router, `react-native-svg`, `d3-hierarchy`, existing `react-native-gesture-handler`/`react-native-reanimated`, Supabase `get_personality_insight_graph`.

---

## 0. Wiki 검증 결론

### 반영한 근거

- `AI-Sessions/wiki/projects/balance-island-overview.md`
- `AI-Sessions/wiki/decisions/2026-06-04-trendy-self-discovery-direction.md`
- `AI-Sessions/wiki/decisions/bipi-model-adoption.md`
- `AI-Sessions/wiki/design/visual-ui-guidelines.md`
- `AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review.md`
- 현재 코드: `src/screens/InsightMapScreen.tsx`, `src/components/insight/InsightGraphCanvas.tsx`

### 확정 방향

사용자가 원한 것은 여러 화면을 늘리는 것이 아니라, **Obsidian 그래프의 연결감 + 마인드맵의 중심-가지 구조를 한 화면 안에서 섞는 것**이다. 따라서 계획의 핵심은 "3개 탭을 더 예쁘게 만들기"가 아니라 **하나의 지도에서 모든 의미를 읽히게 만드는 것**이다.

### 기존 계획에서 수정해야 하는 점

| 기존 계획의 위험 | Wiki/코드 검증 후 수정 |
|---|---|
| "3탭 폐기"만 강조해서 오늘의 발견/모순/근거 맥락까지 사라질 위험 | 발견/근거/모순은 유지하되, 별도 탭이 아니라 지도 위 오버레이/콜아웃/배지로 흡수 |
| 별자리 그래프를 첫 화면에 과밀하게 보여줄 위험 | 기본 화면은 중심 + 3~4개 클러스터 + 핵심 노드 7~10개만 표시 |
| Obsidian 전체 그래프처럼 복잡해질 위험 | 전체 그래프가 아니라 Local Graph 방식: 선택한 노드와 가까운 이웃만 강조 |
| "당신은 이런 사람" 같은 진단 톤 위험 | "요즘 선택에서 이런 흐름이 보여요"처럼 탐색형 문장 유지 |
| 새 시각효과/모션을 과하게 넣을 위험 | Motion은 피드백으로만 사용. 필터/글로우는 런타임 안정성이 검증된 방식만 사용 |
| 현재 코드 상태 미반영 | 현재 인사이트는 `src/app/(tabs)/insight.tsx` → `InsightMapScreen` 구조이며, `/insight-map`은 호환 경로로 유지 |

---

## 1. 제품 원칙

### 1.1 한 문장

**"밸런스 게임을 하다 보면, 내 선택들이 하나의 마음 지도로 자라나고, 나는 그 지도를 눌러보며 나도 몰랐던 취향과 가치관을 발견한다."**

### 1.2 화면 원칙

1. **한 화면, 한 지도.** 발견/가지/별자리 탭을 병렬 화면으로 나누지 않는다.
2. **중심은 나.** 중앙에는 사용자 아바타 또는 대표 펫을 둔다.
3. **마인드맵 위계.** 중앙 → 성향 클러스터 → 세부 성향 → 근거 질문 순서로 읽힌다.
4. **Obsidian 연결감.** 선택한 노드 주변의 연결만 밝아지고, 관련 선택/근거가 콜아웃으로 뜬다.
5. **과밀 금지.** 기본 화면에서는 7~10개 노드 이상을 동시에 보여주지 않는다.
6. **트렌디하되 단순하게.** 딥 스페이스/섬의 밤/별자리 느낌은 쓰되, 정보 구조는 항상 명확해야 한다.

### 1.3 문장 톤

사용하지 않을 진단형 문장 예시:

```text
"안정형"처럼 사람을 고정 타입으로 단정하는 문장
"진짜 성격"처럼 본질을 확정하는 문장
"정확한 성향"처럼 검사 결과처럼 보이는 문장
```

사용:

```text
최근 선택에서 안정 쪽 흐름이 조금 더 자주 보여요.
이 질문들에서는 편안함을 더 중요하게 본 것 같아요.
연애 질문과 일상 질문에서 다른 선택 리듬이 보여요.
```

---

## 2. 목표 화면

```text
┌────────────────────────────────────┐
│ Balance Island        나의 마음 지도 │
│                                    │
│  오늘의 발견                       │
│  최근 선택에서 "안정" 흐름이 진해요  │
│                                    │
│          음식·건강                  │
│        ○──○──○                     │
│       /       \                    │
│ 관계 ○    ◎ 나/펫    ○ 삶·균형      │
│       \       /                    │
│        ○──○──○                     │
│                                    │
│  선택한 노드 콜아웃                 │
│  "이 흐름은 3개의 질문에서 보여요." │
└────────────────────────────────────┘
```

### 핵심 구성

- **상단:** 짧은 제목과 오늘의 발견 1줄.
- **중앙:** 나/펫 노드.
- **1차 가지:** 3~4개 클러스터. 예: 음식·건강, 삶·균형, 관계·연결, 취향·표현.
- **2차 노드:** 사용자의 최근 선택에서 강하게 나온 성향.
- **근거 콜아웃:** 노드 탭 시 "어떤 질문/선택에서 나온 흐름인지"를 보여준다.
- **상황별 다른 나 배지:** 카테고리별 상반된 흐름이 있을 때 작은 배지로 표시한다.

---

## 3. 파일 구조

### 수정 대상

- `src/screens/InsightMapScreen.tsx`
  - 탭 세그먼트를 제거하고 단일 지도 화면의 shell이 된다.
  - 오늘의 발견, 로딩/에러, 접근성용 텍스트 요약, 선택 노드 상태를 관리한다.

- `src/components/insight/InsightGraphCanvas.tsx`
  - 마인드맵+로컬그래프 캔버스의 코어가 된다.
  - 중심 노드, 클러스터 노드, 근거 노드, 선택 강조, 콜아웃 위치를 처리한다.

- `src/components/insight/InsightNodeDetailSheet.tsx`
  - 모바일 접근성과 상세 읽기용 보조 패널로 유지한다.
  - 기본 경험의 중심은 아니며, 노드 탭 후 더 자세히 볼 때만 열린다.

- `src/components/insight/IslandTerrainView.tsx`
  - 이번 단계에서는 삭제하지 않는다.
  - 직접 렌더링에서 제외하거나, 향후 섬 꾸미기/지형 표현으로 재배치할 후보로 보관한다.

- `src/components/insight/ContradictionCard.tsx`
  - 별도 카드 목록으로 노출하지 않는다.
  - 문구와 데이터 표현은 `InsightGraphCanvas`의 "상황별 다른 나" 콜아웃에 재사용한다.

### 유지 대상

- `src/app/(tabs)/insight.tsx`
  - 탭 라우트 진입점 유지.

- `src/app/insight-map.tsx`
  - 기존 링크 호환을 위해 `/insight`로 리디렉션 유지.

- Supabase RPC `get_personality_insight_graph`
  - 서버 변경 없음. 현재 snapshot의 `nodes`, `edges`, `summary`, `contradictions`, `user_insight_cards`를 재매핑한다.

---

## 4. 데이터 매핑

| 데이터 | 지도 표현 |
|---|---|
| `snapshot.summary.title/body` | 상단 "오늘의 발견" 1줄과 짧은 설명 |
| `nodes.kind === 'pet'` | 중앙 나/펫 노드 |
| `nodes.kind === 'category'` | 1차 클러스터 노드 |
| `nodes.kind === 'trait'` | 2차 성향 노드 |
| `nodes.kind === 'question'` | 포커스 시에만 보이는 근거 선택 노드 |
| `edges.weight` | 연결선 두께/투명도 |
| `contradictions` | "상황별 다른 나" 배지와 콜아웃 |
| `user_insight_cards` | 선택 노드 상세 문장 또는 하단 시트 |

### 기본 노드 제한

Overview에서 렌더링하는 우선순위:

1. 중앙 pet/user 노드 1개.
2. category 노드 최대 4개.
3. trait 노드 최대 6개.
4. question 노드는 기본 화면에서 숨기고, 선택한 trait/category의 근거로만 표시.

이 제한은 "Obsidian 같은 연결감"은 살리되 "Obsidian 전체 그래프의 과밀함"은 피하기 위한 핵심 가드레일이다.

---

## 5. 실행 계획

### Task 1: 현재 화면의 깨진 한글과 구조 기준선 정리

**Files:**
- Modify: `src/screens/InsightMapScreen.tsx`
- Modify: `src/components/insight/InsightGraphCanvas.tsx`

- [ ] **Step 1: 깨진 한글 문자열을 정상 한국어로 복구한다.**

복구해야 하는 대표 문자열:

```tsx
const CLUSTER_LEGEND = [
  { label: '음식·건강', color: '#f59e0b' },
  { label: '삶·균형', color: '#14b8a6' },
  { label: '관계·연결', color: '#d946ef' }
];
```

```tsx
<Text style={styles.kicker}>나의 선택 지도</Text>
<Text style={styles.title}>성향 인사이트 맵</Text>
```

```tsx
<Text style={styles.canvasTitle}>나의 마음 지도</Text>
<Text style={styles.canvasSubtitle}>선택들이 만든 가치 지도</Text>
```

- [ ] **Step 2: 타입체크로 문자열 복구 중 문법 오류가 없는지 확인한다.**

Run:

```bash
npm.cmd run typecheck
```

Expected:

```text
No TypeScript errors.
```

### Task 2: 3탭 UI를 단일 지도 shell로 전환

**Files:**
- Modify: `src/screens/InsightMapScreen.tsx`

- [ ] **Step 1: `InsightTab`, `activeTab`, `TabButton`, segmented styles를 제거한다.**

삭제 대상:

```tsx
type InsightTab = 'discover' | 'terrain' | 'links';
const [activeTab, setActiveTab] = useState<InsightTab>('terrain');
function TabButton(...) { ... }
```

- [ ] **Step 2: 화면을 단일 구조로 바꾼다.**

렌더링 구조:

```tsx
<View style={styles.mapShell}>
  <View style={styles.spotlight}>
    <Text style={styles.cardLabel}>오늘의 발견</Text>
    <Text style={styles.cardTitle}>{snapshot?.summary.title ?? '선택 지도를 불러오는 중'}</Text>
    <Text style={styles.summaryText}>{snapshot?.summary.body ?? '잠시만 기다려 주세요.'}</Text>
  </View>

  {snapshot ? (
    <InsightGraphCanvas
      snapshot={snapshot}
      selectedNodeId={selectedNodeId}
      onSelectNode={selectNode}
    />
  ) : (
    <View style={styles.loadingPanel}>
      <ActivityIndicator color="#0ea5e9" />
      <Text style={styles.emptyText}>마음 지도를 배치하는 중입니다.</Text>
    </View>
  )}
</View>
```

- [ ] **Step 3: `ContradictionCard`와 `IslandTerrainView` import를 제거한다.**

두 컴포넌트는 이번 화면에서 직접 렌더링하지 않는다. 삭제하지 않고 향후 재배치 후보로 남긴다.

- [ ] **Step 4: 접근성용 텍스트 요약 블록을 추가한다.**

그래프만으로 내용을 이해하기 어려운 사용자를 위해 화면 하단에 접을 수 있는 요약을 둔다.

```tsx
<View style={styles.textSummaryPanel}>
  <Text style={styles.cardLabel}>지도 요약</Text>
  <Text style={styles.summaryText}>{snapshot.summary.body}</Text>
</View>
```

### Task 3: `InsightGraphCanvas`를 단일 마음 지도 중심으로 재구성

**Files:**
- Modify: `src/components/insight/InsightGraphCanvas.tsx`

- [ ] **Step 1: Overview 노드 제한 함수를 추가한다.**

```tsx
const OVERVIEW_CATEGORY_LIMIT = 4;
const OVERVIEW_TRAIT_LIMIT = 6;

function selectOverviewNodes(nodes: InsightGraphNode[]) {
  const center = nodes.find((node) => node.kind === 'pet') ?? nodes[0] ?? null;
  const categories = nodes
    .filter((node) => node.kind === 'category')
    .sort((a, b) => b.size - a.size)
    .slice(0, OVERVIEW_CATEGORY_LIMIT);
  const traits = nodes
    .filter((node) => node.kind === 'trait')
    .sort((a, b) => b.size - a.size)
    .slice(0, OVERVIEW_TRAIT_LIMIT);

  return new Set([center?.id, ...categories.map((node) => node.id), ...traits.map((node) => node.id)].filter(Boolean));
}
```

- [ ] **Step 2: 기본 렌더링은 `selectOverviewNodes`에 포함된 노드만 보여준다.**

선택한 노드가 있으면 그 노드와 연결된 1-depth 이웃은 추가로 보여준다.

```tsx
function expandSelectedNeighborhood(
  visibleIds: Set<string>,
  selectedNodeId: string | null,
  edges: InsightGraphEdge[]
) {
  if (!selectedNodeId) return visibleIds;
  const expanded = new Set(visibleIds);
  expanded.add(selectedNodeId);
  edges.forEach((edge) => {
    if (edge.source === selectedNodeId) expanded.add(edge.target);
    if (edge.target === selectedNodeId) expanded.add(edge.source);
  });
  return expanded;
}
```

- [ ] **Step 3: SVG 필터 기반 글로우를 쓰지 않는다.**

`Filter`, `FeGaussianBlur`, `Defs` 기반 효과를 도입하지 않는다. 웹/네이티브에서 안정적인 원형 레이어와 투명도만 사용한다.

```tsx
<Circle cx={node.x} cy={node.y} r={node.size + 10} fill={nodeColor} opacity={0.16} />
<Circle cx={node.x} cy={node.y} r={node.size + 4} fill={nodeColor} opacity={0.24} />
<Circle cx={node.x} cy={node.y} r={node.size} fill={nodeColor} opacity={selected ? 1 : 0.82} />
```

- [ ] **Step 4: 선택된 노드 주변만 밝게 한다.**

```tsx
const isDimmed =
  selectedNodeId !== null &&
  node.id !== selectedNodeId &&
  !layout.edges.some((edge) =>
    (edge.source === selectedNodeId && edge.target === node.id) ||
    (edge.target === selectedNodeId && edge.source === node.id)
  );
```

### Task 4: 근거 질문과 "상황별 다른 나"를 콜아웃으로 흡수

**Files:**
- Modify: `src/components/insight/InsightGraphCanvas.tsx`
- Modify: `src/screens/InsightMapScreen.tsx`

- [ ] **Step 1: 선택 노드 콜아웃 문구를 실제 데이터 기반으로 바꾼다.**

더미/깨진 문자열을 제거하고 `selectedNode.description`, 연결된 question 노드, `snapshot.summary`를 사용한다.

```tsx
function getTooltipContent(node: PositionedNode, snapshot: InsightGraphSnapshot) {
  const evidenceNodes = snapshot.edges
    .filter((edge) => edge.source === node.id || edge.target === node.id)
    .map((edge) => snapshot.nodes.find((item) => item.id === (edge.source === node.id ? edge.target : edge.source)))
    .filter((item): item is InsightGraphNode => Boolean(item) && item.kind === 'question')
    .slice(0, 2);

  return {
    title: node.label,
    desc: node.description || snapshot.summary.body || '최근 선택에서 보이는 흐름입니다.',
    flow: evidenceNodes.length > 0
      ? `근거 선택 ${evidenceNodes.length}개와 연결되어 있어요.`
      : '선택이 더 쌓이면 근거가 더 선명해져요.'
  };
}
```

- [ ] **Step 2: contradictions가 있으면 작은 배지로만 먼저 표시한다.**

기본 문구:

```text
상황별 다른 나
```

상세 문구:

```text
일관성이 없다는 뜻이 아니라, 질문의 맥락에 따라 다른 기준을 쓰고 있다는 신호예요.
```

- [ ] **Step 3: `InsightNodeDetailSheet`는 보조 상세로 유지한다.**

노드 탭은 캔버스 콜아웃을 먼저 보여주고, "자세히" 액션이 필요한 경우에만 시트를 연다.

### Task 5: 시각 톤을 심플하고 트렌디하게 정리

**Files:**
- Modify: `src/components/insight/InsightGraphCanvas.tsx`
- Modify: `src/screens/InsightMapScreen.tsx`

- [ ] **Step 1: 배경은 한 가지 테마만 사용한다.**

딥 스페이스/섬의 밤 느낌을 유지하되, 장식 요소는 최소화한다.

권장 색:

```tsx
const THEME = {
  background: '#08111f',
  panel: 'rgba(15, 23, 42, 0.72)',
  text: '#f8fafc',
  muted: '#94a3b8',
  food: '#f59e0b',
  life: '#14b8a6',
  relation: '#d946ef',
  self: '#a78bfa'
};
```

- [ ] **Step 2: 폰트 크기를 모바일에 맞게 제한한다.**

캔버스 내부 라벨은 9~12px 범위로 유지한다. 긴 라벨은 2줄로 자르거나 콜아웃에서 보여준다.

- [ ] **Step 3: 모션은 선택 피드백 1종만 사용한다.**

노드 선택 시 밝기/투명도 변화만 먼저 적용한다. 팬/핀치/semantic zoom은 이번 구현의 필수 범위가 아니다.

### Task 6: 검증

**Files:**
- Test: current app and docs

- [ ] **Step 1: 타입체크**

Run:

```bash
npm.cmd run typecheck
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 2: wiki 검증**

Run:

```bash
npm.cmd run validate:wiki
```

Expected:

```text
Wiki validation passed
```

- [ ] **Step 3: 웹 빌드**

Run:

```bash
npm.cmd run build
```

Expected:

```text
Export complete
```

- [ ] **Step 4: 브라우저 확인**

확인 URL:

```text
http://localhost:8082/insight
```

확인 기준:

- 발견/섬 지형/별자리 3분할 탭이 보이지 않는다.
- 첫 화면에서 하나의 지도만 보인다.
- 중앙 나/펫 노드와 3~4개 주요 클러스터가 보인다.
- 노드 탭 시 관련 연결과 콜아웃이 표시된다.
- 한글 깨짐이 없다.
- 그래프가 비어 있거나 과밀하지 않다.

---

## 6. 비범위

이번 계획에서 하지 않는다:

- Supabase RPC 변경.
- 새 DB 테이블 추가.
- 전체 Obsidian 그래프처럼 모든 질문/선택을 한꺼번에 표시.
- 심리 진단처럼 보이는 타입 확정 문구.
- 필수 기능으로서의 고급 핀치줌/팬/3D/Skia 전환.
- 펫/섬/가챠 경제 변경.

---

## 7. 최종 의사결정

**채택:** 하나의 통합 마음 지도.

**폐기:** 발견/섬 지형/별자리를 사용자가 직접 오가야 하는 3탭 정보구조.

**유지:** 오늘의 발견, 근거 질문, 상황별 다른 나, 섬/별자리 메타포.

**표현 방식:** 이 요소들은 별도 화면이 아니라, 하나의 지도 안에서 오버레이·콜아웃·배지로 드러난다.

이 방향이 사용자의 의도인 **"복잡하지 않고, 심플하고 직관적이면서 트렌디한 Obsidian × 마인드맵 자기지도"**에 가장 가깝다.

---

## 8. 구현자 체크리스트

- [ ] 먼저 깨진 한글 문자열을 복구한다.
- [ ] 탭을 제거하기 전에 현재 `/insight` 진입이 정상인지 확인한다.
- [ ] 단일 지도 shell을 만든 뒤 캔버스를 붙인다.
- [ ] 기본 노드 수를 제한한다.
- [ ] 노드 선택 콜아웃을 실제 snapshot 데이터로 채운다.
- [ ] "상황별 다른 나"는 부정적 모순이 아니라 맥락 차이로 표현한다.
- [ ] `typecheck`, `validate:wiki`, `build`, 브라우저 확인을 모두 통과한 뒤 완료로 본다.
