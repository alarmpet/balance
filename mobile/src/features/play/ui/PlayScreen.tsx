import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/design/tokens';
import { RetryButton } from '@/src/components/RetryButton';
import { isAnalyticsUuid, type AnalyticsEventInput } from '@/src/features/analytics/analytics';
import type { PendingActionQueue } from '@/src/features/session/data/pendingActions';
import type { ReasonCode } from '@/src/features/moderation/domain/reasons';
import { ReasonChips } from '@/src/features/moderation/ui/ReasonChips';
import {
  ClosedQuestionError,
  isDuplicateVoteError,
  isRetryableTransportError,
  type QuestionRepository,
} from '../data/QuestionRepository';
import type { Question, VoteChoice, VoteResult } from '../domain/question';
import { useDeckStore } from '../state/useDeckStore';
import { QuestionCard } from './QuestionCard';
import { ResultOverlay } from './ResultOverlay';

interface PlayScreenProps {
  canMutate?: boolean;
  repository: QuestionRepository;
  userId: string;
  createActionId?: () => string;
  pendingActionQueue?: PendingActionQueue;
  sourceId?: string;
  trackEvent?: (event: AnalyticsEventInput) => Promise<void>;
}

const repositorySources = new WeakMap<QuestionRepository, string>();
let repositorySourceSequence = 0;

interface PendingReasonReaction {
  repository: QuestionRepository;
  questionId: string;
  userId: string;
  reason: ReasonCode;
  generation: number;
}

function sourceIdFor(repository: QuestionRepository): string {
  const existing = repositorySources.get(repository);
  if (existing) return existing;
  const sourceId = `repository-${++repositorySourceSequence}`;
  repositorySources.set(repository, sourceId);
  return sourceId;
}

