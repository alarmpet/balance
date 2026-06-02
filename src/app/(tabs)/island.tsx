import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue
} from 'react-native';
import { useGamificationStore } from '../../store/gamificationStore';
import type { GamificationSnapshot } from '../../services/gamificationService';
import type { ThemeDrawResultRow } from '../../types/database.types';

type TraitCopy = {
  label: string;
  title: string;
};

const TRAIT_COPY: Record<string, TraitCopy> = {
  safe: { label: '안정', title: '차분한 항해자' },
  adventure: { label: '모험', title: '즉흥 여행가' },
  plan: { label: '계획', title: '지도 그리는 설계자' },
  flow: { label: '흐름', title: '파도 타는 자유인' },
  solo: { label: '혼자', title: '고요한 탐험가' },
  social: { label: '함께', title: '축제의 연결자' },
  calm: { label: '차분', title: '마지막 한 입을 아끼는 철학자' },
  express: { label: '표현', title: '반짝이는 리액션 장인' },
  curious: { label: '호기심', title: '새 길을 여는 관찰자' },
  comfort_seeker: { label: '취향', title: '아늑함을 수집하는 감각가' },
  planner: { label: '계획', title: '내일을 정리하는 항해사' },
  aesthetic: { label: '미감', title: '섬의 색을 고르는 큐레이터' }
};

const RARITY_COPY: Record<ThemeDrawResultRow['rarity'], { label: string; color: string; tint: string }> = {
  common: { label: '일반', color: '#0891b2', tint: '#e0f2fe' },
  rare: { label: '희귀', color: '#7c3aed', tint: '#ede9fe' },
  legendary: { label: '전설', color: '#d97706', tint: '#fef3c7' }
};

function getTopTraits(traits: GamificationSnapshot['traits']) {
  return [...traits].sort((a, b) => b.score - a.score).slice(0, 2);
}

function getIslandTitle(traits: GamificationSnapshot['traits']) {
  const topTraits = getTopTraits(traits);
  if (topTraits.length === 0) return '새싹 선택 탐험가';

  const first = TRAIT_COPY[topTraits[0].trait_key]?.title ?? topTraits[0].trait_key;
  const second = topTraits[1] ? (TRAIT_COPY[topTraits[1].trait_key]?.label ?? topTraits[1].trait_key) : '균형';
  return `${second}빛 ${first}`;
}

function getPetStage(snapshot: GamificationSnapshot) {
  const count = snapshot.profile.total_participation_count;
  if (count >= 300) return { label: '레전드 소울메이트', next: '최고 단계 달성', progress: 100 };
  if (count >= 100) return { label: '섬의 수호 펫', next: '300회 참여 시 레전드 진화', progress: Math.min(100, Math.round(((count - 100) / 200) * 100)) };
  if (count >= 50) return { label: '믿음직한 동료', next: '100회 참여 시 수호 펫 진화', progress: Math.min(100, Math.round(((count - 50) / 50) * 100)) };
  return { label: '새싹 친구', next: '50회 참여 시 동료로 진화', progress: Math.min(100, Math.round((count / 50) * 100)) };
}

function getPetImage(snapshot: GamificationSnapshot) {
  const species = snapshot.petSpecies;
  if (!species) return null;

  if (snapshot.petState && snapshot.petState.level >= 20 && species.legendary_asset_url) {
    return species.legendary_asset_url;
  }

  if (snapshot.petState && snapshot.petState.level >= 8 && species.rare_asset_url) {
    return species.rare_asset_url;
  }

  return species.common_asset_url;
}

function canRenderRemoteAsset(uri: string | null) {
  return uri ? uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') : false;
}

