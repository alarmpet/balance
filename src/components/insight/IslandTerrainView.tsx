import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InsightGraphNode, InsightGraphSnapshot } from '../../types/database.types';

type Props = {
  snapshot: InsightGraphSnapshot;
  onSelectNode: (nodeId: string) => void;
};

// 추상 노드그래프 대신 '섬 지형'으로 성향을 직관적으로 보여준다(점진 공개의 기본 모드).
// 성향 키워드 → 지형 메타포. 매칭 실패 시 기본 언덕을 쓴다.
const TERRAIN_BY_KEYWORD: { match: string[]; emoji: string; place: string }[] = [
  { match: ['안정', '차분', 'safe', 'calm'], emoji: '🏠', place: '안정의 마을' },
  { match: ['모험', '도전', 'adventure'], emoji: '⛰️', place: '모험의 언덕' },
  { match: ['계획', 'plan'], emoji: '🌲', place: '계획의 숲' },
  { match: ['즉흥', '흐름', 'flow'], emoji: '🏖️', place: '흐름의 해변' },
  { match: ['표현', 'express'], emoji: '🎪', place: '표현의 광장' },
  { match: ['혼자', 'solo'], emoji: '🌙', place: '혼자의 동굴' },
  { match: ['함께', '같이', 'social'], emoji: '🎭', place: '함께의 축제장' },
  { match: ['취향', '감성', 'comfort', 'culture'], emoji: '🎨', place: '취향의 정원' }
];

function terrainFor(label: string) {
  const lower = label.toLowerCase();
  const found = TERRAIN_BY_KEYWORD.find((t) => t.match.some((m) => lower.includes(m.toLowerCase())));
  return found ?? { emoji: '🌿', place: `${label} 지대` };
}

export function IslandTerrainView({ snapshot, onSelectNode }: Props) {
  const traits = snapshot.nodes
    .filter((node) => node.kind === 'trait')
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (traits.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>몇 번 더 선택하면 섬에 성향 지형이 솟아올라요.</Text>
      </View>
    );
  }

  const maxScore = Math.max(...traits.map((t) => t.score), 1);
  const top = traits[0];
  const second = traits[1];
  // 1, 2위 성향 점수가 가까우면 '균형의 다리'로 표현(연결을 지우지 않고 굵게).
  const hasBridge = Boolean(second) && second.score / Math.max(top.score, 1) >= 0.7;

  return (
    <View style={styles.wrap}>
      <Text style={styles.lead}>
        지금 당신의 섬은 <Text style={styles.leadStrong}>{terrainFor(top.label).place}</Text>이(가) 가장 크게 자랐어요.
      </Text>

      <View style={styles.grid}>
        {traits.map((node) => (
          <TerrainZone key={node.id} node={node} maxScore={maxScore} onPress={() => onSelectNode(node.id)} />
        ))}
      </View>

      {hasBridge ? (
        <View style={styles.bridgeBox}>
          <Text style={styles.bridgeEmoji}>🌉</Text>
          <Text style={styles.bridgeText}>
            <Text style={styles.bridgeStrong}>{terrainFor(top.label).place}</Text>와(과){' '}
            <Text style={styles.bridgeStrong}>{terrainFor(second.label).place}</Text> 사이에 균형의 다리가 놓였어요. 상황에 따라
            두 모습을 오가는 당신이에요.
          </Text>
        </View>
      ) : null}

      <Text style={styles.hint}>지형을 누르면 그 성향으로 확대해서 볼 수 있어요.</Text>
    </View>
  );
}

function TerrainZone({
  node,
  maxScore,
  onPress
}: {
  node: InsightGraphNode;
  maxScore: number;
  onPress: () => void;
}) {
  const terrain = terrainFor(node.label);
  const ratio = Math.max(0.18, Math.min(1, node.score / maxScore));
  // 점수 비율로 지형 크기를 키워 '물리적으로 자라는' 느낌을 준다.
  const minHeight = 84 + Math.round(ratio * 64);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${terrain.place}, 점수 ${Math.round(node.score)}`}
      style={[styles.zone, { minHeight, borderColor: node.color + '55', backgroundColor: node.color + '12' }]}
      onPress={onPress}
    >
      <Text style={[styles.zoneEmoji, { fontSize: 24 + Math.round(ratio * 12) }]}>{terrain.emoji}</Text>
      <Text style={styles.zonePlace}>{terrain.place}</Text>
      <Text style={styles.zoneLabel}>{node.label}</Text>
      <View style={styles.zoneBarTrack}>
        <View style={[styles.zoneBarFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: node.color }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bridgeBox: {
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    borderColor: '#a5f3fc',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    padding: 14
  },
  bridgeEmoji: { fontSize: 22 },
  bridgeStrong: { color: '#0e7490', fontWeight: '900' },
  bridgeText: { color: '#155e75', flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', minHeight: 160, padding: 20 },
  emptyText: { color: '#64748b', fontWeight: '700', lineHeight: 20, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  hint: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  lead: { color: '#334155', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  leadStrong: { color: '#0e7490', fontWeight: '900' },
  wrap: { marginTop: 6 },
  zone: {
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 12
  },
  zoneBarFill: { borderRadius: 999, height: '100%' },
  zoneBarTrack: {
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderRadius: 999,
    height: 6,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%'
  },
  zoneEmoji: { marginBottom: 4 },
  zoneLabel: { color: '#64748b', fontSize: 11, fontWeight: '800', marginTop: 2 },
  zonePlace: { color: '#0f172a', fontSize: 14, fontWeight: '900' }
});
