import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InsightGraphCanvas } from '../components/insight/InsightGraphCanvas';
import { useInsightMapStore } from '../store/insightMapStore';

type Props = {
  showBackButton?: boolean;
};

export function InsightMapScreen({ showBackButton = false }: Props) {
  const {
    snapshot,
    cards,
    selectedNodeId,
    isLoading,
    isLoadingCards,
    error,
    loadGraph,
    loadCards,
    selectNode,
    clearError
  } = useInsightMapStore();

  useEffect(() => {
    if (!snapshot) {
      void loadGraph(null, 1);
    }
    if (cards.length === 0) {
      void loadCards();
    }
  }, [cards.length, loadCards, loadGraph, snapshot]);

  const latestCard = cards[0] ?? null;
  const discoveryTitle = latestCard?.title ?? snapshot?.summary.title ?? '선택 지도를 불러오는 중';
  const discoveryBody =
    latestCard?.body ??
    snapshot?.summary.body ??
    '밸런스 게임을 조금 더 풀면, 선택들이 하나의 마음 지도로 연결돼요.';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroller} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {showBackButton ? (
            <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="이전 화면으로 돌아가기">
              <MaterialCommunityIcons name="chevron-left" size={28} color="#e0f2fe" />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Balance Island</Text>
            <Text style={styles.title}>나의 마음 지도</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={clearError} accessibilityLabel="오류 메시지 닫기">
              <MaterialCommunityIcons name="close" size={20} color="#fecdd3" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.mapShell}>
          <View style={styles.spotlight}>
            <View style={styles.spotlightIcon}>
              {isLoadingCards ? (
                <ActivityIndicator color="#67e8f9" />
              ) : (
                <MaterialCommunityIcons name="star-four-points" size={18} color="#67e8f9" />
              )}
            </View>
            <View style={styles.spotlightCopy}>
              <Text style={styles.cardLabel}>오늘의 발견</Text>
              <Text style={styles.cardTitle}>{discoveryTitle}</Text>
              <Text style={styles.summaryText}>{discoveryBody}</Text>
            </View>
          </View>

          {snapshot ? (
            <InsightGraphCanvas snapshot={snapshot} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
          ) : (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color="#67e8f9" />
              <Text style={styles.loadingTitle}>마음 지도를 배치하는 중입니다.</Text>
              <Text style={styles.emptyText}>선택과 성향의 연결을 한 화면에 정리하고 있어요.</Text>
            </View>
          )}
        </View>

        {snapshot ? (
          <View style={styles.textSummaryPanel}>
            <View style={styles.textSummaryHeader}>
              <MaterialCommunityIcons name="text-box-search-outline" size={18} color="#0f766e" />
              <Text style={styles.textSummaryLabel}>지도 요약</Text>
            </View>
            <Text style={styles.textSummaryTitle}>{snapshot.summary.title}</Text>
            <Text style={styles.textSummaryBody}>{snapshot.summary.body}</Text>
            {snapshot.contradictions.length > 0 ? (
              <View style={styles.contextNote}>
                <MaterialCommunityIcons name="source-branch" size={16} color="#0f766e" />
                <Text style={styles.contextNoteText}>
                  상황별 다른 선택 흐름 {snapshot.contradictions.length}개가 지도에 작은 배지로 표시돼요.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(103, 232, 249, 0.24)',
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  cardLabel: { color: '#67e8f9', fontSize: 12, fontWeight: '900' },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginTop: 4 },
  container: { backgroundColor: '#07111f', flex: 1 },
  content: { padding: 20, paddingBottom: 96, paddingTop: 20 },
  contextNote: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    padding: 12
  },
  contextNoteText: { color: '#0f766e', flex: 1, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  emptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 8, textAlign: 'center' },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.45)',
    borderColor: 'rgba(254, 205, 211, 0.35)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14
  },
  errorText: { color: '#fecdd3', flex: 1, fontSize: 13, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headerCopy: { flex: 1 },
  kicker: { color: '#67e8f9', fontSize: 12, fontWeight: '900' },
  loadingPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    borderColor: 'rgba(148, 163, 184, 0.18)',
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 360,
    padding: 22
  },
  loadingTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '900', marginTop: 14 },
  mapShell: {
    backgroundColor: '#08111f',
    borderColor: 'rgba(103, 232, 249, 0.22)',
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 18,
    overflow: 'hidden',
    padding: 14
  },
  scroller: { flex: 1 },
  spotlight: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(103, 232, 249, 0.2)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 14
  },
  spotlightCopy: { flex: 1 },
  spotlightIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 145, 178, 0.22)',
    borderRadius: 15,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  summaryText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 8 },
  textSummaryBody: { color: '#475569', fontSize: 13, fontWeight: '700', lineHeight: 21, marginTop: 8 },
  textSummaryHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  textSummaryLabel: { color: '#0f766e', fontSize: 12, fontWeight: '900' },
  textSummaryPanel: {
    backgroundColor: '#f8fafc',
    borderColor: '#99f6e4',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 16
  },
  textSummaryTitle: { color: '#0f172a', fontSize: 17, fontWeight: '900', marginTop: 10 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '900', marginTop: 4 }
});
