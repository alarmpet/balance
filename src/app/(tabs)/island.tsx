import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Profile, UserTrait } from '../../types/database.types';
import {
  GamificationSnapshot,
  fetchGamificationSnapshot,
} from '../../services/gamificationService';

interface EvolutionStage {
  level: number;
  name: string;
  characterType: string;
  nextTarget: number | null;
  minParticipation: number;
}

interface TraitPersona {
  label: string;
  titlePrefix: string;
  character: string;
  color: string;
}

const evolutionStages: EvolutionStage[] = [
  {
    level: 1,
    name: '새싹 모래섬',
    characterType: '씨앗 수호자',
    nextTarget: 50,
    minParticipation: 0,
  },
  {
    level: 2,
    name: '초록 야자섬',
    characterType: '해변 탐험가',
    nextTarget: 100,
    minParticipation: 50,
  },
  {
    level: 3,
    name: '무지개 산호섬',
    characterType: '파도 조율사',
    nextTarget: 300,
    minParticipation: 100,
  },
  {
    level: 4,
    name: '별빛 왕관섬',
    characterType: '밸런스 섬의 전설',
    nextTarget: null,
    minParticipation: 300,
  },
];

const traitPersonaMap: Record<string, TraitPersona> = {
  comfort_seeker: {
    label: '편안함',
    titlePrefix: '마지막 한 입을 아끼는',
    character: '철학자 거북이',
    color: '#86EFAC',
  },
  adventurous: {
    label: '모험심',
    titlePrefix: '바람 따라 떠나는',
    character: '즉흥 여행가 여우',
    color: '#FDBA74',
  },
  planner: {
    label: '계획력',
    titlePrefix: '지도 위에 별을 찍는',
    character: '루틴 설계자 고양이',
    color: '#93C5FD',
  },
  spontaneous: {
    label: '즉흥성',
    titlePrefix: '오늘의 파도를 믿는',
    character: '번개 항해사 돌고래',
    color: '#67E8F9',
  },
  deep_connection: {
    label: '깊은 연결',
    titlePrefix: '마음의 조개를 여는',
    character: '다정한 등대지기',
    color: '#F9A8D4',
  },
  ambitious: {
    label: '성장욕',
    titlePrefix: '높은 절벽을 오르는',
    character: '성장 항해가',
    color: '#C4B5FD',
  },
  stability: {
    label: '안정감',
    titlePrefix: '튼튼한 닻을 내리는',
    character: '평온한 선장',
    color: '#A7F3D0',
  },
  curious: {
    label: '호기심',
    titlePrefix: '숨은 보물을 찾는',
    character: '취향 큐레이터',
    color: '#FDE68A',
  },
};