export default function IslandScreen() {
  const {
    snapshot,
    lastThemeDrawResults,
    isLoading,
    isMutating,
    error,
    loadSnapshot,
    careForAvatar,
    assignPet,
    claimTheme,
    drawTheme,
    clearThemeDrawResults,
    clearError
  } = useGamificationStore();

  useEffect(() => {
    if (!snapshot) {
      void loadSnapshot();
    }
  }, [loadSnapshot, snapshot]);

  const islandTitle = useMemo(() => (snapshot ? getIslandTitle(snapshot.traits) : ''), [snapshot]);
  const topTraits = useMemo(() => (snapshot ? getTopTraits(snapshot.traits) : []), [snapshot]);

  if (error && !snapshot) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="island" size={52} color="#0ea5e9" />
        <Text style={styles.errorTitle}>섬 정보를 불러오지 못했어요</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => loadSnapshot()}>
          <Text style={styles.primaryButtonText}>다시 불러오기</Text>
        </Pressable>
      </View>
    );
  }

  if (!snapshot || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
        <Text style={styles.loadingText}>나만의 섬을 준비하는 중</Text>
      </View>
    );
  }

  const stage = getPetStage(snapshot);
  const petImage = getPetImage(snapshot);
  const shellBalance = snapshot.profile.shell_balance.toLocaleString('ko-KR');
  const todayProgress = Math.min(100, Math.round((snapshot.profile.today_participation_count / 10) * 100));
  const petMood = `${Math.min(100, snapshot.petState?.mood ?? snapshot.avatarState.mood)}%` as DimensionValue;
  const petEnergy = `${Math.min(100, snapshot.petState?.energy ?? snapshot.avatarState.energy)}%` as DimensionValue;
  const evolutionProgress = `${stage.progress}%` as DimensionValue;
  const isGuest = snapshot.profile.id === 'guest';
  const actionDisabled = isMutating || isGuest;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.kicker}>밸런스 아일랜드</Text>
            <Text style={styles.heading}>나의 성향 섬</Text>
          </View>
          <View style={styles.wallet}>
            <MaterialCommunityIcons name="treasure-chest" size={22} color="#f59e0b" />
            <Text style={styles.walletText}>{shellBalance}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <Pressable onPress={clearError}>
              <MaterialCommunityIcons name="close" size={20} color="#be123c" />
            </Pressable>
          </View>
        ) : null}

        {isGuest ? (
          <View style={styles.guestBanner}>
            <MaterialCommunityIcons name="account-key" size={24} color="#0f766e" />
            <View style={styles.guestCopy}>
              <Text style={styles.guestTitle}>게스트 미리보기 모드</Text>
              <Text style={styles.guestText}>로그인하면 성향 펫 배정, 무료 테마, 케어 보상이 내 계정에 저장됩니다.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.sky}>
            <View style={styles.sun} />
            <View style={styles.cloudSmall} />
            <View style={styles.cloudLarge} />
          </View>
          <View style={styles.islandBase}>
            <MaterialCommunityIcons name="island" size={86} color="#0ea5e9" />
          </View>
          <Text style={styles.levelBadge}>섬 Lv.{snapshot.island.island_level}</Text>
          <Text style={styles.title}>{islandTitle}</Text>
          <Text style={styles.description}>
            지금까지 {snapshot.profile.total_participation_count}개의 선택이 이 섬의 성격을 만들었어요.
          </Text>
          {snapshot.equippedTheme ? (
            <View style={styles.equippedTheme}>
              <MaterialCommunityIcons name="palette-swatch" size={18} color="#7c3aed" />
              <Text style={styles.equippedThemeText}>
                {snapshot.equippedTheme.skin.display_name} LV.{snapshot.equippedTheme.inventory.level}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.petPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.cardLabel}>성향 펫</Text>
              <Text style={styles.cardTitle}>{snapshot.petSpecies?.display_name ?? '아직 만나지 못했어요'}</Text>
            </View>
            <View style={styles.stagePill}>
              <Text style={styles.stagePillText}>{stage.label}</Text>
            </View>
          </View>

          <View style={styles.petBody}>
            <View style={styles.petPortrait}>
              {canRenderRemoteAsset(petImage) ? (
                <Image source={{ uri: petImage ?? undefined }} style={styles.petImage} contentFit="contain" />
              ) : (
                <MaterialCommunityIcons name={snapshot.petSpecies ? 'paw' : 'egg-easter'} size={72} color="#0ea5e9" />
              )}
            </View>
            <View style={styles.petInfo}>
              <Text style={styles.petDescription}>
                {snapshot.petSpecies?.description ?? '질문을 더 풀면 내 선택 패턴과 닮은 펫이 자동으로 배정됩니다.'}
              </Text>
              <ProgressRow label="진화" value={stage.next} width={evolutionProgress} color="#38bdf8" />
              <ProgressRow label="기분" value={`${snapshot.petState?.mood ?? snapshot.avatarState.mood}`} width={petMood} color="#fb7185" />
              <ProgressRow label="에너지" value={`${snapshot.petState?.energy ?? snapshot.avatarState.energy}`} width={petEnergy} color="#34d399" />
            </View>
          </View>

          <View style={styles.actionGrid}>
            <ActionButton icon="account-heart" label="펫 배정" disabled={actionDisabled} onPress={() => assignPet()} />
            <ActionButton icon="gift" label="무료 테마" disabled={actionDisabled} onPress={() => claimTheme()} />
            <ActionButton icon="treasure-chest" label="테마 뽑기" disabled={actionDisabled} onPress={() => drawTheme()} />
          </View>
        </View>

        <View style={styles.rewardPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.cardLabel}>오늘 참여</Text>
              <Text style={styles.cardTitle}>{snapshot.profile.today_participation_count}/10 완료</Text>
            </View>
            <MaterialCommunityIcons name="calendar-check" size={34} color="#0ea5e9" />
          </View>
          <ProgressRow label="일일 보상" value={`${todayProgress}%`} width={`${todayProgress}%` as DimensionValue} color="#60a5fa" />
          <View style={styles.careRow}>
            <ActionButton icon="food-apple" label="간식" disabled={actionDisabled} onPress={() => careForAvatar('snack')} />
            <ActionButton icon="gamepad-variant" label="놀아주기" disabled={actionDisabled} onPress={() => careForAvatar('play')} />
            <ActionButton icon="heart" label="칭찬" disabled={actionDisabled} onPress={() => careForAvatar('praise')} />
          </View>
        </View>

        <ThemeInventorySection snapshot={snapshot} />

        <View style={styles.traitPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.cardLabel}>성향 조각</Text>
              <Text style={styles.cardTitle}>상위 성향</Text>
            </View>
            <MaterialCommunityIcons name="chart-donut" size={34} color="#14b8a6" />
          </View>
          {topTraits.length === 0 ? (
            <Text style={styles.emptyText}>투표를 시작하면 이곳에 나의 선택 성향이 쌓입니다.</Text>
          ) : (
            topTraits.map((trait) => {
              const copy = TRAIT_COPY[trait.trait_key];
              return (
                <View key={trait.trait_key} style={styles.traitRow}>
                  <Text style={styles.traitName}>{copy?.label ?? trait.trait_key}</Text>
                  <Text style={styles.traitScore}>{trait.score}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <ThemeDrawModal results={lastThemeDrawResults} onClose={clearThemeDrawResults} />

      {isMutating ? (
        <View style={styles.mutatingOverlay}>
          <ActivityIndicator color="#ffffff" />
          <Text style={styles.mutatingText}>섬에 반영 중</Text>
        </View>
      ) : null}
    </>
  );
}

function ThemeDrawModal({ results, onClose }: { results: ThemeDrawResultRow[]; onClose: () => void }) {
  const primary = results[0];

  return (
    <Modal visible={results.length > 0} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalIcon}>
            <MaterialCommunityIcons name="party-popper" size={42} color="#f59e0b" />
          </View>
          <Text style={styles.modalTitle}>새 테마를 발견했어요</Text>
          {primary ? (
            <View style={[styles.resultCard, { backgroundColor: RARITY_COPY[primary.rarity].tint }]}>
              <View style={styles.resultHeader}>
                <Text style={[styles.rarityText, { color: RARITY_COPY[primary.rarity].color }]}>
                  {RARITY_COPY[primary.rarity].label}
                </Text>
                <Text style={styles.resultLevel}>LV.{primary.inventory_level_after}</Text>
              </View>
              <Text style={styles.resultName}>{primary.display_name}</Text>
              <Text style={styles.resultMeta}>
                {primary.was_duplicate ? '중복 획득으로 테마가 자동 강화됐어요.' : '새로운 섬 배경이 보관함에 추가됐어요.'}
              </Text>
            </View>
          ) : null}
          {results.length > 1 ? (
            <Text style={styles.resultMeta}>총 {results.length}개의 테마 결과가 반영됐습니다.</Text>
          ) : null}
          <Pressable style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ThemeInventorySection({ snapshot }: { snapshot: GamificationSnapshot }) {
  const themes = snapshot.themeInventory;

  return (
    <View style={styles.themePanel}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.cardLabel}>테마 보관함</Text>
          <Text style={styles.cardTitle}>{themes.length > 0 ? `${themes.length}개 보유` : '아직 비어 있어요'}</Text>
        </View>
        <MaterialCommunityIcons name="image-multiple" size={34} color="#7c3aed" />
      </View>

      {themes.length === 0 ? (
        <Text style={styles.emptyText}>무료 테마를 받으면 펫이 지내는 섬 분위기를 한 번에 바꿀 수 있어요.</Text>
      ) : (
        <View style={styles.themeGrid}>
          {themes.map(({ inventory, skin }) => {
            const rarity = RARITY_COPY[skin.rarity];
            return (
              <View key={skin.id} style={[styles.themeCard, { backgroundColor: rarity.tint }]}>
                <View style={styles.themeTopRow}>
                  <Text style={[styles.themeRarity, { color: rarity.color }]}>{rarity.label}</Text>
                  {inventory.is_equipped ? (
                    <View style={styles.equippedPill}>
                      <Text style={styles.equippedPillText}>장착</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.themeName}>{skin.display_name}</Text>
                <Text style={styles.themeMeta}>LV.{inventory.level} · 중복 {inventory.duplicate_count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ProgressRow({
  label,
  value,
  width,
  color
}: {
  label: string;
  value: string;
  width: DimensionValue;
  color: string;
}) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressTextRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  onPress
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.actionButton, disabled ? styles.disabledButton : null]} disabled={disabled} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={22} color="#0369a1" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    minHeight: 70,
    padding: 10
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18
  },
  actionText: {
    color: '#075985',
    fontSize: 12,
    fontWeight: '900'
  },
  cardLabel: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '900'
  },
  cardTitle: {
    color: '#164e63',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4
  },
  careRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18
  },
  center: {
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  cloudLarge: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    height: 34,
    opacity: 0.8,
    position: 'absolute',
    right: 44,
    top: 38,
    width: 86
  },
  cloudSmall: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    height: 26,
    left: 40,
    opacity: 0.75,
    position: 'absolute',
    top: 56,
    width: 62
  },
  container: {
    backgroundColor: '#ecfeff',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 44,
    paddingTop: 56
  },
  description: {
    color: '#4f7d89',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center'
  },
  disabledButton: {
    opacity: 0.55
  },
  emptyText: {
    color: '#4f7d89',
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 14
  },
  equippedTheme: {
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  equippedThemeText: {
    color: '#6d28d9',
    fontSize: 12,
    fontWeight: '900'
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 14
  },
  errorBannerText: {
    color: '#be123c',
    flex: 1,
    fontSize: 13,
    fontWeight: '800'
  },
  errorText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center'
  },
  errorTitle: {
    color: '#164e63',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 14
  },
  equippedPill: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  equippedPillText: {
    color: '#0f766e',
    fontSize: 11,
    fontWeight: '900'
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
    overflow: 'hidden',
    padding: 24
  },
  guestBanner: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderColor: '#5eead4',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    padding: 14
  },
  guestCopy: {
    flex: 1
  },
  guestText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3
  },
  guestTitle: {
    color: '#115e59',
    fontSize: 14,
    fontWeight: '900'
  },
  islandBase: {
    alignItems: 'center',
    backgroundColor: '#dff7ed',
    borderColor: '#86efac',
    borderRadius: 999,
    borderWidth: 1,
    height: 122,
    justifyContent: 'center',
    marginTop: 24,
    width: 190
  },
  kicker: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '900'
  },
  levelBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    borderRadius: 999,
    borderWidth: 1,
    color: '#b45309',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  loadingText: {
    color: '#0f766e',
    fontWeight: '900',
    marginTop: 12
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    maxWidth: 420,
    padding: 22,
    width: '100%'
  },
  modalIcon: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72
  },
  modalTitle: {
    color: '#164e63',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 14
  },
  mutatingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(14, 116, 144, 0.72)',
    bottom: 24,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 10,
    left: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'absolute',
    right: 24
  },
  mutatingText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  petBody: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18
  },
  petDescription: {
    color: '#4f7d89',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  petImage: {
    height: 106,
    width: 106
  },
  petInfo: {
    flex: 1
  },
  petPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  petPortrait: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    height: 126,
    justifyContent: 'center',
    width: 126
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  progressBlock: {
    marginTop: 12
  },
  progressFill: {
    borderRadius: 999,
    height: '100%'
  },
  progressLabel: {
    color: '#164e63',
    fontSize: 12,
    fontWeight: '900'
  },
  progressTextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progressTrack: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    height: 10,
    marginTop: 7,
    overflow: 'hidden'
  },
  progressValue: {
    color: '#64748b',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 10,
    textAlign: 'right'
  },
  rarityText: {
    fontSize: 13,
    fontWeight: '900'
  },
  resultCard: {
    borderRadius: 20,
    marginTop: 16,
    padding: 18,
    width: '100%'
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  resultLevel: {
    color: '#475569',
    fontWeight: '900'
  },
  resultMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center'
  },
  resultName: {
    color: '#164e63',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8
  },
  rewardPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  sky: {
    backgroundColor: '#bae6fd',
    height: 112,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  stagePill: {
    backgroundColor: '#ecfeff',
    borderColor: '#99f6e4',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  stagePillText: {
    color: '#0f766e',
    fontSize: 11,
    fontWeight: '900'
  },
  sun: {
    backgroundColor: '#fde68a',
    borderRadius: 999,
    height: 48,
    position: 'absolute',
    right: 26,
    top: 18,
    width: 48
  },
  title: {
    color: '#164e63',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center'
  },
  themeCard: {
    borderRadius: 16,
    padding: 14
  },
  themeGrid: {
    gap: 10,
    marginTop: 14
  },
  themeMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8
  },
  themeName: {
    color: '#164e63',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8
  },
  themePanel: {
    backgroundColor: '#ffffff',
    borderColor: '#ddd6fe',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  themeRarity: {
    fontSize: 12,
    fontWeight: '900'
  },
  themeTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  traitName: {
    color: '#164e63',
    fontWeight: '900'
  },
  traitPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  traitRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 14
  },
  traitScore: {
    color: '#0ea5e9',
    fontWeight: '900'
  },
  wallet: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#fde68a',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  walletText: {
    color: '#92400e',
    fontWeight: '900'
  }
});
