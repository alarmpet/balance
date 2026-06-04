import { memo, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import type { InsightGraphEdge, InsightGraphNode, InsightGraphSnapshot } from '../../types/database.types';
import { useAuthStore } from '../../store/authStore';
import GlassView from '../common/GlassView';

type PositionedNode = InsightGraphNode & {
  x: number;
  y: number;
  colorCode: string;
};

type InsightGraphCanvasProps = {
  snapshot: InsightGraphSnapshot;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
};

const WIDTH = 340;
const HEIGHT = 390;
const CENTER_X = WIDTH / 2;
const CENTER_Y = 198;
const OVERVIEW_CATEGORY_LIMIT = 4;
const OVERVIEW_TRAIT_LIMIT = 6;

const THEME = {
  background: '#08111f',
  food: '#f59e0b',
  life: '#14b8a6',
  relation: '#d946ef',
  self: '#a78bfa',
  question: '#38bdf8',
  text: '#f8fafc',
  muted: '#94a3b8'
};

const BG_STARS = [
  { x: 28, y: 42, r: 1 },
  { x: 74, y: 86, r: 1.2 },
  { x: 48, y: 164, r: 0.8 },
  { x: 80, y: 292, r: 1 },
  { x: 124, y: 340, r: 1.4 },
  { x: 254, y: 44, r: 0.8 },
  { x: 306, y: 118, r: 1 },
  { x: 270, y: 222, r: 1.2 },
  { x: 296, y: 332, r: 0.9 },
  { x: 202, y: 74, r: 1 }
];

const CLUSTER_LABELS = [
  { label: '음식·건강', color: THEME.food, x: 82, y: 100 },
  { label: '삶·균형', color: THEME.life, x: 260, y: 116 },
  { label: '관계·연결', color: THEME.relation, x: 92, y: 316 }
];

export function InsightGraphCanvas({ snapshot, selectedNodeId, onSelectNode }: InsightGraphCanvasProps) {
  const layout = useMemo(
    () => createMindMapLayout(snapshot.nodes, snapshot.edges, selectedNodeId),
    [selectedNodeId, snapshot.edges, snapshot.nodes]
  );

  const selectedNode = selectedNodeId ? layout.nodesById.get(selectedNodeId) ?? null : null;
  const selectedTooltip = selectedNode ? getTooltipContent(selectedNode, snapshot) : null;
  const profile = useAuthStore((state) => state.profile);
  const universeName = profile?.nickname || '나';
  const contradiction = snapshot.contradictions[0] ?? null;

  return (
    <View style={styles.frame}>
      <View style={styles.nebulaA} pointerEvents="none" />
      <View style={styles.nebulaB} pointerEvents="none" />
      <View style={styles.canvasHeader} pointerEvents="none">
        <Text style={styles.canvasTitle}>나의 마음 지도</Text>
        <Text style={styles.canvasSubtitle}>선택들이 만든 연결을 한 화면에 모았어요</Text>
      </View>

      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} accessibilityLabel={snapshot.summary.title}>
        {BG_STARS.map((star, index) => (
          <Circle key={`star-${index}`} cx={star.x} cy={star.y} r={star.r} fill="#ffffff" opacity={0.38} />
        ))}

        <Path d="M284,42 A15,15 0 0,0 304,62 A13,13 0 1,1 284,42" fill="#f8fafc" opacity={0.75} />

        {CLUSTER_LABELS.map((cluster) => (
          <SvgText
            key={cluster.label}
            x={cluster.x}
            y={cluster.y}
            fill={cluster.color}
            fontSize="8"
            fontWeight="800"
            opacity={0.32}
            textAnchor="middle"
          >
            {cluster.label}
          </SvgText>
        ))}

        {layout.edges.map((edge) => {
          const source = layout.nodesById.get(edge.source);
          const target = layout.nodesById.get(edge.target);
          if (!source || !target) return null;

          const selectedPath = Boolean(selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId));
          const strokeColor = selectedPath ? source.colorCode : 'rgba(255, 255, 255, 0.18)';

          return (
            <Line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={strokeColor}
              strokeLinecap="round"
              strokeWidth={selectedPath ? 2.8 : Math.max(0.9, Math.min(2, edge.weight))}
              strokeDasharray={selectedPath ? undefined : '4 5'}
              opacity={selectedPath ? 0.92 : 0.26}
            />
          );
        })}

        {layout.nodes.map((node) => {
          const selected = node.id === selectedNodeId;
          const dimmed = Boolean(selectedNodeId && !selected && !layout.neighborIds.has(node.id));

          return (
            <GraphNode
              key={node.id}
              node={node}
              selected={selected}
              dimmed={dimmed}
              isCenter={node.kind === 'pet'}
              isQuestion={node.kind === 'question'}
              showBranchBadge={Boolean(contradiction && node.kind !== 'pet' && node.kind !== 'question')}
              universeName={universeName}
              onSelectNode={onSelectNode}
            />
          );
        })}
      </Svg>

      {selectedTooltip ? (
        <GlassView
          style={styles.tooltipCard}
          intensity={22}
          borderRadius={18}
          backgroundColor="rgba(15, 23, 42, 0.84)"
          borderColor={selectedNode?.colorCode ?? THEME.life}
        >
          <Text style={[styles.tooltipTitle, { color: selectedNode?.colorCode ?? THEME.text }]}>
            {selectedTooltip.title}
          </Text>
          <Text style={styles.tooltipDesc}>{selectedTooltip.desc}</Text>
          <Text style={styles.tooltipFlow}>{selectedTooltip.flow}</Text>
        </GlassView>
      ) : (
        <GlassView
          style={styles.tooltipCard}
          intensity={18}
          borderRadius={18}
          backgroundColor="rgba(15, 23, 42, 0.58)"
          borderColor="rgba(255, 255, 255, 0.12)"
        >
          <Text style={styles.tooltipTitle}>지도를 눌러보세요</Text>
          <Text style={styles.tooltipDesc}>
            큰 가지는 성향의 방향이고, 작은 별은 그 흐름을 만든 선택의 근거예요.
          </Text>
          {contradiction ? (
            <Text style={styles.tooltipFlow}>
              상황별 다른 나: {contradiction.high_category}와 {contradiction.low_category}에서 선택 리듬이 달라요.
            </Text>
          ) : null}
        </GlassView>
      )}
    </View>
  );
}

