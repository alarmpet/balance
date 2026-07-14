import { randomUUID } from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useQuestionRepository, useSession } from '@/src/providers/AppProviders';
import { colors, radius, spacing } from '@/src/design/tokens';
import type { Question, VoteChoice, VoteReceipt } from '@/src/features/play/domain/question';
import { ClosedQuestionError, isRetryableTransportError } from '@/src/features/play/data/QuestionRepository';
import { isQuestionId } from '@/src/features/play/domain/questionId';
import { track } from '@/src/features/analytics/analytics';

function routeId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function isShareQuestionAvailable(question: Question | null, now = Date.now()): question is Question {
  if (!question || question.stage === 'hidden' || question.stage === 'limited') return false;
  return question.closesAt === null || new Date(question.closesAt).getTime() > now;
}

export default function ShareRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const questionId = routeId(id);
  const repository = useQuestionRepository();
  const { canMutate, continuityConflict, pendingActionQueue, userId } = useSession();
  const [question, setQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null);
  const [reload, setReload] = useState(0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [pendingVote, setPendingVote] = useState<{ id: string; choice: VoteChoice } | null>(null);
  const [ownershipConflict, setOwnershipConflict] = useState<string | null>(null);
  const [recoveredActionId, setRecoveredActionId] = useState<string | null>(null);
  const voteLocked = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    const activeGeneration = ++generation.current;
    setStatus('loading');
    setQuestion(null);
    setReceipt(null);
    setPendingVote(null);
    setOwnershipConflict(null);
    setRecoveredActionId(null);
    voteLocked.current = false;
    if (!isQuestionId(questionId)) {
      setStatus('missing');
      return () => {
        active = false;
        if (generation.current === activeGeneration) generation.current += 1;
      };
    }
    const unsubscribe = pendingActionQueue.subscribe(() => {
      if (active) setReload((value) => value + 1);
    });
    void Promise.all([
      repository.getById(questionId),
      pendingActionQueue.list(),
      userId ? pendingActionQueue.peekVoteOutcome(questionId, userId) : Promise.resolve(null),
    ]).then(
      ([loaded, actions, completed]) => {
        if (!active) return;
        if (!isShareQuestionAvailable(loaded)) {
          setStatus('missing');
          return;
        }
        setQuestion(loaded);
        const questionVotes = actions.filter((action) => action.type === 'vote' && action.questionId === questionId);
        const saved = questionVotes.find((action) => action.ownerId === userId);
        const quarantined = questionVotes.find((action) => action.ownerId !== userId);
        if (saved?.type === 'vote') setPendingVote({ id: saved.id, choice: saved.choice });
        if (quarantined) {
          setOwnershipConflict(quarantined.ownerId
            ? '다른 사용자의 대기 투표가 있어 격리했어요.'
            : '소유자를 확인할 수 없는 대기 투표가 있어 격리했어요.');
        }
        if (completed) {
          setPendingVote(null);
          setReceipt(completed.receipt);
          setRecoveredActionId(completed.actionId);
        }
        setStatus('ready');
      },
      () => {
        if (active) setStatus('error');
      },
    );
    return () => {
      active = false;
      unsubscribe();
      if (generation.current === activeGeneration) generation.current += 1;
    };
  }, [pendingActionQueue, questionId, reload, repository, userId]);

  useEffect(() => {
    if (!receipt || !recoveredActionId) return;
    void pendingActionQueue.acknowledgeVoteOutcome(recoveredActionId);
  }, [pendingActionQueue, receipt, recoveredActionId]);

  const vote = (choice: VoteChoice, savedAction = pendingVote) => {
    if (!canMutate || !question || !userId || voteLocked.current) return;
    voteLocked.current = true;
    const requestGeneration = generation.current;
    setVoting(true);
    setVoteError(null);
    const action = savedAction ?? { id: randomUUID(), choice };
    void (async () => {
      try {
        if (!savedAction) {
          await pendingActionQueue.enqueue({
            id: action.id,
            type: 'vote',
            questionId: question.id,
            choice: action.choice,
            ownerId: userId,
            ...(userId.startsWith('guest_') ? { localGuestId: userId } : {}),
          });
          setPendingVote(action);
        }
        const result = await repository.vote({
          questionId: question.id,
          userId,
          choice: action.choice,
          actionId: action.id,
        });
        void track({ name: 'shared_question_voted', userId, questionId: question.id, source: 'share' }).catch(() => undefined);
        await pendingActionQueue.completeVote(action.id, result);
        const completed = await pendingActionQueue.peekVoteOutcome(question.id, userId);
        if (generation.current === requestGeneration) {
          setPendingVote(null);
          setReceipt(completed?.receipt ?? result);
          setRecoveredActionId(completed?.actionId ?? null);
        }
      } catch (error) {
        if (generation.current === requestGeneration) {
          if (isRetryableTransportError(error)) {
            setPendingVote(action);
            setVoteError('투표를 저장했어요. 연결되면 같은 투표로 다시 시도할 수 있어요.');
          } else {
            await pendingActionQueue.remove(action.id);
            setPendingVote(null);
            setVoteError(error instanceof ClosedQuestionError
              ? '이미 마감된 질문이에요.'
              : '투표를 처리할 수 없어요. 질문 상태를 확인해 주세요.');
          }
          voteLocked.current = false;
        }
      } finally {
        if (generation.current === requestGeneration) setVoting(false);
      }
    })();
  };

  if (status === 'loading') return <ActivityIndicator accessibilityLabel="공유 질문 불러오는 중" />;
  if (status === 'missing' || status === 'error') {
    return (
      <View style={styles.messageContainer}>
        <Text accessibilityRole="alert" style={styles.message}>
          {status === 'missing' ? '질문을 찾을 수 없어요.' : '질문을 불러오지 못했어요.'}
        </Text>
        <Pressable
          accessibilityLabel="공유 질문 다시 시도"
          accessibilityRole="button"
          onPress={() => setReload((value) => value + 1)}
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }
  if (!question) return null;

  return (
    <View style={styles.screen}>
      <Text style={styles.category}>{question.category}</Text>
      {question.description ? <Text style={styles.description}>{question.description}</Text> : null}
      <Pressable
        accessibilityLabel={`A 선택: ${question.optionA}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canMutate || voting || receipt !== null || pendingVote !== null || Boolean(continuityConflict) || Boolean(ownershipConflict), selected: pendingVote?.choice === 'A' }}
        disabled={!canMutate || voting || receipt !== null || pendingVote !== null || Boolean(continuityConflict) || Boolean(ownershipConflict)}
        onPress={() => vote('A')}
        style={[styles.choice, styles.optionA]}
      >
        <Text style={styles.choiceText}>{question.optionA}{pendingVote?.choice === 'A' ? ' · 선택됨' : ''}</Text>
      </Pressable>
      <Text style={styles.vs}>VS</Text>
      <Pressable
        accessibilityLabel={`B 선택: ${question.optionB}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canMutate || voting || receipt !== null || pendingVote !== null || Boolean(continuityConflict) || Boolean(ownershipConflict), selected: pendingVote?.choice === 'B' }}
        disabled={!canMutate || voting || receipt !== null || pendingVote !== null || Boolean(continuityConflict) || Boolean(ownershipConflict)}
        onPress={() => vote('B')}
        style={[styles.choice, styles.optionB]}
      >
        <Text style={styles.choiceText}>{question.optionB}{pendingVote?.choice === 'B' ? ' · 선택됨' : ''}</Text>
      </Pressable>
      {voting ? <ActivityIndicator accessibilityLabel="투표 처리 중" /> : null}
      {voteError ? <Text accessibilityRole="alert" style={styles.error}>{voteError}</Text> : null}
      {continuityConflict ? <Text accessibilityRole="alert" style={styles.error}>{continuityConflict}</Text> : null}
      {ownershipConflict ? <Text accessibilityRole="alert" style={styles.error}>{ownershipConflict}</Text> : null}
      {pendingVote && !receipt ? (
        <Pressable
          accessibilityLabel="저장한 투표 다시 시도"
          accessibilityRole="button"
          disabled={!canMutate || voting}
          onPress={() => vote(pendingVote.choice, pendingVote)}
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>저장한 투표 다시 시도</Text>
        </Pressable>
      ) : null}
      {receipt ? (
        <View accessibilityRole="summary" style={styles.result}>
          <Text style={styles.resultText}>{receipt.percentA}% vs {receipt.percentB}%</Text>
          <Text style={styles.resultLabel}>{receipt.label}</Text>
          <Pressable
            accessibilityLabel="다른 밸런스도 보기"
            accessibilityRole="button"
            onPress={() => router.replace('/')}
            style={styles.moreButton}
          >
            <Text style={styles.moreText}>다른 밸런스도 보기</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, gap: spacing.md, justifyContent: 'center', padding: spacing.lg },
  category: { color: colors.muted, textAlign: 'center' },
  description: { color: colors.text, textAlign: 'center' },
  choice: { alignItems: 'center', borderRadius: radius.card, justifyContent: 'center', minHeight: 160, padding: spacing.lg },
  optionA: { backgroundColor: colors.optionA },
  optionB: { backgroundColor: colors.optionB },
  choiceText: { color: colors.surface, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  vs: { color: colors.muted, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.text, padding: spacing.lg, textAlign: 'center' },
  messageContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  error: { color: colors.warning, textAlign: 'center' },
  result: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, gap: spacing.sm, padding: spacing.lg },
  resultText: { color: colors.text, fontSize: 24, fontWeight: '700' },
  resultLabel: { color: colors.primary, fontSize: 18 },
  moreButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.button, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg },
  moreText: { color: colors.surface, fontWeight: '700' },
});
