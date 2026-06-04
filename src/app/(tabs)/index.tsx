import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, RefreshControl, StyleSheet, Text, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BalanceCard from '../../components/feed/BalanceCard';
import ChoiceEchoSheet from '../../components/feed/ChoiceEchoSheet';
import { useFeedStore } from '../../store/feedStore';
import { generateChoiceEcho, type ChoiceEchoResult } from '../../utils/choiceEcho';
import { getDailyTheme } from '../../utils/dailyTheme';
import { useGamificationStore } from '../../store/gamificationStore';
import { analyticsService } from '../../services/analyticsService';
import type { FeedQuestion, OptionSide, ReactionType } from '../../services/questionService';
import { THEME } from '../../theme/styles';

type Particle = {
  id: string;
  emoji: string;
  x: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
};

export default function FeedScreen() {
  const { questions, isLoading, error, loadFeedQuestions, voteOnQuestion, reactToQuestion } = useFeedStore();
  const prefetched = useRef(new Set<string>());
  const [isEchoVisible, setIsEchoVisible] = useState(false);
  const [echoData, setEchoData] = useState<ChoiceEchoResult | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const totalVotes = questions.reduce((sum, question) => sum + question.vote_count_a + question.vote_count_b, 0);
  const votedCount = questions.filter((question) => question.userVote).length;
  const dailyTheme = getDailyTheme();
  const gamificationSnapshot = useGamificationStore((state) => state.snapshot);
  const loadGamification = useGamificationStore((state) => state.loadSnapshot);
  const level = gamificationSnapshot?.avatarState.level ?? null;
  const xp = gamificationSnapshot?.avatarState.experience ?? 0;
  // 다음 레벨까지의 간단한 XP 임계(레벨×100). 서버 곡선이 생기면 교체.
  const xpGoal = level ? level * 100 : 0;
  const xpRatio = xpGoal > 0 ? Math.max(0, Math.min(1, xp / xpGoal)) : 0;

  useEffect(() => {
    loadFeedQuestions();
    analyticsService.track('feed_impression');
  }, [loadFeedQuestions]);

  useEffect(() => {
    if (!gamificationSnapshot) {
      void loadGamification();
    }
  }, [gamificationSnapshot, loadGamification]);

  const spawnParticles = useCallback((emoji: string, startX: number) => {
    const id = Math.random().toString();
    const animY = new Animated.Value(0);
    const animOpacity = new Animated.Value(1);

    const newParticle: Particle = {
      id,
      emoji,
      x: startX,
      translateY: animY,
      opacity: animOpacity
    };

    setParticles((prev) => {
      const next = [...prev.slice(-11), newParticle];
      return next;
    });

    const rise = THEME.motion.particle.riseMin + Math.random() * (THEME.motion.particle.riseMax - THEME.motion.particle.riseMin);
    const duration = THEME.motion.duration.particle + Math.random() * 240;

    Animated.parallel([
      Animated.timing(animY, {
        toValue: -rise,
        duration: duration,
        useNativeDriver: true
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true
      })
    ]).start(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    });
  }, []);

  const prefetchNextImages = useCallback((index: number) => {
    const urls = questions
      .slice(index + 1, index + 4)
      .flatMap((question) => [question.option_a_image_url, question.option_b_image_url])
      .filter((url): url is string => Boolean(url && !prefetched.current.has(url)));

    urls.forEach((url) => prefetched.current.add(url));
    urls.forEach((url) => {
      Image.prefetch(url).catch(() => {
        prefetched.current.delete(url);
      });
    });
  }, [questions]);

  const prefetchNextImagesRef = useRef(prefetchNextImages);
  useEffect(() => {
    prefetchNextImagesRef.current = prefetchNextImages;
  }, [prefetchNextImages]);

  // Keep a fully constant ref to avoid onViewableItemsChanged flatlist runtime error
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    const first = viewableItems[0]?.index;
    if (typeof first === 'number') {
      prefetchNextImagesRef.current(first);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleVote = useCallback((questionId: string, option: OptionSide) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    void voteOnQuestion(questionId, option);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = generateChoiceEcho(question, option);
    setEchoData(result);
    setIsEchoVisible(true);

    analyticsService.track('vote_submit', {
      questionId,
      category: question.category?.slug,
      option,
      rarityTier: result.rarityTier,
      rarityPercent: result.rarityPercent
    });
  }, [questions, voteOnQuestion]);

  const handleReaction = useCallback((questionId: string, reactionType: ReactionType) => {
    void reactToQuestion(questionId, reactionType);

    let emoji = '❤️';
    if (reactionType === 'fun') emoji = '😆';
    if (reactionType === 'hard') emoji = '🤔';

    const baseCol = Math.random() * 160 + 80;
    spawnParticles(emoji, baseCol);
    setTimeout(() => spawnParticles(emoji, baseCol - 30), 120);
    setTimeout(() => spawnParticles(emoji, baseCol + 30), 240);
  }, [reactToQuestion, spawnParticles]);

  const renderItem = useCallback(({ item }: { item: FeedQuestion; index: number }) => {
    return (
      <BalanceCard
        question={item}
        onVote={handleVote}
        onReaction={handleReaction}
        onOpenComments={() => Alert.alert('댓글', '댓글 화면은 다음 단계에서 연결합니다.')}
      />
    );
  }, [handleReaction, handleVote]);

  if (isLoading && questions.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.centerText}>밸런스 카드를 준비하고 있어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 파스텔 보케 그라데이션 배경 (gradients.feedBokeh 토큰) */}
      <LinearGradient
        colors={THEME.gradients.feedBokeh}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Background color spots matching the mockup */}
      <View style={styles.spot1} pointerEvents="none" />
      <View style={styles.spot2} pointerEvents="none" />
      <View style={styles.spot3} pointerEvents="none" />
      <View style={styles.spot4} pointerEvents="none" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logoText}>
            <Text style={{ color: '#0f766e', fontWeight: '900' }}>Balance </Text>
            <Text style={{ color: '#fb923c', fontWeight: '900' }}>Island</Text>
          </Text>
          {level ? (
            <View style={styles.levelChip}>
              <Text style={styles.levelChipLabel}>Lv.{level}</Text>
              <View style={styles.levelXpTrack}>
                <View style={[styles.levelXpFill, { width: `${Math.round(xpRatio * 100)}%` }]} />
              </View>
              <Text style={styles.levelXpText}>{xp}/{xpGoal}</Text>
            </View>
          ) : null}
          <View style={styles.profileBadge}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        </View>
        
        {/* Glassmorphic Stats bar matching mockup */}
        <View style={styles.headerStats}>
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>{questions.length}개 질문</Text>
            <Text style={styles.statsSub}>오늘의 밸런스</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>{totalVotes.toLocaleString('ko-KR')}표</Text>
            <Text style={styles.statsSub}>{votedCount}개 선택 완료</Text>
          </View>
        </View>

        <View style={styles.themeBanner}>
          <Text style={styles.themeEmoji}>{dailyTheme.emoji}</Text>
          <View style={styles.themeTextArea}>
            <Text style={styles.themeLabel}>{dailyTheme.label}</Text>
            <Text style={styles.themeName}>{dailyTheme.name}</Text>
          </View>
          <Text style={styles.themeBlurb} numberOfLines={2}>{dailyTheme.blurb}</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={questions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>표시할 질문이 없습니다.</Text>}
        onViewableItemsChanged={onViewableItemsChanged}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadFeedQuestions()} />}
        renderItem={renderItem}
        viewabilityConfig={viewabilityConfig}
      />
      
      <ChoiceEchoSheet
        visible={isEchoVisible}
        onClose={() => setIsEchoVisible(false)}
        echoData={echoData}
      />
      
      {particles.map((p) => (
        <Animated.Text
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.x,
              opacity: p.opacity,
              transform: [{ translateY: p.translateY }]
            }
          ]}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: '#fff5ec',
    flex: 1,
    gap: 12,
    justifyContent: 'center'
  },
  centerText: {
    color: '#52716d',
    fontWeight: '700'
  },
  spot1: {
    position: 'absolute',
    left: -100,
    top: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#ffdadb',
    opacity: 0.55,
    // @ts-ignore
    filter: 'blur(80px)',
    webkitFilter: 'blur(80px)'
  },
  spot2: {
    position: 'absolute',
    right: -100,
    top: 100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#d0ebff',
    opacity: 0.6,
    // @ts-ignore
    filter: 'blur(90px)',
    webkitFilter: 'blur(90px)'
  },
  spot3: {
    position: 'absolute',
    left: -80,
    bottom: 150,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#f1e1ff',
    opacity: 0.5,
    // @ts-ignore
    filter: 'blur(75px)',
    webkitFilter: 'blur(75px)'
  },
  spot4: {
    position: 'absolute',
    right: -50,
    bottom: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#fffbcb',
    opacity: 0.5,
    // @ts-ignore
    filter: 'blur(70px)',
    webkitFilter: 'blur(70px)'
  },
  container: {
    backgroundColor: '#fff5ec',
    // @ts-ignore
    backgroundImage: 'linear-gradient(135deg, #FFF0F5 0%, #E6F3FF 35%, #F0E6FF 70%, #FFFFE0 100%)',
    flex: 1
  },
  empty: {
    color: '#52716d',
    fontWeight: '700',
    marginTop: 80,
    textAlign: 'center'
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8
  },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 54
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  levelChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  levelChipLabel: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900'
  },
  levelXpTrack: {
    backgroundColor: 'rgba(15,23,42,0.1)',
    borderRadius: 999,
    height: 5,
    overflow: 'hidden',
    width: 48
  },
  levelXpFill: {
    backgroundColor: '#fb923c',
    borderRadius: 999,
    height: '100%'
  },
  levelXpText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800'
  },
  profileBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  themeBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderColor: 'rgba(251, 146, 60, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  themeEmoji: {
    fontSize: 24
  },
  themeTextArea: {
    gap: 1
  },
  themeLabel: {
    color: '#c2410c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  themeName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900'
  },
  themeBlurb: {
    color: '#9a3412',
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right'
  },
  statsItem: {
    alignItems: 'center',
    flex: 1
  },
  statsLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900'
  },
  statsSub: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1
  },
  statsDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 12
  },
  listContent: {
    paddingBottom: 32,
    paddingTop: 2
  },
  particle: {
    fontSize: 28,
    position: 'absolute',
    bottom: 120,
    zIndex: 9999,
    pointerEvents: 'none'
  }
});
