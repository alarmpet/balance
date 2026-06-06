import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  type DimensionValue
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PetDiaryCard } from '../../components/island/PetDiaryCard';
import { PetAwayCard } from '../../components/island/PetAwayCard';
import IslandModeTabs, { type IslandMode } from '../../components/island/IslandModeTabs';
import ThemeProbabilitySheet from '../../components/island/ThemeProbabilitySheet';
import { analyticsService } from '../../services/analyticsService';
import { useGamificationStore } from '../../store/gamificationStore';
import { THEME } from '../../theme/styles';
import type { GamificationSnapshot } from '../../services/gamificationService';
import type { ThemeDrawResultRow } from '../../types/database.types';
import GlassView from '../../components/common/GlassView';

const LOCAL_PET_ISLAND = require('../../../assets/pets/cozy-island-retriever.png');
const LOCAL_SHELL_ICON = require('../../../assets/icons/shell.png');
const LOCAL_GEM_CHEST_ICON = require('../../../assets/icons/gem-chest.png');

type PetImageSource = string | number | null;

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
  comfort: { label: '익숙함', title: '편안함을 수집하는 감각가' },
  aesthetic: { label: '미감', title: '섬의 색을 고르는 큐레이터' }
};

const RARITY_COPY: Record<ThemeDrawResultRow['rarity'], { label: string; color: string; tint: string }> = {
  common: { label: '일반', color: '#0891b2', tint: '#e0f2fe' },
  rare: { label: '희귀', color: '#7c3aed', tint: '#ede9fe' },
  legendary: { label: '전설', color: '#d97706', tint: '#fef3c7' }
};

const LOGIN_ROUTE = '/login' as Href;

const PET_LAST_SEEN_KEY = 'bi_pet_last_seen';
const PET_GIFT_DATE_KEY = 'bi_pet_gift_date';
const PET_AWAY_MIN_HOURS = 6;

function kstDateStr(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);
}

function formatAwayLabel(hours: number) {
  if (hours >= 48) return `${Math.floor(hours / 24)}일`;
  if (hours >= 24) return '하루';
  return `${Math.max(1, Math.floor(hours))}시간`;
}

