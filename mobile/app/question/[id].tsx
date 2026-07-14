import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useQuestionRepository, useSession } from '@/src/providers/AppProviders';
import { colors, radius, spacing } from '@/src/design/tokens';
import type { Question } from '@/src/features/play/domain/question';
import type { ClosedQuestionResult } from '@/src/features/play/data/QuestionRepository';
import { isQuestionId } from '@/src/features/play/domain/questionId';
import { ReasonChips } from '@/src/features/moderation/ui/ReasonChips';
import { track } from '@/src/features/analytics/analytics';

export const createQuestionShareUrl = (questionId: string) =>
  Linking.createURL(`/share/${encodeURIComponent(questionId)}`);

function returnToPreviousOrFeed() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function isQuestionDetailAvailable(question: Question | null, now = Date.now()): question is Question {
  if (!question || question.stage === 'hidden' || question.stage === 'limited') return false;
  return question.closesAt === null || new Date(question.closesAt).getTime() > now;
}

export default function QuestionDetailRoute() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const repository = useQuestionRepository();
  const { canMutate, userId } = useSession();
  const [question, setQuestion] = useState<Question | null>(null);
  const [closedResult, setClosedResult] = useState<ClosedQuestionResult | null>(null);
  const [missing, setMissing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [reasonEligible, setReasonEligible] = useState(false);
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setQuestion(null);
    setClosedResult(null);
    setMissing(false);
    setNetworkError(false);
    setReasonEligible(false);
    setNotice(null);
    if (!isQuestionId(id)) {
      setMissing(true);
      return () => { active = false; };
    }
    void (async () => {
      try {
        const value = await repository.getById(id);
        if (!active) return;
        setNetworkError(false);
        if (userId) {
          void Promise.resolve(repository.getVoteEvidence(userId)).then(
            (evidence) => { if (active) setReasonEligible(Array.isArray(evidence) && evidence.some((item) => item.questionId === id)); },
            () => { if (active) setReasonEligible(false); },
          );
        }
        if (isQuestionDetailAvailable(value)) {
          setQuestion(value); setMissing(false); return;
        }
        const result = await repository.getClosedResult?.(id) ?? null;
        if (!active) return;
        setClosedResult(result); setQuestion(result?.question ?? null); setMissing(!result);
      } catch { if (active) { setMissing(false); setNetworkError(true); } }
    })();
    return () => { active = false; };
  }, [id, reload, repository, userId]);

  if (networkError) return (
    <View style={styles.messageContainer}>
      <Text accessibilityRole="alert" style={styles.message}>질문을 불러오지 못했어요.</Text>
      <Action label="질문 다시 시도" onPress={() => setReload((value) => value + 1)} />
      <Action label="피드로 돌아가기" onPress={returnToPreviousOrFeed} subtle />
    </View>
  );

  if (missing) return (
    <View style={styles.messageContainer}>
      <Text style={styles.message}>질문을 찾을 수 없어요.</Text>
      <Action label="피드로 돌아가기" onPress={returnToPreviousOrFeed} subtle />
    </View>
  );
  if (!question || !userId) return <Text style={styles.message}>질문을 불러오는 중이에요.</Text>;

  const report = () => {
    if (!canMutate) return;
    void repository.report({ questionId: question.id, reporterId: userId, reason: '부적절한 질문' })
      .then(() => {
        setNotice('신고를 접수했어요.');
        void track({ name: 'report_submitted', userId, questionId: question.id, source: 'play' }).catch(() => undefined);
      }, () => setNotice('신고하지 못했어요. 다시 시도해 주세요.'));
  };
  const block = () => {
    if (!canMutate) return;
    if (!repository.blockQuestionAuthor) {
      setNotice('차단 기능을 사용할 수 없어요.');
      return;
    }
    void repository.blockQuestionAuthor({ questionId: question.id, blockerId: userId })
      .then(() => setNotice('이 작성자의 질문을 숨겼어요.'), () => setNotice('차단하지 못했어요. 다시 시도해 주세요.'));
  };
  const share = () => {
    void Share.share({ message: createQuestionShareUrl(question.id) })
      .then((result) => {
        if (result.action === Share.sharedAction) {
          void track({ name: 'question_shared', userId, questionId: question.id, source: 'share' }).catch(() => undefined);
        }
      })
      .catch(() => setNotice('공유하지 못했어요. 다시 시도해 주세요.'));
  };

  return (
    <ScrollView accessibilityLabel="밸런스 상세" contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <Action label="뒤로 가기" onPress={returnToPreviousOrFeed} subtle />
        <Text accessibilityRole="header" style={styles.screenTitle}>밸런스 상세</Text>
        <Action label="공유하기" onPress={share} subtle />
      </View>
      <Text style={styles.category}>{question.category}</Text>
      <View style={styles.questionCard}>
        <Text accessibilityRole="header" style={styles.questionTitle}>
          {question.optionA} vs {question.optionB}
        </Text>
        <View style={[styles.optionCard, styles.optionA]}>
          <Text style={styles.optionCode}>A</Text>
          <Text style={styles.option}>{question.optionA}</Text>
        </View>
        <View style={[styles.optionCard, styles.optionB]}>
          <Text style={styles.optionCode}>B</Text>
          <Text style={styles.option}>{question.optionB}</Text>
        </View>
        {question.description ? <Text style={styles.description}>{question.description}</Text> : null}
      </View>
      {closedResult ? (
        <View accessibilityRole="summary" style={styles.result}>
          <Text style={styles.resultText}>{closedResult.percentA}% vs {closedResult.percentB}%</Text>
          <Text style={styles.resultLabel}>{closedResult.label}</Text>
        </View>
      ) : null}
      <View accessibilityLabel="한 줄 인사이트" style={styles.insight}>
        <Text style={styles.insightLabel}>한 줄 인사이트</Text>
        <Text style={styles.insightText}>이 질문은 {question.category}에 관한 선택이에요.</Text>
      </View>
      <View accessibilityLabel="근거 태그" style={styles.tags}>
        <Text style={styles.tag}>#{question.category}</Text>
        {Object.keys({ ...question.weightsA, ...question.weightsB }).map((axis) => (
          <Text key={axis} style={styles.tag}>#{axis}</Text>
        ))}
      </View>
      {reasonEligible ? <ReasonChips
        disabled={!canMutate}
        onReact={(reason) => {
          if (!canMutate || !repository.reactReason) return;
          void repository.reactReason({ questionId: question.id, userId, reason })
            .catch(() => setNotice('반응을 저장하지 못했어요. 다시 시도해 주세요.'));
        }}
      /> : null}
      <Text style={styles.safetyTitle}>안전 도구</Text>
      <View style={styles.actions}>
        <Action disabled={!canMutate} label="신고하기" onPress={report} />
        <Action
          disabled={!canMutate || !repository.blockQuestionAuthor}
          label={repository.blockQuestionAuthor ? '작성자 차단하기' : '로컬 모드에서는 차단 불가'}
          onPress={block}
        />
      </View>
      {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
    </ScrollView>
  );
}

