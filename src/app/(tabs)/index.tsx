import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import BalanceCard from '../../components/feed/BalanceCard';
import { useFeedStore } from '../../store/feedStore';
import type { FeedQuestion } from '../../services/questionService';

export default function FeedScreen() {
  const { questions, isLoading, error, loadFeedQuestions, voteOnQuestion, reactToQuestion } = useFeedStore();
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    loadFeedQuestions();
  }, [loadFeedQuestions]);

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

  const renderItem = useCallback(({ item }: { item: FeedQuestion; index: number }) => {
    return (
      <BalanceCard
        question={item}
        onVote={voteOnQuestion}
        onReaction={reactToQuestion}
        onOpenComments={(questionId) => Alert.alert('댓글', `${questionId} 댓글 화면은 다음 단계에서 연결합니다.`)}
      />
    );
  }, [reactToQuestion, voteOnQuestion]);

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
        <Text style={styles.kicker}>Balance Island</Text>
        <Text style={styles.heading}>오늘의 선택 카드</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={questions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>표시할 질문이 없습니다.</Text>}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems[0]?.index;
          if (typeof first === 'number') prefetchNextImages(first);
        }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadFeedQuestions()} />}
        renderItem={renderItem}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      />
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
    backgroundColor: '#e9fbf6',
    flex: 1
  },
  empty: {
    color: '#52716d',
    fontWeight: '700',
    marginTop: 80,
    textAlign: 'center'
  },
  error: {
    color: '#be123c',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8
  },
  header: {
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 56
  },
  heading: {
    color: '#12312f',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  kicker: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '900'
  },
  listContent: {
    paddingBottom: 32
  }
});
