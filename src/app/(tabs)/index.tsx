import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View, Animated } from 'react-native';
import { Image } from 'expo-image';
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
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={styles.skyBand} />
        <View style={styles.seaBand} />
      </View>
      <View style={styles.header}>
        <Text style={styles.kicker}>밸런스 아일랜드</Text>
        <Text style={styles.heading}>오늘의 밸런스</Text>
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
    backgroundColor: '#e9fbf6',
    flex: 1,
    gap: 12,
    justifyContent: 'center'
  },
  centerText: {
    color: '#52716d',
    fontWeight: '700'
  },
  container: {
    backgroundColor: '#f4fbf8',
    flex: 1
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  seaBand: {
    backgroundColor: '#dff7ed',
    bottom: 0,
    left: 0,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
    top: 250
  },
  skyBand: {
    backgroundColor: '#0f3d3a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    height: 250,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  empty: {
    color: '#52716d',
    fontWeight: '700',
    marginTop: 80,
    textAlign: 'center'
  },
  error: {
    color: '#fecdd3',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8
  },
  header: {
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 58
  },
  heading: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginTop: 6
  },
  kicker: {
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0
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
