import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import type { GamificationSnapshot } from '../../services/gamificationService';
import { analyticsService } from '../../services/analyticsService';
import { traitLabel } from '../../utils/traitLabels';

type Props = {
  snapshot: GamificationSnapshot;
};

// Spotify Wrapped식 데이터 스토리텔링 카드(바이럴 엔진). "데이터를 돌려주면 자발적으로 공유한다".
// 정확한 주간 윈도우는 서버 히스토리가 필요하므로, 여기서는 누적 데이터로 솔직하게 요약한다.
export function WeeklyRecapCard({ snapshot }: Props) {
  const top = [...snapshot.traits].sort((a, b) => b.score - a.score)[0];
  const total = snapshot.profile.total_participation_count;

  if (!top || total <= 0) {
    return null; // 데이터가 없으면 노출하지 않는다(빈 카드 방지).
  }

  const topLabel = traitLabel(top.trait_key);
  const streak = snapshot.profile.streak_count;
  const petName = snapshot.petState?.nickname?.trim() || snapshot.petSpecies?.display_name || '내 펫';

  const petLine = `"${petName}: 요즘 주인은 '${topLabel}' 쪽으로 마음이 기우는 것 같아. 그 결이 참 너다워."`;

  const handleShare = async () => {
    analyticsService.track('share_card_generate', { kind: 'weekly_recap', topTrait: top.trait_key });
    try {
      await Share.share({
        message: `🌊 나의 밸런스 요약\n· 지금까지 ${total}개의 선택\n· 가장 진한 성향: ${topLabel}\n· 연속 참여 ${streak}일\n${petLine}\n\n#밸런스아일랜드 #나를발견하는섬`
      });
      analyticsService.track('share_card_complete', { kind: 'weekly_recap' });
    } catch {
      // 사용자가 공유를 취소했거나 share API 미지원. 조용히 무시.
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.kicker}>🌊 나의 밸런스 요약</Text>
        <View style={styles.wrappedBadge}>
          <Text style={styles.wrappedBadgeText}>WRAPPED</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <Stat value={String(total)} label="누적 선택" />
        <View style={styles.statDivider} />
        <Stat value={topLabel} label="가장 진한 성향" highlight />
        <View style={styles.statDivider} />
        <Stat value={`${streak}일`} label="연속 참여" />
      </View>

      <View style={styles.petBubble}>
        <MaterialCommunityIcons name="paw" size={16} color="#0e7490" />
        <Text style={styles.petText}>{petLine}</Text>
      </View>

      <Pressable style={styles.shareButton} onPress={handleShare} accessibilityRole="button" accessibilityLabel="요약 카드 공유하기">
        <MaterialCommunityIcons name="share-variant" size={18} color="#ffffff" />
        <Text style={styles.shareButtonText}>공유하기</Text>
      </Pressable>
    </View>
  );
}

function Stat({ value, label, highlight = false }: { value: string; label: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight ? styles.statValueHighlight : null]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f766e',
    borderRadius: 22,
    marginTop: 16,
    padding: 18
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  petBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    padding: 12
  },
  petText: { color: '#ecfeff', flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  shareButton: {
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48
  },
  shareButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { backgroundColor: 'rgba(255,255,255,0.2)', height: 34, width: 1 },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  statRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  statValue: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  statValueHighlight: { color: '#fde68a' },
  wrappedBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  wrappedBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});
