import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { guestInsightGraph } from '../../data/guestInsightGraph';
import type { GamificationSnapshot } from '../../services/gamificationService';

type InsightMapPreviewProps = {
  snapshot: GamificationSnapshot;
  onOpen: () => void;
};

export function InsightMapPreview({ snapshot, onOpen }: InsightMapPreviewProps) {
  const isGuest = snapshot.profile.id === 'guest';
  const traitCount = isGuest ? 8 : Math.max(snapshot.traits.length, 0);
  const participation = isGuest ? 30 : snapshot.profile.total_participation_count;
  const title = isGuest ? guestInsightGraph.summary.title : '나의 선택 지도';
  const body = isGuest
    ? '로그인하면 실제 선택으로 지도가 자라나요.'
    : `${participation}개의 선택이 ${traitCount}개의 성향 가지로 연결되고 있어요.`;

  return (
    <View style={styles.card} accessibilityLabel={`${title}. ${body}`}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>인사이트 지도</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.iconBubble}>
          <MaterialCommunityIcons name="graph-outline" size={28} color="#0ea5e9" />
        </View>
      </View>

      <View style={styles.previewGraph}>
        <View style={[styles.node, styles.centerNode]} />
        <View style={[styles.node, styles.nodeA]} />
        <View style={[styles.node, styles.nodeB]} />
        <View style={[styles.node, styles.nodeC]} />
        <View style={styles.lineA} />
        <View style={styles.lineB} />
        <View style={styles.lineC} />
      </View>

      <Text style={styles.body}>{body}</Text>

      <Pressable style={styles.button} onPress={onOpen}>
        <MaterialCommunityIcons name="map-search" size={19} color="#ffffff" />
        <Text style={styles.buttonText}>지도 열기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 14
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0ea5e9',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900'
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    padding: 18
  },
  centerNode: {
    backgroundColor: '#38bdf8',
    height: 42,
    left: 90,
    top: 39,
    width: 42,
    zIndex: 2
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52
  },
  kicker: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '900'
  },
  lineA: {
    backgroundColor: '#bae6fd',
    height: 3,
    left: 70,
    position: 'absolute',
    top: 52,
    transform: [{ rotate: '-28deg' }],
    width: 72
  },
  lineB: {
    backgroundColor: '#bae6fd',
    height: 3,
    left: 103,
    position: 'absolute',
    top: 58,
    transform: [{ rotate: '24deg' }],
    width: 82
  },
  lineC: {
    backgroundColor: '#bae6fd',
    height: 3,
    left: 83,
    position: 'absolute',
    top: 82,
    transform: [{ rotate: '32deg' }],
    width: 66
  },
  node: {
    borderColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 4,
    position: 'absolute'
  },
  nodeA: {
    backgroundColor: '#f59e0b',
    height: 32,
    left: 35,
    top: 20,
    width: 32
  },
  nodeB: {
    backgroundColor: '#14b8a6',
    height: 34,
    right: 32,
    top: 22,
    width: 34
  },
  nodeC: {
    backgroundColor: '#a78bfa',
    bottom: 12,
    height: 30,
    left: 145,
    width: 30
  },
  previewGraph: {
    alignSelf: 'center',
    backgroundColor: '#f0f9ff',
    borderColor: '#dbeafe',
    borderRadius: 24,
    borderWidth: 1,
    height: 118,
    marginTop: 16,
    overflow: 'hidden',
    width: 236
  },
  title: {
    color: '#164e63',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4
  }
});
