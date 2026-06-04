import { memo, useMemo, useState } from 'react';
import Svg, { Circle, G, Line, Text as SvgText, Path } from 'react-native-svg';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import { hierarchy, tree } from 'd3-hierarchy';
import type { InsightGraphEdge, InsightGraphNode, InsightGraphSnapshot } from '../../types/database.types';
import GlassView from '../common/GlassView';
import { useAuthStore } from '../../store/authStore';

type PositionedNode = InsightGraphNode & {
  x: number;
  y: number;
  colorCode: string;
};

type TreeNodeData = {
  node: InsightGraphNode;
  children?: TreeNodeData[];
};

type InsightGraphCanvasProps = {
  snapshot: InsightGraphSnapshot;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
};

const WIDTH = 340;
const HEIGHT = 340;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

// Constellation label coordinates for background visual effect
const CONSTELLATIONS = [
  { name: '취향자리', x: 50, y: 70 },
  { name: '균형자리', x: 230, y: 65 },
  { name: '감각자리', x: 60, y: 290 },
  { name: '연결자리', x: 270, y: 280 }
];

// Star background positions
const BG_STARS = [
  { x: 30, y: 40, r: 1 },
  { x: 90, y: 80, r: 1.2 },
  { x: 45, y: 150, r: 0.8 },
  { x: 75, y: 220, r: 1 },
  { x: 120, y: 290, r: 1.5 },
  { x: 280, y: 50, r: 0.8 },
  { x: 310, y: 120, r: 1 },
  { x: 260, y: 190, r: 1.2 },
  { x: 290, y: 260, r: 0.9 },
  { x: 210, y: 310, r: 1 }
];

function getNodeColor(label: string, kind: string): string {
  if (kind === 'pet') return '#d8b4fe'; // Purple glow for center
  
  const text = (label || '').toLowerCase();
  
  // Food & Health
  if (
    text.includes('food') || 
    text.includes('health') || 
    text.includes('diet') || 
    text.includes('nutrition') || 
    text.includes('cook') || 
    text.includes('gut') || 
    text.includes('식습관') || 
    text.includes('요리') || 
    text.includes('영양')
  ) {
    return '#f97316'; // Neon Orange
  }

  // Romance & Connections
  if (
    text.includes('romance') || 
    text.includes('connect') || 
    text.includes('self-love') || 
    text.includes('relationship') || 
    text.includes('attract') || 
    text.includes('commun') || 
    text.includes('intimacy') || 
    text.includes('연애') || 
    text.includes('관계') || 
    text.includes('소통') || 
    text.includes('호감')
  ) {
    return '#ec4899'; // Neon Pink/Magenta
  }

  // Life & Balance (default / teal)
  return '#14b8a6'; // Neon Teal/Mint
}

function getTooltipContent(node: PositionedNode) {
  const label = node.label;
  const isPulsing = node.size > 25 ? ' (강하게 연결됨)' : '';
  
  if (node.kind === 'pet') {
    return {
      title: `${label}${isPulsing}`,
      desc: '나의 자아 성찰 은하의 중심핵입니다. 모든 성향들이 이 곳으로 수렴됩니다.',
      flow: '연결 흐름: 중심'
    };
  }

  if (node.colorCode === '#f97316') {
    return {
      title: `${label}${isPulsing}`,
      desc: '식습관 및 건강 분석 노드. 답변을 통해 활성화된 나의 영양 가치관입니다.',
      flow: '연결 흐름: 강함'
    };
  }

  if (node.colorCode === '#ec4899') {
    return {
      title: `${label}${isPulsing}`,
      desc: '로맨스 및 인간관계 가치관 노드. 타인과의 감정 소통 방식을 대변합니다.',
      flow: '연결 흐름: 높음'
    };
  }

  return {
    title: `${label}${isPulsing}`,
    desc: '라이프스타일과 웰니스 가치관 노드. 일상의 균형과 신체 활동을 결정짓습니다.',
    flow: '연결 흐름: 균형'
  };
}