const GraphNode = memo(function GraphNode({
  node,
  selected,
  dimmed,
  isCenter,
  isQuestion,
  showBranchBadge,
  universeName,
  onSelectNode
}: {
  node: PositionedNode;
  selected: boolean;
  dimmed: boolean;
  isCenter: boolean;
  isQuestion: boolean;
  showBranchBadge: boolean;
  universeName: string;
  onSelectNode: (nodeId: string | null) => void;
}) {
  const radius = isCenter ? 27 : isQuestion ? 8 : Math.max(12, Math.min(22, node.size / 2));
  const label = isCenter ? `${universeName}의 지도` : shortenLabel(node.label);
  const pressHandler = () => onSelectNode(selected ? null : node.id);
  const pressProps: Record<string, unknown> = Platform.OS === 'web'
    ? { accessibilityLabel: `${label} 노드 보기`, accessibilityRole: 'button', onClick: pressHandler }
    : { accessibilityLabel: `${label} 노드 보기`, accessibilityRole: 'button', onPress: pressHandler };
  const opacity = dimmed ? 0.22 : 1;

  return (
    <G {...pressProps} opacity={opacity}>
      <Circle cx={node.x} cy={node.y} r={radius + 10} fill={node.colorCode} opacity={selected ? 0.28 : 0.13} />
      <Circle
        cx={node.x}
        cy={node.y}
        r={radius + 3}
        fill="transparent"
        stroke={node.colorCode}
        strokeWidth={selected ? 3 : 1.4}
        opacity={selected ? 0.96 : 0.54}
      />
      <Circle
        cx={node.x}
        cy={node.y}
        r={isCenter ? radius - 5 : Math.max(4, radius - 7)}
        fill={isCenter ? THEME.self : selected ? '#ffffff' : node.colorCode}
        opacity={0.95}
      />

      {showBranchBadge ? (
        <G>
          <Circle cx={node.x + radius - 1} cy={node.y - radius + 2} r={5} fill="#fef3c7" opacity={0.98} />
          <SvgText x={node.x + radius - 1} y={node.y - radius + 5} fill="#92400e" fontSize="7" fontWeight="900" textAnchor="middle">
            ≈
          </SvgText>
        </G>
      ) : null}

      <SvgText
        x={node.x}
        y={node.y + radius + 14}
        fill={selected ? '#ffffff' : 'rgba(248, 250, 252, 0.72)'}
        fontSize={isQuestion ? '8' : '9'}
        fontWeight="800"
        textAnchor="middle"
      >
        {label}
      </SvgText>
    </G>
  );
});

