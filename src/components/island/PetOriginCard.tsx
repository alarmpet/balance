import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { GamificationSnapshot } from '../../services/gamificationService';

type Props = {
  snapshot: GamificationSnapshot;
};

// 수집(소유욕)을 자기발견의 보상으로 번역하는 핵심 카드.
// "그냥 희귀한 펫"이 아니라 "내 성향이 만들어낸, 나만의 펫"으로 서사를 연결한다.

const TRAIT_LABELS: Record<string, string> = {
  safe: '안정',
  adventure: '모험',
  plan: '계획',
  flow: '흐름',
  solo: '혼자',
  social: '함께',
  calm: '차분',
  express: '표현',
  curious: '호기심',
  comfort: '익숙함',
  aesthetic: '미감'
};

const RARITY: Record<string, { label: string; color: string; aura: string }> = {
  common: { label: '일반', color: '#0ea5e9', aura: '잔잔한' },
  rare: { label: '희귀', color: '#7c3aed', aura: '반짝이는' },
  legendary: { label: '전설', color: '#d97706', aura: '눈부신' }
};

function traitLabel(key: string) {
  return TRAIT_LABELS[key] ?? key;
}

export function PetOriginCard({ snapshot }: Props) {
  const { petSpecies, petState } = snapshot;

  // 아직 펫이 없으면 수집 동기를 자극하는 CTA 상태.
  if (!petSpecies || !petState) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <MaterialCommunityIcons name="egg-easter" size={30} color="#a855f7" />
        <Text style={styles.emptyTitle}>아직 당신의 펫이 깨어나지 않았어요</Text>
        <Text style={styles.emptyBody}>
          선택이 쌓여 성향이 또렷해지면, 그 성향이 세상에 단 하나뿐인 당신만의 펫을 데려와요. 아래 “펫 배정”을 눌러보세요.
        </Text>
      </View>
    );
  }

  const rarity = RARITY[petSpecies.base_rarity] ?? RARITY.common;
  const petName = petState.nickname?.trim() || petSpecies.display_name;

  const topTwo = [...snapshot.traits]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((t) => traitLabel(t.trait_key));

  const traitPhrase =
    topTwo.length >= 2 ? `${topTwo[0]}·${topTwo[1]}` : topTwo.length === 1 ? topTwo[0] : '균형 잡힌';

  return (
    <View style={[styles.card, { borderColor: rarity.color + '44' }]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>내 성향이 만든 펫</Text>
        <View style={[styles.rarityBadge, { backgroundColor: rarity.color + '18', borderColor: rarity.color + '55' }]}>
          <MaterialCommunityIcons name="star-four-points" size={12} color={rarity.color} />
          <Text style={[styles.rarityText, { color: rarity.color }]}>{rarity.label}</Text>
        </View>
      </View>

      <Text style={styles.petName}>{petName}</Text>

      <Text style={styles.narrative}>
        당신의 <Text style={[styles.narrativeStrong, { color: rarity.color }]}>{traitPhrase}</Text> 성향이 강해서, {rarity.aura}{' '}
        <Text style={styles.narrativeStrong}>{petSpecies.display_name}</Text>을(를) 만났어요.
      </Text>

      {petSpecies.description ? <Text style={styles.flavor}>{petSpecies.description}</Text> : null}

      <View style={styles.ownershipRow}>
        <MaterialCommunityIcons name="heart" size={14} color={rarity.color} />
        <Text style={styles.ownershipText}>세상에 단 하나뿐인, 당신의 선택이 빚은 동반자예요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e9d5ff',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  emptyBody: { color: '#64748b', fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 8, textAlign: 'center' },
  emptyCard: { alignItems: 'center' },
  emptyTitle: { color: '#7c3aed', fontSize: 15, fontWeight: '900', marginTop: 10 },
  flavor: { color: '#64748b', fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 10 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { color: '#7c3aed', fontSize: 12, fontWeight: '900' },
  narrative: { color: '#334155', fontSize: 15, fontWeight: '700', lineHeight: 23, marginTop: 10 },
  narrativeStrong: { color: '#0f172a', fontWeight: '900' },
  ownershipRow: {
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    padding: 12
  },
  ownershipText: { color: '#6b21a8', flex: 1, fontSize: 12, fontWeight: '800' },
  petName: { color: '#0f172a', fontSize: 22, fontWeight: '900', marginTop: 10 },
  rarityBadge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  rarityText: { fontSize: 12, fontWeight: '900' }
});