function today(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PlayScreen({
  canMutate = true,
  repository,
  userId,
  createActionId = randomUUID,
  pendingActionQueue,
  sourceId: providedSourceId,
  trackEvent,
}: PlayScreenProps) {
  const index = useDeckStore((state) => state.index);
  const advance = useDeckStore((state) => state.advance);
  const reset = useDeckStore((state) => state.reset);
  const [result, setResult] = useState<VoteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [failedVoteChoice, setFailedVoteChoice] = useState<VoteChoice | null>(null);
  const [failedReasonReaction, setFailedReasonReaction] = useState<PendingReasonReaction | null>(null);
  const submissionLock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  const generation = useRef(0);
  const pendingReasonReactions = useRef<PendingReasonReaction[]>([]);
  const trackedImpressions = useRef(new Set<string>());
  const savingReasonReaction = useRef(false);
  const canMutateRef = useRef(canMutate);
  canMutateRef.current = canMutate;
  const currentDate = useMemo(today, []);
  const sourceId = useMemo(
    () => providedSourceId ?? sourceIdFor(repository),
    [providedSourceId, repository],
  );

  const daily = useQuery({
    queryKey: ['daily', sourceId, currentDate],
    queryFn: () => repository.getDaily(currentDate),
  });
  const feed = useInfiniteQuery({
    queryKey: ['feed', sourceId, userId],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => repository.getFeed({ userId, cursor: pageParam, limit: 20 }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });

  const questions = useMemo(() => {
    const unique = new Map<string, Question>();
    if (daily.data) unique.set(daily.data.id, daily.data);
    for (const page of feed.data?.pages ?? []) {
      for (const item of page.items) {
        if (!unique.has(item.id)) unique.set(item.id, item);
      }
    }
    return [...unique.values()];
  }, [daily.data, feed.data]);
  const question = questions[index];

  useEffect(() => {
    if (!trackEvent || !question || !isAnalyticsUuid(userId)
      || !isAnalyticsUuid(question.id)
      || trackedImpressions.current.has(question.id)) return;
    trackedImpressions.current.add(question.id);
    void trackEvent({ name: 'question_impression', userId, questionId: question.id, source: 'play' })
      .catch(() => trackedImpressions.current.delete(question.id));
  }, [question, trackEvent, userId]);

  useEffect(() => {
    mounted.current = true;
    const activeGeneration = ++generation.current;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    submissionLock.current = false;
    setResult(null);
    setSubmitting(false);
    setActionError(null);
    setFailedVoteChoice(null);
    setFailedReasonReaction(null);
    pendingReasonReactions.current = [];
    reset();
    return () => {
      mounted.current = false;
      if (generation.current === activeGeneration) generation.current += 1;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      submissionLock.current = false;
      setResult(null);
      setSubmitting(false);
      setActionError(null);
      setFailedVoteChoice(null);
      setFailedReasonReaction(null);
      pendingReasonReactions.current = [];
    };
  }, [reset, repository, sourceId, userId]);

  useEffect(() => {
    if (canMutate) return;
    pendingReasonReactions.current = [];
    setFailedReasonReaction(null);
    setFailedVoteChoice(null);
  }, [canMutate]);

  useEffect(() => {
    if (questions.length - index < 5 && feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed.fetchNextPage, feed.hasNextPage, feed.isFetchingNextPage, index, questions.length]);

  const vote = useCallback((choice: VoteChoice): boolean => {
    if (!canMutate || !question || submissionLock.current) return false;
    submissionLock.current = true;
    setSubmitting(true);
    setActionError(null);
    setFailedVoteChoice(null);
    const requestGeneration = generation.current;
    const actionId = createActionId();
    void (async () => {
      try {
        const receipt = await repository.vote({
          questionId: question.id,
          userId,
          choice,
          actionId,
        });
        if (!mounted.current || generation.current !== requestGeneration) return;
        if (trackEvent) {
          void trackEvent({ name: 'question_voted', userId, questionId: question.id, source: 'play' }).catch(() => undefined);
          void trackEvent({ name: 'result_viewed', userId, questionId: question.id, source: 'play' }).catch(() => undefined);
        }
        setResult(receipt);
        timer.current = setTimeout(() => {
          if (!mounted.current || generation.current !== requestGeneration) return;
          setResult(null);
          setSubmitting(false);
          submissionLock.current = false;
          advance();
        }, 800);
      } catch (error) {
        if (isDuplicateVoteError(error)) {
          if (!mounted.current || generation.current !== requestGeneration) return;
          setActionError('이미 이 질문에 투표했어요.');
          setFailedVoteChoice(choice);
          setSubmitting(false);
          submissionLock.current = false;
          return;
        }
        if (pendingActionQueue && isRetryableTransportError(error)) {
          try {
            await pendingActionQueue.enqueue({
              id: actionId,
              type: 'vote',
              questionId: question.id,
              choice,
              ownerId: userId,
              ...(userId.startsWith('guest_') ? { localGuestId: userId } : {}),
            });
            if (!mounted.current || generation.current !== requestGeneration) return;
            setActionError('오프라인 상태예요. 투표를 저장했어요.');
          } catch {
            if (!mounted.current || generation.current !== requestGeneration) return;
            setActionError('투표를 저장하지 못했어요. 다시 시도해 주세요.');
            setFailedVoteChoice(choice);
          }
        }
        if (!isRetryableTransportError(error)) {
          setActionError(error instanceof ClosedQuestionError
            ? '이미 마감된 질문이에요.'
            : '투표를 처리하지 못했어요. 내용을 확인한 뒤 다시 시도해 주세요.');
          setFailedVoteChoice(null);
        }
        if (!mounted.current || generation.current !== requestGeneration) return;
        setSubmitting(false);
        submissionLock.current = false;
      }
    })();
    return true;
  }, [advance, canMutate, createActionId, pendingActionQueue, question, repository, trackEvent, userId]);

  const skip = useCallback(async () => {
    if (!canMutate || !question || submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setActionError(null);
    const requestGeneration = generation.current;
    const actionId = createActionId();
    try {
      await repository.skip({ questionId: question.id, userId });
      if (!mounted.current || generation.current !== requestGeneration) return;
      if (trackEvent) void trackEvent({ name: 'question_skipped', userId, questionId: question.id, source: 'play' }).catch(() => undefined);
      advance();
    } catch (error) {
      if (pendingActionQueue && isRetryableTransportError(error)) {
        try {
          await pendingActionQueue.enqueue({
            id: actionId,
            type: 'skip',
            questionId: question.id,
            ownerId: userId,
            ...(userId.startsWith('guest_') ? { localGuestId: userId } : {}),
          });
          if (!mounted.current || generation.current !== requestGeneration) return;
          setActionError('오프라인 상태예요. 건너뛰기를 저장했어요.');
        } catch {
          if (!mounted.current || generation.current !== requestGeneration) return;
          setActionError('건너뛰기를 저장하지 못했어요. 다시 시도해 주세요.');
        }
      } else {
        if (!mounted.current || generation.current !== requestGeneration) return;
        setActionError('패스하지 못했어요. 다시 시도해 주세요.');
      }
    } finally {
      if (!mounted.current || generation.current !== requestGeneration) return;
      setSubmitting(false);
      submissionLock.current = false;
    }
  }, [advance, canMutate, createActionId, pendingActionQueue, question, repository, trackEvent, userId]);

  const drainReasonReactions = useCallback(() => {
    if (savingReasonReaction.current) return;
    savingReasonReaction.current = true;
    void (async () => {
      try {
        while (pendingReasonReactions.current.length > 0) {
          if (!canMutateRef.current) {
            pendingReasonReactions.current = [];
            break;
          }
          const nextReaction = pendingReasonReactions.current.shift()!;
          if (generation.current !== nextReaction.generation) continue;
          try {
            const { repository: targetRepository, generation: _generation, ...input } = nextReaction;
            await targetRepository.reactReason?.(input);
            if (!canMutateRef.current) {
              pendingReasonReactions.current = [];
              setFailedReasonReaction(null);
              break;
            }
            if (generation.current !== nextReaction.generation) continue;
          } catch {
            if (mounted.current && canMutateRef.current && generation.current === nextReaction.generation) {
              setFailedReasonReaction(nextReaction);
            }
          }
        }
      } finally {
        savingReasonReaction.current = false;
      }
    })();
  }, []);

  const reactReason = useCallback((reason: ReasonCode) => {
    if (!canMutate || !question || !repository.reactReason) return;
    setFailedReasonReaction(null);
    const reaction = { repository, questionId: question.id, userId, reason, generation: generation.current };
    const queuedIndex = pendingReasonReactions.current.findIndex((queued) =>
      queued.repository === repository && queued.questionId === question.id && queued.userId === userId,
    );
    if (queuedIndex >= 0) {
      pendingReasonReactions.current[queuedIndex] = reaction;
    } else {
      pendingReasonReactions.current.push(reaction);
    }
    drainReasonReactions();
  }, [canMutate, drainReasonReactions, question, repository, userId]);

  const retryReasonReaction = useCallback(() => {
    if (!canMutate || !failedReasonReaction) return;
    const reaction = failedReasonReaction;
    setFailedReasonReaction(null);
    pendingReasonReactions.current.unshift(reaction);
    drainReasonReactions();
  }, [canMutate, drainReasonReactions, failedReasonReaction]);

  if (daily.isPending || feed.isPending) {
    return <ActivityIndicator accessibilityLabel="질문 불러오는 중" />;
  }
  if (daily.isError || feed.isError) {
    return (
      <View style={styles.recovery}>
        <Text accessibilityRole="alert">질문을 불러오지 못했어요.</Text>
        <RetryButton
          accessibilityLabel="질문 다시 시도"
          onPress={() => { void daily.refetch(); void feed.refetch(); }}
        />
      </View>
    );
  }
  if (!question) {
    if (feed.isFetchingNextPage) return <ActivityIndicator accessibilityLabel="다음 질문 불러오는 중" />;
    return (
      <View style={styles.recovery}>
        <Text>새 질문을 모두 봤어요.</Text>
        <RetryButton accessibilityLabel="질문 목록 새로고침" onPress={() => {
          reset(); void daily.refetch(); void feed.refetch();
        }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <QuestionCard
        disabled={!canMutate || submitting}
        onSkip={() => void skip()}
        onVote={vote}
        question={question}
      />
      {actionError ? <Text accessibilityRole="alert">{actionError}</Text> : null}
      {failedVoteChoice ? (
        <RetryButton accessibilityLabel="투표 다시 시도" disabled={!canMutate} onPress={() => vote(failedVoteChoice)} />
      ) : null}
      {failedReasonReaction ? (
        <View style={styles.reactionRecovery}>
          <Text accessibilityRole="alert">선택 이유를 저장하지 못했어요.</Text>
          <RetryButton accessibilityLabel="선택 이유 다시 시도" disabled={!canMutate} onPress={retryReasonReaction} />
        </View>
      ) : null}
      {result ? (
        <View style={styles.feedback}>
          <ResultOverlay result={result} />
          <View style={styles.reasons}>
            <ReasonChips
              disabled={!canMutate}
              key={question.id}
              onReact={reactReason}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  recovery: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center' },
  reactionRecovery: { alignItems: 'center', bottom: 16, gap: 8, left: 16, position: 'absolute', right: 16 },
  feedback: { gap: 8, left: 16, position: 'absolute', right: 16, top: '36%' },
  reasons: { alignSelf: 'stretch' },
});