function createMindMapLayout(nodes: InsightGraphNode[], edges: InsightGraphEdge[], selectedNodeId: string | null) {
  const overviewIds = selectOverviewNodeIds(nodes);
  const visibleIds = expandSelectedNeighborhood(overviewIds, selectedNodeId, edges);
  const visibleNodes = nodes.filter((node) => visibleIds.has(node.id));
  const visibleEdges = edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const centerNode = visibleNodes.find((node) => node.kind === 'pet') ?? visibleNodes[0] ?? null;
  const outerNodes = visibleNodes.filter((node) => node.id !== centerNode?.id);
  const sortedOuter = [...outerNodes].sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || b.size - a.size);
  const nodesById = new Map<string, PositionedNode>();
  const positionedNodes: PositionedNode[] = [];

  if (centerNode) {
    const center = { ...centerNode, x: CENTER_X, y: CENTER_Y, colorCode: getNodeColor(centerNode) };
    positionedNodes.push(center);
    nodesById.set(center.id, center);
  }

  sortedOuter.forEach((node, index) => {
    const angle = getAngleForNode(node, index, sortedOuter.length);
    const ring = node.kind === 'question' ? 134 : node.kind === 'category' ? 96 : 118;
    const positioned = {
      ...node,
      x: CENTER_X + Math.cos(angle) * ring,
      y: CENTER_Y + Math.sin(angle) * ring,
      colorCode: getNodeColor(node)
    };
    positionedNodes.push(positioned);
    nodesById.set(positioned.id, positioned);
  });

  const neighborIds = new Set<string>();
  if (selectedNodeId) {
    neighborIds.add(selectedNodeId);
    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) neighborIds.add(edge.target);
      if (edge.target === selectedNodeId) neighborIds.add(edge.source);
    });
  }

  return {
    nodes: positionedNodes,
    nodesById,
    edges: visibleEdges,
    neighborIds
  };
}