const LOCAL_PET_ASSETS: Record<string, number> = {
  'asset://alarmpetgo/svg/american shorthair.png': require('../../../assets/pets/alarmpetgo/common/american-shorthair.png'),
  'asset://alarmpetgo/svg/bichon.png': require('../../../assets/pets/alarmpetgo/common/bichon.png'),
  'asset://alarmpetgo/svg/chameleon.png': require('../../../assets/pets/alarmpetgo/common/chameleon.png'),
  'asset://alarmpetgo/svg/chihuahua.png': require('../../../assets/pets/alarmpetgo/common/chihuahua.png'),
  'asset://alarmpetgo/svg/deer.png': require('../../../assets/pets/alarmpetgo/common/deer.png'),
  'asset://alarmpetgo/svg/elephant.png': require('../../../assets/pets/alarmpetgo/common/elephant.png'),
  'asset://alarmpetgo/svg/frog.png': require('../../../assets/pets/alarmpetgo/common/frog.png'),
  'asset://alarmpetgo/svg/giraffe.png': require('../../../assets/pets/alarmpetgo/common/giraffe.png'),
  'asset://alarmpetgo/svg/goldfish.png': require('../../../assets/pets/alarmpetgo/common/goldfish.png'),
  'asset://alarmpetgo/svg/hamster.png': require('../../../assets/pets/alarmpetgo/common/hamster.png'),
  'asset://alarmpetgo/rare/rare-american shorthair.png': require('../../../assets/pets/alarmpetgo/rare/american-shorthair.png'),
  'asset://alarmpetgo/rare/rare-bichon.png': require('../../../assets/pets/alarmpetgo/rare/bichon.png'),
  'asset://alarmpetgo/rare/rare-chameleon.png': require('../../../assets/pets/alarmpetgo/rare/chameleon.png'),
  'asset://alarmpetgo/rare/rare-chihuahua.png': require('../../../assets/pets/alarmpetgo/rare/chihuahua.png'),
  'asset://alarmpetgo/rare/rare-deer.png': require('../../../assets/pets/alarmpetgo/rare/deer.png'),
  'asset://alarmpetgo/rare/rare-elephant.png': require('../../../assets/pets/alarmpetgo/rare/elephant.png'),
  'asset://alarmpetgo/rare/rare-frog.png': require('../../../assets/pets/alarmpetgo/rare/frog.png'),
  'asset://alarmpetgo/rare/rare-giraffe.png': require('../../../assets/pets/alarmpetgo/rare/giraffe.png'),
  'asset://alarmpetgo/rare/rare-goldfish.png': require('../../../assets/pets/alarmpetgo/rare/goldfish.png'),
  'asset://alarmpetgo/rare/rare-hamster.png': require('../../../assets/pets/alarmpetgo/rare/hamster.png'),
  'asset://alarmpetgo/legend/dragon.png': require('../../../assets/pets/alarmpetgo/legend/dragon.png'),
  'asset://alarmpetgo/legend/phoenix.png': require('../../../assets/pets/alarmpetgo/legend/phoenix.png'),
  'asset://alarmpetgo/legend/unicorn.png': require('../../../assets/pets/alarmpetgo/legend/unicorn.png')
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

function getPetImage(snapshot: GamificationSnapshot): PetImageSource {
  const species = snapshot.petSpecies;
  if (!species) return null;

  if (snapshot.petState && snapshot.petState.level >= 20 && species.legendary_asset_url) {
    return resolvePetAsset(species.legendary_asset_url);
  }

  if (snapshot.petState && snapshot.petState.level >= 8 && species.rare_asset_url) {
    return resolvePetAsset(species.rare_asset_url);
  }

  return resolvePetAsset(species.common_asset_url);
}

function resolvePetAsset(uri: string | null): PetImageSource {
  if (!uri) return null;
  return LOCAL_PET_ASSETS[uri] ?? uri;
}

function getSkyPhase(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) {
    return {
      top: '#ffedd5',
      mid: '#bae6fd',
      sun: '#fde68a',
      text: '#164e63',
      subText: '#4f7d89',
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
      cloudOpacity: 0.55
    };
  }
  if (hour >= 11 && hour < 17) {
    return {
      top: '#bae6fd',
      mid: '#e0f2fe',
      sun: '#fef3c7',
      text: '#164e63',
      subText: '#4f7d89',
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
      cloudOpacity: 0.6
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      top: '#fda4af',
      mid: '#c4b5fd',
      sun: '#fb7185',
      text: '#ffffff',
      subText: '#f1f5f9',
      badgeBg: 'rgba(255, 255, 255, 0.25)',
      badgeText: '#ffffff',
      cloudOpacity: 0.4
    };
  }
  return {
    top: '#172554',
    mid: '#312e81',
    sun: '#f8fafc',
    text: '#ffffff',
    subText: '#94a3b8',
    badgeBg: 'rgba(255, 255, 255, 0.15)',
    badgeText: '#ffffff',
    cloudOpacity: 0.2
  };
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
    claimCheckin,
    drawTheme,
    clearThemeDrawResults,
    clearError
  } = useGamificationStore();

  // 펫 "부재중 한 일" 재방문 카드 상태
  const [petAway, setPetAway] = useState<{ awayLabel: string; giftAvailable: boolean } | null>(null);
  const [petGiftClaiming, setPetGiftClaiming] = useState(false);
  const [petAwayDismissed, setPetAwayDismissed] = useState(false);
  const petAwayChecked = useRef(false);

  const [activeMode, setActiveMode] = useState<IslandMode>('discover');
  const [isProbabilityVisible, setIsProbabilityVisible] = useState(false);

  // Floating heart animation setup
  const [heartAnimY] = useState(() => new Animated.Value(0));
  const [heartOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    const createLoop = () => {
      if (!active) return;
      heartAnimY.setValue(0);
      heartOpacity.setValue(0);
      
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(heartAnimY, {
            toValue: -55,
            duration: 3000,
            useNativeDriver: true
          }),
          Animated.sequence([
            Animated.timing(heartOpacity, {
              toValue: 0.9,
              duration: 600,
              useNativeDriver: true
            }),
            Animated.timing(heartOpacity, {
              toValue: 0,
              duration: 2400,
              useNativeDriver: true
            })
          ])
        ])
      ]).start(() => {
        if (active) createLoop();
      });
    };
    
    createLoop();
    return () => {
      active = false;
    };
  }, [heartAnimY, heartOpacity]);

  useEffect(() => {
    if (!snapshot) {
      void loadSnapshot();
    }
  }, [loadSnapshot, snapshot]);

  // 부재 감지: 마지막 방문 이후 6시간↑면 "펫이 부재중에 한 일" 카드 표시(세션당 1회).
  useEffect(() => {
    if (petAwayChecked.current) return;
    if (!snapshot || snapshot.profile.id === 'guest') return;
    petAwayChecked.current = true;
    (async () => {
      try {
        const [lastSeenRaw, giftDate] = await Promise.all([
          AsyncStorage.getItem(PET_LAST_SEEN_KEY),
          AsyncStorage.getItem(PET_GIFT_DATE_KEY)
        ]);
        const now = Date.now();
        await AsyncStorage.setItem(PET_LAST_SEEN_KEY, String(now));
        const giftAvailable = giftDate !== kstDateStr(new Date());
        if (lastSeenRaw) {
          const hoursAway = (now - Number(lastSeenRaw)) / 3_600_000;
          if (Number.isFinite(hoursAway) && hoursAway >= PET_AWAY_MIN_HOURS) {
            setPetAway({ awayLabel: formatAwayLabel(hoursAway), giftAvailable });
          }
        }
        // 첫 방문(기록 없음)에는 '부재' 개념이 없으므로 표시하지 않는다.
      } catch {
        // 저장소 접근 실패는 조용히 무시(카드만 생략).
      }
    })();
  }, [snapshot]);

  const handleClaimPetGift = async () => {
    setPetGiftClaiming(true);
    try {
      await claimCheckin();
      await AsyncStorage.setItem(PET_GIFT_DATE_KEY, kstDateStr(new Date()));
      setPetAway((prev) => (prev ? { ...prev, giftAvailable: false } : prev));
    } catch {
      // 에러는 스토어 error 배너로 표면화된다.
    } finally {
      setPetGiftClaiming(false);
    }
  };

  const skyPhase = useMemo(() => {
    // For decorate mode, match the sunset mockup exactly
    if (activeMode === 'decorate') {
      return {
        top: '#fda4af',
        mid: '#c4b5fd',
        sun: '#fb7185',
        text: '#ffffff',
        subText: '#f1f5f9',
        badgeBg: 'rgba(255, 255, 255, 0.25)',
        badgeText: '#ffffff',
        cloudOpacity: 0.4
      };
    }
    return getSkyPhase();
  }, [activeMode]);

  const islandTitle = useMemo(() => (snapshot ? getIslandTitle(snapshot.traits) : ''), [snapshot]);
  const topTraits = useMemo(() => (snapshot ? getTopTraits(snapshot.traits) : []), [snapshot]);
  const heroSky = {
    top: '#fb7185',
    mid: '#38bdf8',
    sun: '#fde68a',
    text: '#ffffff',
    subText: '#eff6ff',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
    badgeText: '#ffffff',
    cloudOpacity: 0.42
  };

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
  const shellBalance = snapshot.profile.shell_balance.toLocaleString('ko-KR');
  const moodVal = Math.min(100, snapshot.petState?.mood ?? snapshot.avatarState.mood);
  const energyVal = Math.min(100, snapshot.petState?.energy ?? snapshot.avatarState.energy);
  const petMood = `${moodVal}%` as DimensionValue;
  const petEnergy = `${energyVal}%` as DimensionValue;
  const isGuest = snapshot.profile.id === 'guest';
  const actionDisabled = isMutating;
  const realPetImage = getPetImage(snapshot);
  const petImage = realPetImage ?? LOCAL_PET_ISLAND;

  function runAuthAction(action: () => void) {
    if (isGuest) {
      router.push(LOGIN_ROUTE);
      return;
    }

    action();
  }

  return (
    <>
      {/* 석양→바다 그라데이션 배경 (gradients.islandSunset 토큰, 시안 #2) */}
      <LinearGradient
        colors={THEME.gradients.islandSunset}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroller} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.kicker}>밸런스 아일랜드</Text>
            <Text style={styles.heading}>나의 성향 섬</Text>
          </View>
          <View style={styles.wallet}>
            <Image source={LOCAL_SHELL_ICON} style={{ width: 20, height: 20 }} />
            <Text style={styles.walletText}>{shellBalance}</Text>
          </View>
        </View>

        {petAway && !petAwayDismissed ? (
          <PetAwayCard
            petName={snapshot.petState?.nickname?.trim() || snapshot.petSpecies?.display_name || '내 펫'}
            awayLabel={petAway.awayLabel}
            giftAvailable={petAway.giftAvailable}
            claiming={petGiftClaiming}
            onClaim={handleClaimPetGift}
            onDismiss={() => setPetAwayDismissed(true)}
          />
        ) : null}

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

        <View style={styles.premiumIslandFrame}>
          <GlassView style={styles.myIslandHeader} intensity={18} borderRadius={22}>
            <View style={styles.myIslandRow}>
              <View style={styles.logoBadgeContainer}>
                <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="island" size={14} color="#0f766e" />
                </View>
                <Text style={styles.logoBadgeText}>나의 섬</Text>
              </View>
              <View style={styles.myIslandStats}>
                <View style={styles.myIslandStatItem}>
                  <Text style={styles.myIslandStatLabel}>기분 {moodVal}%</Text>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: petMood, backgroundColor: '#10b981' }]} />
                  </View>
                  <Text style={styles.miniIcon}>🙂</Text>
                </View>
                <View style={styles.myIslandStatItem}>
                  <Text style={styles.myIslandStatLabel}>에너지 {energyVal}%</Text>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: petEnergy, backgroundColor: '#f97316' }]} />
                  </View>
                  <Text style={styles.miniIcon}>⚡</Text>
                </View>
              </View>
            </View>
          </GlassView>

          <View style={styles.statusRow}>
            <GlassView style={styles.statusCard} intensity={15} borderRadius={20}>
              <View style={styles.statusHeaderRow}>
                <Ionicons name="paw" size={12} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={styles.statusCardLabel}>펫 기분</Text>
              </View>
              <Text style={styles.statusCardValue}>{moodVal >= 70 ? '무척 신나요' : '쉬는 중이에요'}</Text>
              <View style={styles.statusTrack}>
                <View style={[styles.statusFill, { width: petMood, backgroundColor: '#10b981' }]} />
              </View>
              <Text style={styles.statusProgressText}>{moodVal} / 100</Text>
            </GlassView>

            <GlassView style={styles.statusCard} intensity={15} borderRadius={20}>
              <View style={styles.statusHeaderRow}>
                <Ionicons name="flash" size={12} color="#f97316" style={{ marginRight: 4 }} />
                <Text style={styles.statusCardLabel}>활동 에너지</Text>
              </View>
              <Text style={styles.statusCardValue}>{energyVal >= 70 ? '탐험 준비 완료' : '돌봄이 필요해요'}</Text>
              <View style={styles.statusTrack}>
                <View style={[styles.statusFill, { width: petEnergy, backgroundColor: '#f97316' }]} />
              </View>
              <Text style={styles.statusProgressText}>{energyVal} / 100</Text>
            </GlassView>
          </View>

          <View style={[styles.cozyHero, styles.premiumCozyHero, { borderColor: heroSky.badgeBg, backgroundColor: heroSky.top }]}>
            <View style={[styles.sky, { backgroundColor: heroSky.top }]}>
              <View style={[styles.skyBand, styles.premiumSkyBand, { backgroundColor: heroSky.mid }]} />
              <View style={[styles.sun, styles.premiumSun, { backgroundColor: heroSky.sun }]} />
              <View style={[styles.cloudSmall, styles.premiumCloudSmall, { opacity: heroSky.cloudOpacity }]} />
              <View style={[styles.cloudLarge, styles.premiumCloudLarge, { opacity: heroSky.cloudOpacity }]} />
            </View>

            <Animated.View
              style={[
                styles.cozyIslandBase,
                styles.premiumIslandBase,
                {
                  transform: [{
                    translateY: heartAnimY.interpolate({
                      inputRange: [-55, 0],
                      outputRange: [-8, 0]
                    })
                  }]
                }
              ]}
            >
              <Image source={LOCAL_PET_ISLAND} style={styles.premiumIslandImage} contentFit="cover" />
              {realPetImage ? (
                <View style={styles.petPortrait}>
                  <Image source={realPetImage} style={styles.petPortraitImage} contentFit="contain" />
                </View>
              ) : null}
              <Animated.View
                style={[
                  styles.floatingHearts,
                  {
                    opacity: heartOpacity,
                    transform: [{ translateY: heartAnimY }]
                  }
                ]}
              >
                <Text style={styles.floatingHeartText}>💕</Text>
              </Animated.View>
            </Animated.View>

            <View style={styles.premiumHeroCopy}>
              <Text style={[styles.cozyLevelBadge, styles.premiumLevelBadge, { backgroundColor: heroSky.badgeBg, color: heroSky.badgeText, borderColor: heroSky.badgeBg }]}>
                섬 Lv.{snapshot.island.island_level}
              </Text>
              <Text style={[styles.title, styles.premiumHeroTitle, { color: heroSky.text }]}>{islandTitle}</Text>
              <Text style={[styles.description, styles.premiumHeroDescription, { color: heroSky.subText }]}>
                지금까지 {snapshot.profile.total_participation_count}개의 선택이 이 섬의 성격을 만들었어요.
              </Text>
            </View>
          </View>

          <View style={styles.currencyRow}>
            <GlassView style={styles.currencyCard} intensity={15} borderRadius={18}>
              <View style={styles.currencyIconWrapper}>
                <Image source={LOCAL_SHELL_ICON} style={{ width: 26, height: 26 }} contentFit="contain" />
              </View>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyLabel}>조개 재화</Text>
                <Text style={styles.currencyValue}>{shellBalance}</Text>
              </View>
            </GlassView>

            <GlassView style={styles.currencyCard} intensity={15} borderRadius={18}>
              <View style={styles.currencyIconWrapper}>
                <Image source={LOCAL_GEM_CHEST_ICON} style={{ width: 26, height: 26 }} contentFit="contain" />
              </View>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyLabel}>보물 상자</Text>
                <Text style={styles.currencyValue}>준비 중</Text>
              </View>
            </GlassView>
          </View>
        </View>

        <IslandModeTabs activeMode={activeMode} onChangeMode={setActiveMode} />

        {activeMode === 'discover' && (
          <View style={styles.modeContainer}>
            <PetDiaryCard snapshot={snapshot} />

            <Pressable
              style={styles.insightLink}
              accessibilityRole="button"
              accessibilityLabel="성향 지도 자세히 보기"
              onPress={() => router.push('/insight' as Href)}
            >
              <MaterialCommunityIcons name="chart-line-variant" size={16} color="#0f766e" />
              <Text style={styles.insightLinkText}>성향 지도 자세히 보기 ›</Text>
            </Pressable>
          </View>
        )}

        {activeMode === 'decorate' && (
          <View style={styles.modeContainer}>
            {/* 1. Island header summary */}
            <GlassView style={styles.myIslandHeader} intensity={18} borderRadius={22}>
              <View style={styles.myIslandRow}>
                <View style={styles.logoBadgeContainer}>
                  <View style={styles.logoCircle}>
                    <MaterialCommunityIcons name="island" size={14} color="#0f766e" />
                  </View>
                  <Text style={styles.logoBadgeText}>나의 섬</Text>
                </View>
                <View style={styles.myIslandStats}>
                  <View style={styles.myIslandStatItem}>
                    <Text style={styles.myIslandStatLabel}>기분 {moodVal}%</Text>
                    <View style={styles.miniTrack}>
                      <View style={[styles.miniFill, { width: petMood, backgroundColor: '#10b981' }]} />
                    </View>
                    <Text style={{ fontSize: 10 }}>😊</Text>
                  </View>
                  <View style={styles.myIslandStatItem}>
                    <Text style={styles.myIslandStatLabel}>에너지 {energyVal}%</Text>
                    <View style={styles.miniTrack}>
                      <View style={[styles.miniFill, { width: petEnergy, backgroundColor: '#f97316' }]} />
                    </View>
                    <Text style={{ fontSize: 10 }}>⚡</Text>
                  </View>
                </View>
              </View>
            </GlassView>

            {/* 2. Pet mood and energy panels */}
            <View style={styles.statusRow}>
              <GlassView style={styles.statusCard} intensity={15} borderRadius={20}>
                <View style={styles.statusHeaderRow}>
                  <Ionicons name="paw" size={12} color="#10b981" style={{ marginRight: 4 }} />
                  <Text style={styles.statusCardLabel}>펫 기분</Text>
                </View>
                <Text style={styles.statusCardValue}>{moodVal >= 70 ? '무척 신나요' : '쉬는 중이에요'}</Text>
                <View style={styles.statusTrack}>
                  <View style={[styles.statusFill, { width: petMood, backgroundColor: '#10b981' }]} />
                </View>
                <Text style={styles.statusProgressText}>{moodVal} / 100</Text>
              </GlassView>

              <GlassView style={styles.statusCard} intensity={15} borderRadius={20}>
                <View style={styles.statusHeaderRow}>
                  <Ionicons name="flash" size={12} color="#f97316" style={{ marginRight: 4 }} />
                  <Text style={styles.statusCardLabel}>활동 에너지</Text>
                </View>
                <Text style={styles.statusCardValue}>{energyVal >= 70 ? '탐험 준비 완료' : '돌봄이 필요해요'}</Text>
                <View style={styles.statusTrack}>
                  <View style={[styles.statusFill, { width: petEnergy, backgroundColor: '#f97316' }]} />
                </View>
                <Text style={styles.statusProgressText}>{energyVal} / 100</Text>
              </GlassView>
            </View>

            {/* 3. Sunset Cozy Island (Hero representation) with floating animation */}
            <View style={[styles.cozyHero, { borderColor: skyPhase.badgeBg, backgroundColor: skyPhase.top }]}>
              <View style={[styles.sky, { backgroundColor: skyPhase.top }]}>
                <View style={[styles.skyBand, { backgroundColor: skyPhase.mid }]} />
                <View style={[styles.sun, { backgroundColor: skyPhase.sun }]} />
                <View style={[styles.cloudSmall, { opacity: skyPhase.cloudOpacity }]} />
                <View style={[styles.cloudLarge, { opacity: skyPhase.cloudOpacity }]} />
              </View>
              
              {/* Animated Floating 3D Island & Puppy */}
              <Animated.View style={[
                styles.cozyIslandBase,
                {
                  transform: [{ translateY: heartAnimY.interpolate({
                    inputRange: [-55, 0],
                    outputRange: [-6, 0]
                  }) }]
                }
              ]}>
                <Image 
                  source={petImage}
                  style={styles.cozyIslandImage} 
                  contentFit="contain" 
                />
                
                {/* Floating hearts */}
                <Animated.View style={[
                  styles.floatingHearts,
                  {
                    opacity: heartOpacity,
                    transform: [{ translateY: heartAnimY }]
                  }
                ]}>
                  <Text style={{ fontSize: 26 }}>❤️</Text>
                </Animated.View>
              </Animated.View>

              <Text style={[styles.cozyLevelBadge, { backgroundColor: skyPhase.badgeBg, color: skyPhase.badgeText, borderColor: skyPhase.badgeBg }]}>
                섬 Lv.{snapshot.island.island_level} · {snapshot.petSpecies?.display_name ?? '골든 리트리버'}
              </Text>
            </View>

            {/* 4. Currency panels */}
            <View style={styles.currencyRow}>
              <GlassView style={styles.currencyCard} intensity={15} borderRadius={18}>
                <View style={styles.currencyIconWrapper}>
                  <Image source={LOCAL_SHELL_ICON} style={{ width: 26, height: 26 }} contentFit="contain" />
                </View>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyLabel}>조개 재화</Text>
                  <Text style={[styles.currencyValue, styles.currencyValueGold]}>{shellBalance}</Text>
                </View>
              </GlassView>

              <GlassView style={styles.currencyCard} intensity={15} borderRadius={18}>
                <View style={styles.currencyIconWrapper}>
                  <Image source={LOCAL_GEM_CHEST_ICON} style={{ width: 26, height: 26 }} contentFit="contain" />
                </View>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyLabel}>보물 상자</Text>
                  <Text style={styles.currencyValue}>준비 중</Text>
                </View>
              </GlassView>
            </View>

            {/* 5. Draw & Care action Grid */}
            <GlassView style={styles.controlPanel} intensity={12} borderRadius={24}>
              <Text style={styles.controlTitle}>성장 및 테마 가챠</Text>
              
              <View style={styles.actionGrid}>
                <ActionButton icon="account-heart" label="펫 배정" disabled={actionDisabled} onPress={() => runAuthAction(assignPet)} />
                <ActionButton icon="gift" label="무료 테마" disabled={actionDisabled} onPress={() => runAuthAction(claimTheme)} />
                <ActionButton icon="treasure-chest" label="테마 뽑기" disabled={actionDisabled} onPress={() => runAuthAction(() => {
                  void drawTheme();
                  analyticsService.track('theme_draw_submit', { pool: 'standard-theme', count: 1 });
                })} />
              </View>

              <View style={styles.careRow}>
                <ActionButton icon="food-apple" label="간식" disabled={actionDisabled} onPress={() => runAuthAction(() => careForAvatar('snack'))} />
                <ActionButton icon="gamepad-variant" label="놀아주기" disabled={actionDisabled} onPress={() => runAuthAction(() => careForAvatar('play'))} />
                <ActionButton icon="heart" label="칭찬" disabled={actionDisabled} onPress={() => runAuthAction(() => careForAvatar('praise'))} />
              </View>

              <Pressable
                style={styles.probabilityLink}
                onPress={() => {
                  analyticsService.track('theme_draw_probability_open', { pool: 'standard-theme' });
                  setIsProbabilityVisible(true);
                }}
              >
                <MaterialCommunityIcons name="information-outline" size={15} color="#0f766e" />
                <Text style={styles.probabilityLinkText}>획득 확률 및 피티 규칙 보기</Text>
              </Pressable>
            </GlassView>

            {/* 6. Theme Inventory 보관함 */}
            <ThemeInventorySection snapshot={snapshot} />
          </View>
        )}
      </ScrollView>
      </SafeAreaView>

      <ThemeDrawModal results={lastThemeDrawResults} onClose={clearThemeDrawResults} />
      <ThemeProbabilitySheet visible={isProbabilityVisible} onClose={() => setIsProbabilityVisible(false)} poolSlug="standard-theme" />

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
    height: 28,
    position: 'absolute',
    right: 80,
    top: 44,
    width: 74
  },
  cloudSmall: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    height: 22,
    left: 44,
    position: 'absolute',
    top: 50,
    width: 54
  },
  container: {
    backgroundColor: 'transparent',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 44,
    paddingTop: 18
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
    fontWeight: '900'
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
    height: 100,
    justifyContent: 'center',
    marginTop: 24,
    width: 170
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
  sky: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0
  },
  skyBand: {
    bottom: 0,
    height: 60,
    left: 0,
    opacity: 0.45,
    position: 'absolute',
    right: 0
  },
  sun: {
    backgroundColor: '#fde68a',
    borderRadius: 999,
    height: 40,
    position: 'absolute',
    right: 32,
    top: 20,
    width: 40
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
  },
  modeContainer: {
    width: '100%'
  },
  insightLink: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(15,118,110,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48
  },
  insightLinkText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '900'
  },
  miniIcon: {
    fontSize: 10
  },
  premiumIslandFrame: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 34,
    borderWidth: 1,
    marginTop: 18,
    maxWidth: 460,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    width: '100%'
  },
  probabilityLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 4
  },
  probabilityLinkText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800'
  },
  scroller: {
    flex: 1
  },
  summaryText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 14,
    marginTop: 8
  },
  myIslandHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginTop: 16
  },
  myIslandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a'
  },
  myIslandStats: {
    gap: 6
  },
  myIslandStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6
  },
  myIslandStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  miniTrack: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  miniFill: {
    height: '100%',
    borderRadius: 3
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 110
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b'
  },
  statusCardValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4
  },
  statusTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8
  },
  statusFill: {
    height: '100%',
    borderRadius: 4
  },
  statusProgressText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4
  },
  cozyHero: {
    height: 220,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  premiumCozyHero: {
    height: 360,
    marginTop: 14
  },
  cozyIslandBase: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    position: 'relative',
    width: '100%',
    height: 160
  },
  premiumIslandBase: {
    bottom: 0,
    height: '100%',
    left: 0,
    marginTop: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2
  },
  cozyIslandImage: {
    width: 220,
    height: 160
  },
  premiumIslandImage: {
    height: '100%',
    opacity: 0.98,
    width: '100%'
  },
  petPortrait: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 28,
    borderWidth: 1,
    bottom: 86,
    height: 88,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    width: 88,
    zIndex: 8
  },
  petPortraitImage: {
    height: 72,
    width: 72
  },
  floatingHearts: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    zIndex: 99
  },
  floatingHeartText: {
    fontSize: 28
  },
  cozyLevelBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    borderRadius: 999,
    borderWidth: 1,
    color: '#b45309',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    bottom: 12
  },
  premiumHeroCopy: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    bottom: 0,
    left: 22,
    paddingBottom: 18,
    paddingTop: 48,
    position: 'absolute',
    right: 22,
    zIndex: 3
  },
  premiumHeroDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
  },
  premiumHeroTitle: {
    fontSize: 23,
    lineHeight: 29,
    marginTop: 8
  },
  premiumLevelBadge: {
    bottom: 0,
    position: 'relative'
  },
  premiumSkyBand: {
    height: 128,
    opacity: 0.58
  },
  premiumSun: {
    height: 72,
    left: 28,
    top: 180,
    width: 72
  },
  premiumCloudLarge: {
    right: 36,
    top: 52,
    width: 108
  },
  premiumCloudSmall: {
    left: 34,
    top: 70,
    width: 72
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14
  },
  currencyCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    gap: 10
  },
  currencyIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1
  },
  currencyInfo: {
    flex: 1
  },
  currencyLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#64748b'
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2
  },
  currencyValueGold: {
    color: '#b45309'
  },
  controlPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 14
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#164e63',
    marginBottom: 10
  }
});
