import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ContradictionCard } from '../components/insight/ContradictionCard';
import { InsightGraphCanvas } from '../components/insight/InsightGraphCanvas';
import { InsightNodeDetailSheet } from '../components/insight/InsightNodeDetailSheet';
import { IslandTerrainView } from '../components/insight/IslandTerrainView';
import { useInsightMapStore } from '../store/insightMapStore';

type InsightTab = 'discover' | 'terrain' | 'links';

// 별자리 클러스터 범례(시안의 라벨 클러스터). 색은 THEME.glowByCluster와 정렬.
const CLUSTER_LEGEND = [
  { label: '푸드·건강', color: '#f59e0b' },
  { label: '삶·균형', color: '#14b8a6' },
  { label: '관계·연결', color: '#d946ef' }
];

type Props = {
  showBackButton?: boolean;
};

export function InsightMapScreen({ showBackButton = false }: Props) {
  const {
    snapshot,
    cards,
    selectedNodeId,
    focusNodeId,
    depth,
    isLoading,
    isLoadingCards,
    error,
    loadGraph,
    loadCards,
    selectNode,
    focusOnNode,
    setDepth,
    markCardRead,
    clearError
  } = useInsightMapStore();
  const [activeTab, setActiveTab] = useState<InsightTab>('terrain');

  useEffect(() => {
    if (!snapshot) {
      void loadGraph(null, 1);
    }
    if (cards.length === 0) {
      void loadCards();
    }
  }, [cards.length, loadCards, loadGraph, snapshot]);

  const selectedNode = useMemo(() => {
    if (!snapshot || !selectedNodeId) return null;
    return snapshot.nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [selectedNodeId, snapshot]);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {showBackButton ? (
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#164e63" />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>나의 선택 지도</Text>
            <Text style={styles.title}>성향 인사이트 맵</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={clearError}>
              <MaterialCommunityIcons name="close" size={20} color="#be123c" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.segmented}>
          <TabButton label="발견" active={activeTab === 'discover'} onPress={() => setActiveTab('discover')} />
          <TabButton label="섬 지형" active={activeTab === 'terrain'} onPress={() => setActiveTab('terrain')} />
          <TabButton label="별자리" active={activeTab === 'links'} onPress={() => setActiveTab('links')} />
        </View>

        {activeTab === 'discover' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.cardLabel}>오늘의 발견</Text>
                <Text style={styles.cardTitle}>선택에서 보이는 흐름</Text>
              </View>
              {isLoadingCards ? <ActivityIndicator color="#0ea5e9" /> : null}
            </View>
            {cards.length === 0 ? (
              <Text style={styles.emptyText}>질문에 답하면 오늘의 발견 카드가 생겨요.</Text>
            ) : (
              cards.map((card) => (
                <Pressable
                  key={card.id}
                  style={[styles.insightCard, card.is_read ? styles.readInsightCard : null]}
                  accessibilityLabel={`${card.title}. ${card.body}`}
                  onPress={() => markCardRead(card.id)}
                >
                  <Text style={styles.insightTitle}>{card.title}</Text>
                  <Text style={styles.insightBody}>{card.body}</Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>신뢰도</Text>
                    <Text style={styles.confidenceValue}>{Math.round(card.confidence * 100)}%</Text>
                  </View>
                </Pressable>
              ))
            )}

            {snapshot && snapshot.contradictions.length > 0 ? (
              <View style={styles.contradictionSection}>
                <Text style={styles.cardLabel}>상황별 다른 나</Text>
                {snapshot.contradictions.map((item) => (
                  <ContradictionCard key={item.id} contradiction={item} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'terrain' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.cardLabel}>섬 지형</Text>
                <Text style={styles.cardTitle}>{snapshot?.summary.title ?? '지도를 불러오는 중'}</Text>
              </View>
              {isLoading ? <ActivityIndicator color="#0ea5e9" /> : null}
            </View>
            {snapshot ? (
              <IslandTerrainView snapshot={snapshot} onSelectNode={selectNode} />
            ) : (
              <View style={styles.loadingPanel}>
                <ActivityIndicator color="#0ea5e9" />
                <Text style={styles.emptyText}>성향 지형을 솟아올리는 중입니다.</Text>
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'links' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.cardLabel}>별자리 연결</Text>
                <Text style={styles.cardTitle}>{snapshot?.summary.title ?? '지도를 불러오는 중'}</Text>
              </View>
              {isLoading ? <ActivityIndicator color="#0ea5e9" /> : null}
            </View>
            <Text style={styles.summaryText}>{snapshot?.summary.body ?? '잠시만 기다려 주세요.'}</Text>

            <View style={styles.depthRow}>
              <DepthButton label="1단계" active={depth === 1} onPress={() => setDepth(1)} />
              <DepthButton label="2단계" active={depth === 2} onPress={() => setDepth(2)} />
            </View>

            {focusNodeId ? (
              <Pressable style={styles.resetFocusButton} onPress={() => focusOnNode(null)}>
                <MaterialCommunityIcons name="arrow-expand-all" size={16} color="#0369a1" />
                <Text style={styles.resetFocusText}>전체 별자리 보기</Text>
              </Pressable>
            ) : null}

            <View style={styles.clusterLegend}>
              {CLUSTER_LEGEND.map((c) => (
                <View key={c.label} style={styles.clusterItem}>
                  <View style={[styles.clusterDot, { backgroundColor: c.color, shadowColor: c.color }]} />
                  <Text style={styles.clusterLabel}>{c.label}</Text>
                </View>
              ))}
            </View>

            {snapshot ? (
              <InsightGraphCanvas snapshot={snapshot} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
            ) : (
              <View style={styles.loadingPanel}>
                <ActivityIndicator color="#0ea5e9" />
                <Text style={styles.emptyText}>별자리를 배치하는 중입니다.</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      <InsightNodeDetailSheet node={selectedNode} onClose={() => selectNode(null)} onFocus={focusOnNode} />
    </>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabButton, active ? styles.activeTabButton : null]} onPress={onPress}>
      <Text style={[styles.tabText, active ? styles.activeTabText : null]}>{label}</Text>
    </Pressable>
  );
}

function DepthButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.depthButton, active ? styles.activeDepthButton : null]} onPress={onPress}>
      <Text style={[styles.depthText, active ? styles.activeDepthText : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeDepthButton: { backgroundColor: '#0ea5e9' },
  activeDepthText: { color: '#ffffff' },
  activeTabButton: { backgroundColor: '#0ea5e9' },
  activeTabText: { color: '#ffffff' },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  cardLabel: { color: '#0ea5e9', fontSize: 12, fontWeight: '900' },
  cardTitle: { color: '#164e63', fontSize: 19, fontWeight: '900', marginTop: 4 },
  confidenceLabel: { color: '#64748b', fontWeight: '800' },
  confidenceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  confidenceValue: { color: '#0ea5e9', fontWeight: '900' },
  container: { backgroundColor: '#ecfeff', flex: 1 },
  clusterLegend: { flexDirection: 'row', gap: 14, justifyContent: 'center', marginBottom: 12, marginTop: 2 },
  clusterItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  clusterDot: { borderRadius: 999, height: 10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, width: 10 },
  clusterLabel: { color: '#475569', fontSize: 11, fontWeight: '800' },
  contradictionSection: { borderTopColor: '#e2e8f0', borderTopWidth: 1, marginTop: 18, paddingTop: 16 },
  resetFocusButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  resetFocusText: { color: '#0369a1', fontSize: 12, fontWeight: '900' },
  content: { padding: 20, paddingBottom: 92, paddingTop: 56 },
  depthButton: { alignItems: 'center', backgroundColor: '#e0f2fe', borderRadius: 999, flex: 1, paddingVertical: 9 },
  depthRow: { flexDirection: 'row', gap: 8, marginBottom: 14, marginTop: 14 },
  depthText: { color: '#075985', fontSize: 12, fontWeight: '900' },
  emptyText: { color: '#64748b', fontWeight: '700', lineHeight: 20, marginTop: 14 },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14
  },
  errorText: { color: '#be123c', flex: 1, fontSize: 13, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headerCopy: { flex: 1 },
  insightBody: { color: '#64748b', fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 8 },
  insightCard: { backgroundColor: '#f8fafc', borderColor: '#dbeafe', borderRadius: 18, borderWidth: 1, marginTop: 14, padding: 16 },
  insightTitle: { color: '#164e63', fontSize: 16, fontWeight: '900' },
  kicker: { color: '#0ea5e9', fontSize: 12, fontWeight: '900' },
  loadingPanel: { alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  panel: { backgroundColor: '#ffffff', borderColor: '#bae6fd', borderRadius: 24, borderWidth: 1, marginTop: 16, padding: 18 },
  panelHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  readInsightCard: { opacity: 0.72 },
  segmented: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
    padding: 6
  },
  summaryText: { color: '#64748b', fontSize: 13, fontWeight: '700', lineHeight: 20, marginBottom: 10, marginTop: 10 },
  tabButton: { alignItems: 'center', borderRadius: 14, flex: 1, paddingVertical: 10 },
  tabText: { color: '#075985', fontSize: 13, fontWeight: '900' },
  title: { color: '#164e63', fontSize: 25, fontWeight: '900', marginTop: 4 }
});