function Action({ disabled = false, label, onPress, subtle = false }: { disabled?: boolean; label: string; onPress(): void; subtle?: boolean }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, subtle && styles.subtleAction]}>
      <Text style={[styles.actionText, subtle && styles.subtleActionText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flexGrow: 1, gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  messageContainer: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center' },
  message: { color: colors.text, padding: spacing.lg, textAlign: 'center' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  screenTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  category: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.button, color: colors.primary, fontWeight: '700', overflow: 'hidden', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  questionCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  questionTitle: { color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 33, textAlign: 'center' },
  optionCard: { borderRadius: radius.button, gap: spacing.xs, minHeight: 96, padding: spacing.md },
  optionA: { backgroundColor: colors.optionASoft },
  optionB: { backgroundColor: colors.optionBSoft },
  optionCode: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  option: { color: colors.text, fontSize: 20, fontWeight: '700' },
  description: { color: colors.muted, lineHeight: 22, textAlign: 'center' },
  insight: { backgroundColor: colors.insightSoft, borderRadius: radius.button, gap: spacing.xs, padding: spacing.md },
  insightLabel: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  insightText: { color: colors.text, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { color: colors.primary },
  safetyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.button, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.md },
  actionText: { color: colors.text },
  subtleAction: { borderColor: 'transparent', minWidth: 44, paddingHorizontal: spacing.sm },
  subtleActionText: { color: colors.primary, fontWeight: '700' },
  notice: { color: colors.muted },
  result: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, gap: spacing.sm, padding: spacing.lg },
  resultText: { color: colors.text, fontSize: 24, fontWeight: '700' },
  resultLabel: { color: colors.primary, fontSize: 18, fontWeight: '700' },
});
