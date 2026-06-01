import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ViewToken,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BalanceCard } from '../../components/feed/BalanceCard';
import { useFeedStore } from '../../store/feedStore';
import { supabase } from '../../services/questionService';
import type { OptionSide, Question, QuestionReactionType } from '../../types/database.types';

const PREFETCH_CARD_COUNT = 3;
const FEED_LIMIT = 30;

const getQuestionImageUrls = (question: Question) => [
  question.option_a_image_url,
  question.option_b_image_url,
];

export default function MainFeedScreen() {
  const { height } = useWindowDimensions();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefetchedUrlsRef = useRef<Set<string>>(new Set());
  const questionsRef = useRef<Question[]>([]);

  const {
    questions,
    userVotes,
    userReactions,
    isLoading,
    error,
    loadFeedQuestions,
    castVoteLocal,
    voteOnQuestion,
    reactToQuestion,
    clearError,
  } = useFeedStore();

  questionsRef.current = questions;

  const itemHeight = useMemo(() => Math.max(660, height - 84), [height]);

  const prefetchNextImages = useCallback((index: number) => {
    const nextUrls = questionsRef.current
      .slice(index + 1, index + 1 + PREFETCH_CARD_COUNT)
      .flatMap(getQuestionImageUrls)
      .filter((url): url is string => Boolean(url && !prefetchedUrlsRef.current.has(url)));

    if (nextUrls.length === 0) {
      return;
    }

    nextUrls.forEach((url) => prefetchedUrlsRef.current.add(url));

    Image.prefetch(nextUrls, 'memory-disk').catch(() => {
      nextUrls.forEach((url) => prefetchedUrlsRef.current.delete(url));
    });
  }, []);

  const refreshFeed = useCallback(async () => {
    await loadFeedQuestions({
      userId,
      sort: 'hot',
      limit: FEED_LIMIT,
    });
  }, [loadFeedQuestions, userId]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const authUser = supabase ? await supabase.auth.getUser() : null;
      const nextUserId = authUser?.data.user?.id ?? null;

      if (!isMounted) {
        return;
      }

      setUserId(nextUserId);
      await loadFeedQuestions({
        userId: nextUserId,
        sort: 'hot',
        limit: FEED_LIMIT,
      });
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [loadFeedQuestions]);

  useEffect(() => {
    prefetchNextImages(currentIndex);
  }, [currentIndex, prefetchNextImages, questions]);

  useEffect(() => {
    if (error) {
      Alert.alert('피드를 불러오지 못했어요', error, [
        { text: '닫기', style: 'cancel', onPress: clearError },
        { text: '다시 시도', onPress: refreshFeed },
      ]);
    }
  }, [clearError, error, refreshFeed]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Question>[] }) => {
      const firstVisibleIndex = viewableItems.find((item) => item.isViewable)?.index;

      if (typeof firstVisibleIndex !== 'number') {
        return;
      }

      setCurrentIndex(firstVisibleIndex);
      prefetchNextImages(firstVisibleIndex);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 72,
    minimumViewTime: 120,
  }).current;

  const handleVote = useCallback(
    async (questionId: string, option: OptionSide) => {
      if (!userId) {
        castVoteLocal(questionId, option);
        return;
      }

      await voteOnQuestion({
        userId,
        questionId,
        selectedOption: option,
      });
    },
    [castVoteLocal, userId, voteOnQuestion],
  );

  const handleReaction = useCallback(
    async (questionId: string, reactionType: QuestionReactionType) => {
      if (!userId) {
        Alert.alert('로그인이 필요해요', '반응은 로그인 후 기록할 수 있어요.');
        return;
      }

      await reactToQuestion({
        userId,
        questionId,
        reactionType,
      });
    },
    [reactToQuestion, userId],
  );

  const handleOpenComments = useCallback((question: Question) => {
    Alert.alert('댓글', `"${question.title}" 댓글 화면은 다음 단계에서 연결됩니다.`);
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Question>) => {
      const selectedOption = userVotes[item.id];

      return (
        <View style={[styles.itemShell, { minHeight: itemHeight }]}>
          <BalanceCard
            question={item}
            hasVoted={Boolean(selectedOption)}
            selectedOption={selectedOption}
            selectedReactions={userReactions[item.id] ?? []}
            onVote={(option) => handleVote(item.id, option)}
            onReaction={(reactionType) => handleReaction(item.id, reactionType)}
            onOpenComments={() => handleOpenComments(item)}
          />
        </View>
      );
    },
    [handleOpenComments, handleReaction, handleVote, itemHeight, userReactions, userVotes],
  );

  const emptyState = useMemo(() => {
    if (isLoading) {
      return null;
    }

    return (
      <View style={[styles.emptyState, { minHeight: itemHeight }]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="file-tray" size={28} color="#0F172A" />
        </View>
        <Text style={styles.emptyTitle}>볼 수 있는 질문이 아직 없어요</Text>
        <Text style={styles.emptyDescription}>
          새 질문이 승인되면 이곳에 바로 나타납니다.
        </Text>
      </View>
    );
  }, [isLoading, itemHeight]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.headerEyebrow}>BALANCE ISLAND</Text>
          <Text style={styles.headerTitle}>오늘의 밸런스</Text>
        </View>
        <View style={styles.liveBadge}>
          <Ionicons name="flash" size={15} color="#FFFFFF" />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>

      {isLoading && questions.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>피드를 준비하고 있어요</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={emptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={itemHeight}
          snapToAlignment="start"
          disableIntervalMomentum
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          removeClippedSubviews
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: itemHeight,
            offset: itemHeight * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && questions.length > 0}
              tintColor="#0EA5E9"
              colors={['#0EA5E9']}
              onRefresh={refreshFeed}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0EA5E9',
  },
  headerTitle: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#0F172A',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemShell: {
    justifyContent: 'center',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
});
