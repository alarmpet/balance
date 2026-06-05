import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { router } from 'expo-router';
import { analyticsService } from '../../services/analyticsService';
import { useAuthStore } from '../../store/authStore';
import {
  fetchBestMatches,
  fetchFriendsView,
  fetchMyIslandType,
  isIslandTypeConfident,
  type FriendsIslandView,
  type IslandBestMatch,
  type IslandType
} from '../../services/islandTypeService';

const GUESS_BASE_URL = 'https://balance-vert.vercel.app/guess/';

/**
 * "넌 무슨 섬이야?" 정체성 카드. 4축 우세극으로 산출된 16섬 + 항해 수식어를 보여준다.
 * 표본이 적으면(신뢰도 낮음) 잠정 표기("아직 ○○ 섬에 가까워요").
 */
export function IslandTypeCard() {
  const [type, setType] = useState<IslandType | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendsIslandView | null>(null);
  const [matches, setMatches] = useState<IslandBestMatch[]>([]);
  const cardRef = useRef<View>(null);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const handleAskFriends = async () => {
    if (!userId) return;
    const link = `${GUESS_BASE_URL}${userId}`;
    const message = `내가 무슨 섬처럼 보여? 30초만 골라줘 🙏\n${link}\n\n#밸런스아일랜드 #친구가보는내섬`;
    try {
      await Share.share({ message, url: Platform.OS === 'web' ? undefined : link });
    } catch {
      // 취소/미지원 무시
    }
  };

  const handleShare = async () => {
    if (!type) return;
    analyticsService.track('share_card_generate', { kind: 'island_type', code: type.code });
    const message =
      `나는 ${type.emoji} ${type.name} · ${type.voyage}\n` +
      `${type.archipelago_emoji} ${type.archipelago}\n` +
      `"${type.tagline}"\n\n` +
      `넌 무슨 섬이야? #밸런스아일랜드 #섬테스트`;
    try {
      if (Platform.OS !== 'web' && cardRef.current) {
        try {
          const uri = await captureRef(cardRef, { format: 'png', quality: 0.95 });
          await Share.share({ message, url: uri });
          analyticsService.track('share_card_complete', { kind: 'island_type', withImage: true });
          return;
        } catch {
          // 캡처 실패 → 텍스트 공유 폴백
        }
      }
      await Share.share({ message });
      analyticsService.track('share_card_complete', { kind: 'island_type', withImage: false });
    } catch {
      // 공유 취소/미지원 → 무시
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await fetchMyIslandType();
        if (active) setType(result);
        if (result) {
          try {
            const bm = await fetchBestMatches(result.code, 2);
            if (active) setMatches(bm);
          } catch {
            // 매칭 실패는 무시
          }
        }
        try {
          const fv = await fetchFriendsView();
          if (active) setFriends(fv);
        } catch {
          // 친구 집계 실패는 무시
        }
      } catch {
        // 산출 실패는 조용히 무시(카드만 숨김).
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading || !type) return null;

  const confident = isIslandTypeConfident(type);
  const pct = Math.round(type.confidence * 100);

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, confident ? styles.cardConfident : styles.cardTentative]}
    >
      <Text style={styles.kicker}>
        {type.archipelago_emoji} {type.archipelago}
      </Text>

      <View style={styles.headerRow}>
        <Text style={styles.emoji}>{type.emoji}</Text>
        <View style={styles.headerCopy}>
          <Text style={styles.name}>
            {confident ? '나는 ' : '아직 '}
            {type.name}
            <Text style={styles.voyage}> · {type.voyage}</Text>
          </Text>
          <Text style={styles.tagline}>{type.tagline}</Text>
        </View>
      </View>

      <View style={styles.axisRow}>
        <AxisChip label={type.is_social ? '함께 충전' : '혼자 충전'} />
        <AxisChip label={type.is_curious ? '새로움' : '익숙함'} />
        <AxisChip label={type.is_express ? '표현형' : '담담형'} />
        <AxisChip label={type.is_flow ? '즉흥형' : '계획형'} />
      </View>

      {confident ? (
        <Text style={styles.confidenceConfident}>이 섬에 확실히 가까워요 ({pct}%)</Text>
      ) : (
        <Text style={styles.confidenceTentative}>
          아직 잠정이에요 ({pct}%) · 더 풀수록 섬이 또렷해져요
        </Text>
      )}

      {matches.length > 0 ? (
        <View style={styles.matchBox}>
          <Text style={styles.matchTitle}>나와 잘 맞는 섬</Text>
          <View style={styles.matchRow}>
            {matches.map((m) => (
              <Pressable
                key={m.code}
                accessibilityRole="button"
                accessibilityLabel={`${m.name} 궁합 보기`}
                style={styles.matchChip}
                onPress={() =>
                  // /compat은 신규 라우트 → expo 타입젠 전까지 캐스팅(런타임 정상).
                  router.push(`/compat?a=${type.code}&b=${m.code}` as never)
                }
              >
                <Text style={styles.matchEmoji}>{m.emoji}</Text>
                <Text style={styles.matchName}>{m.name}</Text>
                <Text style={styles.matchScore}>{m.romance_score}%</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {friends && friends.responses > 0 ? (
        <View style={styles.friendsBox}>
          <Text style={styles.friendsTitle}>
            친구 {friends.responses}명이 본 나{friends.guessed_emoji ? ` ${friends.guessed_emoji}` : ''}
            {friends.guessed_name ? ` ${friends.guessed_name}` : ''}
          </Text>
          <Text style={styles.friendsLine}>
            함께 {friends.social_pct}% · 새로움 {friends.curious_pct}% · 표현 {friends.express_pct}% · 즉흥 {friends.flow_pct}%
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="내 섬 카드 공유"
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
        >
          <MaterialCommunityIcons name="share-variant" size={16} color="#ffffff" />
          <Text style={styles.shareButtonText}>내 섬 공유</Text>
        </Pressable>
        {userId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="친구에게 내 섬 물어보기"
            style={[styles.actionButton, styles.askButton]}
            onPress={handleAskFriends}
          >
            <MaterialCommunityIcons name="account-question" size={16} color="#0f766e" />
            <Text style={styles.askButtonText}>친구에게 물어보기</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AxisChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 18
  },
  cardConfident: {
    backgroundColor: 'rgba(13, 148, 136, 0.10)',
    borderColor: 'rgba(13, 148, 136, 0.35)'
  },
  cardTentative: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.35)'
  },
  kicker: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900'
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginTop: 8
  },
  emoji: {
    fontSize: 44
  },
  headerCopy: {
    flex: 1
  },
  name: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26
  },
  voyage: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '900'
  },
  tagline: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 4
  },
  axisRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(15, 118, 110, 0.2)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  chipText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800'
  },
  confidenceConfident: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12
  },
  confidenceTentative: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12
  },
  matchBox: {
    marginTop: 14
  },
  matchTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8
  },
  matchRow: {
    flexDirection: 'row',
    gap: 8
  },
  matchChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(15,118,110,0.2)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  matchEmoji: {
    fontSize: 18
  },
  matchName: {
    color: '#0f172a',
    flex: 1,
    fontSize: 13,
    fontWeight: '800'
  },
  matchScore: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '900'
  },
  friendsBox: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(15,118,110,0.18)',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 12
  },
  friendsTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  },
  friendsLine: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44
  },
  shareButton: {
    backgroundColor: '#0f766e'
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  askButton: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(15,118,110,0.3)',
    borderWidth: 1
  },
  askButtonText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '900'
  }
});
