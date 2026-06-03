import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import BalanceCard from '../../components/feed/BalanceCard';
import ChoiceEchoSheet from '../../components/feed/ChoiceEchoSheet';
import { useFeedStore } from '../../store/feedStore';
import { generateChoiceEcho, type ChoiceEchoResult } from '../../utils/choiceEcho';
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

  useEffect(() => {
    loadFeedQuestions();
    analyticsService.track('feed_impression');
  }, [loadFeedQuestions]);

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

    // Background call
    void voteOnQuestion(questionId, option);

    // Immediate UI reaction
    const result = generateChoiceEcho(question, option);
    setEchoData(result);
    setIsEchoVisible(true);

    analyticsService.track('vote_submit', {
      questionId,
      category: question.category?.slug,
      option
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logoText}>
            <Text style={{ color: '#0ea5e9', fontWeight: '900' }}>Balance </Text>
            <Text style={{ color: '#f97316', fontWeight: '900' }}>Island</Text>
          </Text>
          <View style={styles.profileBadge}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>Level 12</Text>
            <Text style={styles.statsSub}>Cozy Life</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>78 | 425</Text>
            <Text style={styles.statsSub}>210° 40% 90%</Text>
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 14
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