export function InsightGraphCanvas({ snapshot, selectedNodeId, onSelectNode }: InsightGraphCanvasProps) {
  const layout = useMemo(() => createRadialLayout(snapshot.nodes, snapshot.edges), [snapshot.nodes, snapshot.edges]);
  
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return layout.nodesById.get(selectedNodeId) ?? null;
  }, [selectedNodeId, layout.nodesById]);

  const profile = useAuthStore((state) => state.profile);
  const universeName = profile ? (profile.nickname || '나') : '나';

  return (
    <View style={styles.frame}>
      {/* Nebula spots for dreamy glow matching mockup */}
      <View style={styles.nebulaOrange} pointerEvents="none" />
      <View style={styles.nebulaCyan} pointerEvents="none" />
      <View style={styles.nebulaPink} pointerEvents="none" />

      {/* Header Info Overlay */}
      <View style={styles.canvasHeader} pointerEvents="none">
        <Text style={styles.canvasTitle}>나의 성향 우주</Text>
        <Text style={styles.canvasSubtitle}>선택들이 만든 가치 지도</Text>
      </View>

      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} accessibilityLabel={snapshot.summary.title}>
        {/* Faint Stars Background */}
        {BG_STARS.map((star, i) => (
          <Circle key={`star-${i}`} cx={star.x} cy={star.y} r={star.r} fill="#ffffff" opacity={0.35} />
        ))}

        {/* Glowing crescent moon in top-right */}
        <Path 
          d="M275,30 A14,14 0 0,0 293,48 A12,12 0 1,1 275,30" 
          fill="#f8fafc" 
          opacity={0.8} 
        />

        {/* Background Constellation Texts */}
        {CONSTELLATIONS.map((c, i) => (
          <SvgText
            key={`const-${i}`}
            x={c.x}
            y={c.y}
            fill="#ffffff"
            fontSize="8"
            fontWeight="300"
            opacity={0.12}
            textAnchor="middle"
          >
            {c.name}
          </SvgText>
        ))}

        {/* Starry Constellation Dotted Edges */}
        {layout.edges.map((edge) => {
          const source = layout.nodesById.get(edge.source);
          const target = layout.nodesById.get(edge.target);
          if (!source || !target) return null;

          const isSelectedPath = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
          let strokeColor = 'rgba(255, 255, 255, 0.12)';
          if (isSelectedPath) {
            strokeColor = source.colorCode || '#14b8a6';
          }

          return (
            <Line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={strokeColor}
              strokeLinecap="round"
              strokeWidth={isSelectedPath ? 3.0 : 1.0}
              strokeDasharray={isSelectedPath ? undefined : "3 3"} // Constellation dotted line look
              opacity={isSelectedPath ? 0.95 : 0.25}
            />
          );
        })}

        {/* Render Graph Nodes */}
        {layout.nodes.map((node) => {
          const selected = node.id === selectedNodeId;
          const isCenter = node.kind === 'pet';
          const nodeColor = node.colorCode;

          return (
            <GraphNode
              key={node.id}
              node={node}
              selected={selected}
              isCenter={isCenter}
              nodeColor={nodeColor}
              universeName={universeName}
              onSelectNode={onSelectNode}
            />
          );
        })}
      </Svg>

      {/* Interactive Speech Callout Tooltip matching mockup */}
      {selectedNode ? (
        <View 
          style={[
            styles.tooltipContainer,
            {
              top: selectedNode.y < 150 ? selectedNode.y + 24 : selectedNode.y - 126,
              left: Math.max(16, Math.min(Dimensions.get('window').width - 250, selectedNode.x - 100))
            }
          ]}
        >
          <GlassView 
            style={styles.tooltipCard}
            intensity={24}
            borderRadius={16}
            backgroundColor="rgba(15, 23, 42, 0.85)"
            borderColor={selectedNode.colorCode}
          >
            <Text style={[styles.tooltipTitle, { color: selectedNode.colorCode }]}>
              {getTooltipContent(selectedNode).title}
            </Text>
            <Text style={styles.tooltipDesc}>
              {getTooltipContent(selectedNode).desc}
            </Text>
            <Text style={styles.tooltipFlow}>
              {getTooltipContent(selectedNode).flow}
            </Text>
          </GlassView>
          {/* Tooltip Arrow */}
          <View 
            style={[
              styles.tooltipArrow,
              selectedNode.y < 150 ? styles.tooltipArrowTop : styles.tooltipArrowBottom,
              { borderColor: selectedNode.colorCode }
            ]} 
          />
        </View>
      ) : null}

      {/* Bottom Summary Panel */}
      <GlassView 
        style={styles.summaryCard}
        intensity={24}
        borderRadius={18}
        backgroundColor="rgba(15, 23, 42, 0.55)"
        borderColor="rgba(255, 255, 255, 0.12)"
      >
        <Text style={styles.summaryTitle}>{selectedNode?.label ?? snapshot.summary.title}</Text>
        <Text style={styles.summaryText}>
          {selectedNode ? `현재 은하 지도에서 "${selectedNode.label}" 성향 노드가 환하게 활성화되어 연결을 비추고 있습니다.` : snapshot.summary.body}
        </Text>
      </GlassView>
    </View>
  );
}