const fallbackPersona: TraitPersona = {
  label: '균형감',
  titlePrefix: '파도와 바람을 고르는',
  character: '밸런스 탐험가',
  color: '#BAE6FD',
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getEvolutionStage = (participationCount: number) => {
  if (participationCount >= 300) {
    return evolutionStages[3];
  }

  if (participationCount >= 100) {
    return evolutionStages[2];
  }

  if (participationCount >= 50) {
    return evolutionStages[1];
  }

  return evolutionStages[0];
};

const getLevelProgress = (participationCount: number, stage: EvolutionStage) => {
  if (!stage.nextTarget) {
    return 100;
  }

  const currentRange = stage.nextTarget - stage.minParticipation;
  const progressInRange = participationCount - stage.minParticipation;
  return clampPercent((progressInRange / currentRange) * 100);
};

const getTopTraits = (traits: UserTrait[]) =>
  [...traits].sort((left, right) => right.score - left.score).slice(0, 2);

const getTraitPercent = (trait: UserTrait, traits: UserTrait[]) => {
  const total = traits.reduce((sum, item) => sum + Math.max(item.score, 0), 0);

  if (total <= 0) {
    return 0;
  }

  return Math.round((trait.score / total) * 100);
};

const buildPersonaTitle = (topTraits: UserTrait[]) => {
  if (topTraits.length === 0) {
    return `${fallbackPersona.titlePrefix} ${fallbackPersona.character}`;
  }

  const firstPersona = traitPersonaMap[topTraits[0].trait_key] ?? fallbackPersona;

  if (topTraits.length === 1) {
    return `${firstPersona.titlePrefix} ${firstPersona.character}`;
  }

  const secondPersona = traitPersonaMap[topTraits[1].trait_key] ?? fallbackPersona;
  return `${firstPersona.titlePrefix} ${secondPersona.character}`;
};

export default function IslandScreen() {
  const [snapshot, setSnapshot] = useState<GamificationSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSnapshot = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextSnapshot = await fetchGamificationSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      Alert.alert('섬 정보를 불러오지 못했어요', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const profile: Profile | null = snapshot?.profile ?? null;
  const traits = snapshot?.traits ?? [];
  const participationCount = profile?.total_participation_count ?? 0;
  const stage = getEvolutionStage(participationCount);
  const levelProgress = getLevelProgress(participationCount, stage);
  const topTraits = useMemo(() => getTopTraits(traits), [traits]);
  const personaTitle = useMemo(() => buildPersonaTitle(topTraits), [topTraits]);
  const primaryPersona = traitPersonaMap[topTraits[0]?.trait_key ?? ''] ?? fallbackPersona;

  if (isLoading && !snapshot) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>나만의 섬을 깨우고 있어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor="#0EA5E9"
            colors={['#0EA5E9']}
            onRefresh={() => loadSnapshot(true)}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MY ISLAND</Text>
            <Text style={styles.title}>{profile?.nickname ?? '게스트'}의 섬</Text>
          </View>
          {snapshot?.isGuest ? (
            <View style={styles.guestBadge}>
              <Ionicons name="person-circle" size={17} color="#0369A1" />
              <Text style={styles.guestBadgeText}>게스트</Text>
            </View>
          ) : (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LV.{stage.level}</Text>
            </View>
          )}
        </View>

        <View style={styles.islandCard}>
          <View style={styles.sky}>
            <View style={styles.sun} />
            <View style={[styles.cloud, styles.cloudLeft]} />
            <View style={[styles.cloud, styles.cloudRight]} />
          </View>
          <View style={[styles.islandBase, { backgroundColor: primaryPersona.color }]}>
            <View style={styles.grassCap} />
            <View style={styles.treeTrunk} />
            <View style={styles.treeLeafOne} />
            <View style={styles.treeLeafTwo} />
            <View style={styles.treeLeafThree} />
            <View style={styles.characterBubble}>
              <Ionicons name="sparkles" size={24} color="#0F172A" />
            </View>
          </View>
          <View style={styles.waveOne} />
          <View style={styles.waveTwo} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.stageName}>{stage.name}</Text>
          <Text style={styles.personaTitle}>{personaTitle}</Text>
          <Text style={styles.characterType}>{stage.characterType}</Text>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {stage.nextTarget ? `다음 진화까지 ${stage.nextTarget - participationCount}회` : '최종 진화 완료'}
            </Text>
            <Text style={styles.progressValue}>{participationCount}회 참여</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
        </View>

        <View style={styles.traitSection}>
          <Text style={styles.sectionTitle}>대표 성향 TOP 2</Text>
          {topTraits.length === 0 ? (
            <View style={styles.emptyTraitCard}>
              <Ionicons name="compass" size={24} color="#0EA5E9" />
              <Text style={styles.emptyTraitTitle}>아직 성향 지도가 비어 있어요</Text>
              <Text style={styles.emptyTraitText}>피드에서 투표하면 섬의 성격이 자라납니다.</Text>
            </View>
          ) : (
            topTraits.map((trait, index) => {
              const persona = traitPersonaMap[trait.trait_key] ?? fallbackPersona;
              const percent = getTraitPercent(trait, traits);

              return (
                <View key={trait.trait_key} style={styles.traitCard}>
                  <View style={[styles.traitRank, { backgroundColor: persona.color }]}>
                    <Text style={styles.traitRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.traitContent}>
                    <Text style={styles.traitLabel}>{persona.label}</Text>
                    <Text style={styles.traitKey}>{trait.trait_key}</Text>
                    <View style={styles.traitTrack}>
                      <View style={[styles.traitFill, { width: `${percent}%`, backgroundColor: persona.color }]} />
                    </View>
                  </View>
                  <Text style={styles.traitScore}>{percent}%</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.milestoneRow}>
          {evolutionStages.slice(1).map((item) => {
            const unlocked = participationCount >= item.minParticipation;
            return (
              <View key={item.level} style={[styles.milestoneCard, unlocked && styles.milestoneUnlocked]}>
                <Ionicons
                  name={unlocked ? 'lock-open' : 'lock-closed'}
                  size={18}
                  color={unlocked ? '#0F172A' : '#94A3B8'}
                />
                <Text style={[styles.milestoneText, unlocked && styles.milestoneTextUnlocked]}>
                  {item.minParticipation}회
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable onPress={() => loadSnapshot(true)} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.refreshButtonText}>섬 새로고침</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0EA5E9',
  },
  title: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: '900',
    color: '#0F172A',
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0369A1',
  },
  levelBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  islandCard: {
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#BAE6FD',
    position: 'relative',
    marginBottom: 14,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#BAE6FD',
  },
  sun: {
    position: 'absolute',
    top: 28,
    right: 34,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FDE68A',
  },
  cloud: {
    position: 'absolute',
    width: 86,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  cloudLeft: {
    top: 58,
    left: 22,
  },
  cloudRight: {
    top: 104,
    right: 52,
  },
  islandBase: {
    position: 'absolute',
    left: 54,
    right: 54,
    bottom: 48,
    height: 116,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  grassCap: {
    position: 'absolute',
    top: -8,
    left: 28,
    right: 28,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
  },
  treeTrunk: {
    position: 'absolute',
    top: -54,
    left: 72,
    width: 16,
    height: 62,
    borderRadius: 8,
    backgroundColor: '#92400E',
  },
  treeLeafOne: {
    position: 'absolute',
    top: -78,
    left: 42,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#22C55E',
  },
  treeLeafTwo: {
    position: 'absolute',
    top: -90,
    left: 76,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#16A34A',
  },
  treeLeafThree: {
    position: 'absolute',
    top: -62,
    left: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#86EFAC',
  },
  characterBubble: {
    position: 'absolute',
    right: 34,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  waveOne: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: 18,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(14,165,233,0.44)',
  },
  waveTwo: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(2,132,199,0.32)',
  },
  infoCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  stageName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0EA5E9',
  },
  personaTitle: {
    marginTop: 6,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    color: '#0F172A',
  },
  characterType: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#0EA5E9',
  },
  traitSection: {
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyTraitCard: {
    minHeight: 132,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTraitTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyTraitText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  traitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  traitRank: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  traitRankText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  traitContent: {
    flex: 1,
  },
  traitLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  traitKey: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  traitTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  traitFill: {
    height: '100%',
    borderRadius: 4,
  },
  traitScore: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  milestoneCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneUnlocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  milestoneTextUnlocked: {
    color: '#0F172A',
  },
  refreshButton: {
    minHeight: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.76,
  },
});
