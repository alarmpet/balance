import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hierarchy, tree } from 'd3-hierarchy';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import type { InsightGraphEdge, InsightGraphNode, InsightGraphSnapshot } from '../../types/database.types';

type PositionedNode = InsightGraphNode & {
  x: number;
  y: number;
};

type TreeNodeData = {
  node: InsightGraphNode;
  children?: TreeNodeData[];
};

type InsightGraphCanvasProps = {
  snapshot: InsightGraphSnapshot;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
};

const WIDTH = 340;
const HEIGHT = 340;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

export function InsightGraphCanvas({ snapshot, selectedNodeId, onSelectNode }: InsightGraphCanvasProps) {
  const layout = useMemo(() => createRadialLayout(snapshot.nodes, snapshot.edges), [snapshot.nodes, snapshot.edges]);
  const selectedNode = selectedNodeId ? layout.nodesById.get(selectedNodeId) ?? null : null;

  return (
    <View style={styles.frame}>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} accessibilityLabel={snapshot.summary.title}>
        {layout.edges.map((edge) => {
          const source = layout.nodesById.get(edge.source);
          const target = layout.nodesById.get(edge.target);
          if (!source || !target) return null;

          return (
            <Line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId) ? '#0ea5e9' : '#bae6fd'}
              strokeLinecap="round"
              strokeWidth={2 + Math.min(4, edge.weight * 4)}
            />
          );
        })}

        {layout.nodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            selected={node.id === selectedNodeId}
            onSelectNode={onSelectNode}
          />
        ))}
      </Svg>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{selectedNode?.label ?? snapshot.summary.title}</Text>
        <Text style={styles.summaryText}>
          {selectedNode ? describeNode(selectedNode) : snapshot.summary.body}
        </Text>
      </View>
    </View>
  );
}

const GraphNode = memo(function GraphNode({
  node,
  selected,
  onSelectNode
}: {
  node: PositionedNode;
  selected: boolean;
  onSelectNode: (nodeId: string) => void;
}) {
  const radius = Math.max(10, Math.min(28, node.size / 2));

  return (
    <G onPress={() => onSelectNode(node.id)}>
      <Circle
        cx={node.x}
        cy={node.y}
        r={selected ? radius + 5 : radius}
        fill={selected ? '#fff7ed' : '#ffffff'}
        stroke={selected ? '#f59e0b' : node.color}
        strokeWidth={selected ? 4 : 3}
      />
      <Circle cx={node.x} cy={node.y} r={Math.max(5, radius - 8)} fill={node.color} opacity={selected ? 0.95 : 0.76} />
      <SvgText
        x={node.x}
        y={node.y + radius + 15}
        fill="#164e63"
        fontSize="10"
        fontWeight="700"
        textAnchor="middle"
      >
        {shortenLabel(node.label)}
      </SvgText>
    </G>
  );
});

function createRadialLayout(nodes: InsightGraphNode[], edges: InsightGraphEdge[]) {
  const centerNode = nodes.find((node) => node.kind === 'pet') ?? nodes[0];
  const outerNodes = nodes.filter((node) => node.id !== centerNode?.id);
  const nodesById = new Map<string, PositionedNode>();
  const positionedNodes: PositionedNode[] = [];

  if (centerNode) {
    const center = { ...centerNode, x: CENTER_X, y: CENTER_Y };
    positionedNodes.push(center);
    nodesById.set(center.id, center);
  }

  const root = hierarchy<TreeNodeData>({
    node: centerNode,
    children: outerNodes.map((node) => ({ node }))
  });
  const treeLayout = tree<TreeNodeData>().size([Math.PI * 2, 132]);
  const laidOut = treeLayout(root).children ?? [];

  laidOut.forEach((item) => {
    const node = item.data.node;
    if (!node) return;
    const ring = node.kind === 'question' ? 132 : node.kind === 'category' ? 110 : 88;
    const angle = item.x - Math.PI / 2;
    const x = CENTER_X + Math.cos(angle) * ring;
    const y = CENTER_Y + Math.sin(angle) * ring;
    const positioned = { ...node, x, y };
    positionedNodes.push(positioned);
    nodesById.set(node.id, positioned);
  });

  return {
    nodes: positionedNodes,
    nodesById,
    edges
  };
}

function shortenLabel(label: string) {
  return label.length > 8 ? `${label.slice(0, 8)}…` : label;
}

function describeNode(node: InsightGraphNode) {
  if (node.kind === 'trait') return `${node.label} 성향이 선택 지도에서 크게 반짝이고 있어요.`;
  if (node.kind === 'category') return `${node.label} 질문들이 최근 선택 흐름과 연결되어 있어요.`;
  if (node.kind === 'question') return `이 질문은 현재 지도의 근거 조각으로 쓰였어요.`;
  return `이 노드는 내 선택 지도에서 중심 역할을 하고 있어요.`;
}

const styles = StyleSheet.create({
  frame: {
    gap: 14
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbeafe',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14
  },
  summaryText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  summaryTitle: {
    color: '#164e63',
    fontSize: 16,
    fontWeight: '900'
  }
});
