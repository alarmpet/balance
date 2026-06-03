import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useInsightMapStore } from '../../store/insightMapStore';
import { analyticsService } from '../../services/analyticsService';

export default function TodayDiscoveryCard() {
  const { cards, isLoadingCards, loadCards } = useInsightMapStore();

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const handleOpenMap = () => {
    analyticsService.track('today_discovery_map_open');
    router.push('/insight-map');
  };

  if (isLoadingCards) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#0ea5e9" />
        <Text style={styles.loadingText}>오늘의 발견을 분석하는 중...</Text>
      </View>
    );
  }

  const latestCard = cards.length > 0 ? cards[0] : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>오늘의 발견</Text>
          <Text style={styles.title}>내 생각의 작은 기록</Text>
        </View>
        <View style={styles.iconBubble}>
          <MaterialCommunityIcons name="lightning-bolt" size={24} color="#f59e0b" />
        </View>
      </View>

      {latestCard ? (
        <View style={styles.content}>
          <View style={styles.discoveryBox}>
            <Text style={styles.discoveryTitle}>{latestCard.title}</Text>
            <Text style={styles.discoveryBody}>{latestCard.body}</Text>
            <View style={styles.metaRow}>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  신뢰도 {Math.round(latestCard.confidence * 100)}%
                </Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(latestCard.created_at).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
          <Pressable style={styles.button} onPress={handleOpenMap}>
            <MaterialCommunityIcons name="map-outline" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>성향 지도 보기</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.emptyText}>
            몇 개의 선택이 쌓이면 오늘의 발견이 열려요.
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push('/')}
          >
            <MaterialCommunityIcons name="cards-outline" size={18} color="#0ea5e9" />
            <Text style={styles.emptyButtonText}>질문 선택하러 가기</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 14,
    width: '100%'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  confidenceBadge: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  confidenceText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '800'
  },
  content: {
    marginTop: 16
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700'
  },
  discoveryBody: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 8
  },
  discoveryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16
  },
  discoveryTitle: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '900'
  },
  emptyButton: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 14,
    width: '100%'
  },
  emptyButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '900'
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: 12
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerCopy: {
    flex: 1
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  kicker: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '900'
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 180,
    padding: 20
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14
  },
  title: {
    color: '#164e63',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2
  }
});