function selectOverviewNodeIds(nodes: InsightGraphNode[]) {
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

function expandSelectedNeighborhood(visibleIds: Set<string>, selectedNodeId: string | null, edges: InsightGraphEdge[]) {
  if (!selectedNodeId) return visibleIds;
  const expanded = new Set(visibleIds);
  expanded.add(selectedNodeId);
  edges.forEach((edge) => {
    if (edge.source === selectedNodeId) expanded.add(edge.target);
    if (edge.target === selectedNodeId) expanded.add(edge.source);
  });
  return expanded;
}

function getAngleForNode(node: InsightGraphNode, index: number, total: number) {
  if (node.kind === 'category') {
    return [-Math.PI * 0.82, -Math.PI * 0.18, Math.PI * 0.26, Math.PI * 0.76][index % 4];
  }
  const spread = Math.PI * 1.72;
  const start = -Math.PI * 0.86;
  return start + (spread * index) / Math.max(1, total - 1);
}

function kindRank(kind: InsightGraphNode['kind']) {
  if (kind === 'category') return 0;
  if (kind === 'trait') return 1;
  if (kind === 'question') return 2;
  return 3;
}

function getNodeColor(node: InsightGraphNode) {
  if (node.kind === 'pet') return THEME.self;
  if (node.kind === 'question') return THEME.question;
  const text = `${node.label} ${String(node.meta?.category_slug ?? '')}`.toLowerCase();

  if (
    text.includes('food') ||
    text.includes('health') ||
    text.includes('diet') ||
    text.includes('cook') ||
    text.includes('식') ||
    text.includes('건강') ||
    text.includes('맛')
  ) {
    return THEME.food;
  }

  if (
    text.includes('romance') ||
    text.includes('connect') ||
    text.includes('relationship') ||
    text.includes('연애') ||
    text.includes('관계') ||
    text.includes('소통') ||
    text.includes('친구')
  ) {
    return THEME.relation;
  }

  return THEME.life;
}

function getTooltipContent(node: PositionedNode, snapshot: InsightGraphSnapshot) {
  const evidenceNodes = snapshot.edges
    .filter((edge) => edge.source === node.id || edge.target === node.id)
    .map((edge) => {
      const connectedId = edge.source === node.id ? edge.target : edge.source;
      return snapshot.nodes.find((item) => item.id === connectedId);
    })
    .filter((item): item is InsightGraphNode => item !== undefined && item.kind === 'question')
    .slice(0, 2);
  const evidenceLabel = evidenceNodes.map((item) => item.label).join(', ');
  const scoreText = Number.isFinite(node.score) ? `지도 점수 ${Math.round(node.score * 10) / 10}` : '선택 흐름';

  if (node.kind === 'pet') {
    return {
      title: '내 선택의 중심',
      desc: snapshot.summary.body || '밸런스 게임에서 쌓인 선택들이 이 중심에서 가지처럼 뻗어나가요.',
      flow: '중앙에서 성향 가지와 근거 질문으로 이어져요.'
    };
  }

  return {
    title: node.label,
    desc: getNodeDescription(node, snapshot),
    flow: evidenceNodes.length > 0 ? `${scoreText} · 근거: ${evidenceLabel}` : `${scoreText} · 선택이 더 쌓이면 근거가 더 선명해져요.`
  };
}

function getNodeDescription(node: InsightGraphNode, snapshot: InsightGraphSnapshot) {
  const metaDescription = node.meta?.description;
  if (typeof metaDescription === 'string' && metaDescription.trim().length > 0) {
    return metaDescription;
  }
  if (node.kind === 'category') {
    return '최근 선택이 자주 연결된 질문 묶음이에요. 이 가지를 누르면 관련 성향과 근거가 가까이 드러나요.';
  }
  if (node.kind === 'question') {
    return '이 마음 지도를 만든 대표 질문이에요. 전체 기록 대신 요약된 근거로만 보여줘요.';
  }
  if (node.kind === 'trait') {
    return '최근 선택에서 반복해서 보이는 성향 흐름이에요. 확정 진단이 아니라 지금까지의 선택 리듬입니다.';
  }
  return snapshot.summary.body || '최근 선택에서 보이는 흐름입니다.';
}

function shortenLabel(label: string) {
  return label.length > 8 ? `${label.slice(0, 8)}…` : label;
}

const styles = StyleSheet.create({
  canvasHeader: {
    left: 18,
    position: 'absolute',
    top: 18,
    zIndex: 5
  },
  canvasSubtitle: {
    color: 'rgba(248, 250, 252, 0.48)',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2
  },
  canvasTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '900'
  },
  frame: {
    backgroundColor: THEME.background,
    borderRadius: 24,
    gap: 12,
    overflow: 'hidden',
    padding: 14,
    position: 'relative'
  },
  nebulaA: {
    backgroundColor: THEME.life,
    borderRadius: 80,
    height: 160,
    opacity: 0.14,
    position: 'absolute',
    right: 18,
    top: 92,
    width: 160
  },
  nebulaB: {
    backgroundColor: THEME.relation,
    borderRadius: 76,
    bottom: 92,
    height: 152,
    left: 34,
    opacity: 0.12,
    position: 'absolute',
    width: 152
  },
  tooltipCard: {
    borderWidth: 1,
    padding: 14
  },
  tooltipDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 6
  },
  tooltipFlow: {
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 16,
    marginTop: 8
  },
  tooltipTitle: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '900'
  }
});
