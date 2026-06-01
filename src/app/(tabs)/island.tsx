import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useGamificationStore } from '../../store/gamificationStore';
import type { GamificationSnapshot } from '../../services/gamificationService';

function getTitle(traits: GamificationSnapshot['traits']) {
  const top = [...traits].sort((a, b) => b.score - a.score).slice(0, 2).map((trait) => trait.trait_key);
  if (top.includes('curious')) return '즉흥 여행가 여우';
  if (top.includes('comfort_seeker')) return '마지막 한 입을 아끼는 철학자 거북이';
  if (top.includes('planner')) return '섬 지도를 그리는 계획가';
  if (top.includes('aesthetic')) return '반짝이는 취향 수집가';
  return '새싹 선택 탐험가';
}

function getStageLabel(stage: string) {
  if (stage === 'legendary') return '전설의 섬 수호자';
  if (stage === 'guardian') return '섬 수호자';
  if (stage === 'explorer') return '탐험가';
  if (stage === 'sprout') return '새싹 친구';
  return '성향 알';
}

export default function IslandScreen() {
  const { snapshot, isLoading, isMutating, error, loadSnapshot, careForAvatar, assignPet, claimTheme, drawTheme } = useGamificationStore();

  useEffect(() => {
    if (!snapshot) {
      void loadSnapshot();
    }
  }, [loadSnapshot, snapshot]);

  const title = useMemo(() => (snapshot ? getTitle(snapshot.traits) : ''), [snapshot]);

  if (error && !snapshot) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadSnapshot()}>
          <Text style={styles.retryText}>다시 불러오기</Text>
        </Pressable>
      </View>
    );
  }

  if (!snapshot || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  const hatchProgress = `${Math.min(100, snapshot.avatarState.hatch_progress * 10)}%` as DimensionValue;
  const mood = `${snapshot.avatarState.mood}%` as DimensionValue;
  const energy = `${snapshot.avatarState.energy}%` as DimensionValue;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>나의 섬</Text>
      <Text style={styles.heading}>{snapshot.island.island_name}</Text>

      <View style={styles.hero}>
        <Text style={styles.islandEmoji}>{snapshot.island.island_level >= 3 ? '🏝️' : '🌴'}</Text>
        <Text style={styles.level}>섬 레벨 {snapshot.island.island_level}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>총 참여 {snapshot.profile.total_participation_count}회로 섬과 성향 펫이 함께 자라고 있어요.</Text>
      </View>

      <View style={styles.avatarCard}>
        <View style={styles.avatarHeader}>
          <View>
            <Text style={styles.cardLabel}>성향 펫</Text>
            <Text style={styles.avatarName}>{snapshot.petSpecies?.display_name ?? '아직 부화 전'}</Text>
          </View>
          <Text style={styles.avatarLevel}>Lv.{snapshot.petState?.level ?? 1}</Text>
        </View>
        <Text style={styles.description}>
          {snapshot.petSpecies?.description ?? '투표 성향이 쌓이면 나와 닮은 펫이 배정됩니다.'}
        </Text>
        <View style={styles.actionRow}>
          <CareButton label="펫 부화" disabled={isMutating} onPress={() => assignPet()} />
          <CareButton label="무료 테마" disabled={isMutating} onPress={() => claimTheme()} />
          <CareButton label="테마 뽑기" disabled={isMutating} onPress={() => drawTheme()} />
        </View>
        {snapshot.equippedTheme ? (
          <Text style={styles.bond}>
            장착 테마 {snapshot.equippedTheme.skin.display_name} · LV.{snapshot.equippedTheme.inventory.level}
          </Text>
        ) : (
          <Text style={styles.bond}>장착 테마 없음 · 무료 테마를 먼저 받아보세요.</Text>
        )}
      </View>

      <View style={styles.avatarCard}>
        <View style={styles.avatarHeader}>
          <View>
            <Text style={styles.cardLabel}>나의 아바타</Text>
            <Text style={styles.avatarName}>{getStageLabel(snapshot.avatarState.evolution_stage)}</Text>
          </View>
          <Text style={styles.avatarLevel}>Lv.{snapshot.avatarState.level}</Text>
        </View>
        <StatusBar label="부화" value={`${snapshot.avatarState.hatch_progress}/10`} width={hatchProgress} color="#38bdf8" />
        <StatusBar label="기분" value={`${snapshot.avatarState.mood}`} width={mood} color="#f472b6" />
        <StatusBar label="에너지" value={`${snapshot.avatarState.energy}`} width={energy} color="#34d399" />
        <Text style={styles.bond}>친밀도 {snapshot.avatarState.bond} · 경험치 {snapshot.avatarState.experience}</Text>
        <View style={styles.actionRow}>
          <CareButton label="간식" disabled={isMutating} onPress={() => careForAvatar('snack')} />
          <CareButton label="놀기" disabled={isMutating} onPress={() => careForAvatar('play')} />
          <CareButton label="칭찬" disabled={isMutating} onPress={() => careForAvatar('praise')} />
        </View>
      </View>

      <View style={styles.traitSection}>
        <Text style={styles.sectionTitle}>성향 조각</Text>
        {snapshot.traits.length === 0 ? (
          <Text style={styles.empty}>투표를 시작하면 성향 조각이 이곳에 쌓입니다.</Text>
        ) : null}
        {snapshot.traits.map((trait) => (
          <View key={trait.trait_key} style={styles.traitRow}>
            <Text style={styles.traitName}>{trait.trait_key}</Text>
            <Text style={styles.traitScore}>{trait.score}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StatusBar({ label, value, width, color }: { label: string; value: string; width: DimensionValue; color: string }) {
  return (
    <View style={styles.statusBlock}>
      <View style={styles.statusTextRow}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={styles.statusValue}>{value}</Text>
      </View>
      <View style={styles.statusTrack}>
        <View style={[styles.statusFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function CareButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.careButton, disabled ? styles.disabledButton : null]} disabled={disabled} onPress={onPress}>
      <Text style={styles.careText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16
  },
  avatarCard: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  avatarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  avatarLevel: {
    color: '#0284c7',
    fontSize: 18,
    fontWeight: '900'
  },
  avatarName: {
    color: '#164e63',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4
  },
  bond: {
    color: '#4f7d89',
    fontWeight: '800',
    marginTop: 12
  },
  cardLabel: {
    color: '#0891b2',
    fontSize: 12,
    fontWeight: '900'
  },
  careButton: {
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center'
  },
  careText: {
    color: '#075985',
    fontWeight: '900'
  },
  center: {
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  container: {
    backgroundColor: '#ecfeff',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 56
  },
  description: {
    color: '#4f7d89',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  },
  disabledButton: {
    opacity: 0.5
  },
  empty: {
    color: '#4f7d89',
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center'
  },
  error: {
    color: '#be123c',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  heading: {
    color: '#164e63',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 20,
    padding: 28
  },
  islandEmoji: {
    fontSize: 80
  },
  kicker: {
    color: '#0891b2',
    fontSize: 13,
    fontWeight: '900'
  },
  level: {
    color: '#0891b2',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10
  },
  retryButton: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  sectionTitle: {
    color: '#164e63',
    fontSize: 18,
    fontWeight: '900'
  },
  statusBlock: {
    marginTop: 14
  },
  statusFill: {
    borderRadius: 999,
    height: '100%'
  },
  statusLabel: {
    color: '#164e63',
    fontWeight: '900'
  },
  statusTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statusTrack: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    height: 12,
    marginTop: 8,
    overflow: 'hidden'
  },
  statusValue: {
    color: '#64748b',
    fontWeight: '800'
  },
  title: {
    color: '#164e63',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center'
  },
  traitName: {
    color: '#164e63',
    fontWeight: '800'
  },
  traitRow: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 16
  },
  traitScore: {
    color: '#0891b2',
    fontWeight: '900'
  },
  traitSection: {
    marginTop: 20
  }
});