const GraphNode = memo(function GraphNode({
  node,
  selected,
  isCenter,
  nodeColor,
  universeName,
  onSelectNode
}: {
  node: PositionedNode;
  selected: boolean;
  isCenter: boolean;
  nodeColor: string;
  universeName: string;
  onSelectNode: (nodeId: string | null) => void;
}) {
  const radius = isCenter ? 26 : Math.max(10, Math.min(22, node.size / 2));

  // On web, use onClick to avoid react-native-svg's SvgTouchableMixin
  // which injects unsupported responder props into the DOM
  const pressHandler = () => onSelectNode(selected ? null : node.id);
  const pressProps: any = Platform.OS === 'web'
    ? { onClick: pressHandler }
    : { onPress: pressHandler };

  return (
    <G {...pressProps}>
      {/* Glow outer ring */}
      <Circle
        cx={node.x}
        cy={node.y}
        r={selected ? radius + 5 : radius}
        fill="transparent"
        stroke={nodeColor}
        strokeWidth={selected ? 3.5 : 1.5}
        opacity={selected ? 0.95 : 0.55}
      />
      
      {/* Inner Node Core */}
      {isCenter ? (
        <Circle 
          cx={node.x} 
          cy={node.y} 
          r={radius - 2} 
          fill="#cbd5e1" // Mock user photo placeholder
        />
      ) : (
        <Circle 
          cx={node.x} 
          cy={node.y} 
          r={Math.max(3, radius - 8)} 
          fill={selected ? '#ffffff' : nodeColor} 
          opacity={0.9} 
        />
      )}
      
      {/* Text label underneath */}
      <SvgText
        x={node.x}
        y={node.y + radius + 14}
        fill={selected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'}
        fontSize="9"
        fontWeight="800"
        textAnchor="middle"
      >
        {isCenter ? `${universeName}의 우주` : shortenLabel(node.label)}
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
    const centerColor = getNodeColor(centerNode.label, centerNode.kind);
    const center = { ...centerNode, x: CENTER_X, y: CENTER_Y, colorCode: centerColor };
    positionedNodes.push(center);
    nodesById.set(center.id, center);
  }

  const root = hierarchy<TreeNodeData>({
    node: centerNode,
    children: outerNodes.map((node) => ({ node }))
  });
  
  const treeLayout = tree<TreeNodeData>().size([Math.PI * 2, 126]);
  const laidOut = treeLayout(root).children ?? [];

  laidOut.forEach((item) => {
    const node = item.data.node;
    if (!node) return;
    const ring = node.kind === 'question' ? 126 : node.kind === 'category' ? 104 : 84;
    const angle = item.x - Math.PI / 2;
    const x = CENTER_X + Math.cos(angle) * ring;
    const y = CENTER_Y + Math.sin(angle) * ring;
    const nodeColor = getNodeColor(node.label, node.kind);
    const positioned = { ...node, x, y, colorCode: nodeColor };
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

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#070b19', // Deep dark starry space background
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    gap: 14
  },
  canvasHeader: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 5
  },
  canvasTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  canvasSubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2
  },
  nebulaOrange: {
    position: 'absolute',
    left: 10,
    top: 30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f97316',
    opacity: 0.14,
    // @ts-ignore
    filter: 'blur(60px)',
    webkitFilter: 'blur(60px)'
  },
  nebulaCyan: {
    position: 'absolute',
    right: 20,
    top: 90,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#14b8a6',
    opacity: 0.16,
    // @ts-ignore
    filter: 'blur(65px)',
    webkitFilter: 'blur(65px)'
  },
  nebulaPink: {
    position: 'absolute',
    left: 80,
    bottom: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ec4899',
    opacity: 0.13,
    // @ts-ignore
    filter: 'blur(55px)',
    webkitFilter: 'blur(55px)'
  },
  summaryCard: {
    padding: 14
  },
  summaryText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900'
  },
  tooltipContainer: {
    position: 'absolute',
    width: 200,
    zIndex: 10,
    alignItems: 'center'
  },
  tooltipCard: {
    padding: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '900'
  },
  tooltipDesc: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 13,
    marginTop: 4
  },
  tooltipFlow: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 6,
    textTransform: 'uppercase'
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(15, 23, 42, 0.85)',
    position: 'absolute'
  },
  tooltipArrowTop: {
    top: -6,
    transform: [{ rotate: '0deg' }]
  },
  tooltipArrowBottom: {
    bottom: -6,
    transform: [{ rotate: '180deg' }]
  }
});
