import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import { RetryButton } from '@/src/components/RetryButton';
import type { OnlineIdentity } from '@/src/features/notifications/notifications';
import { isAnalyticsUuid, type AnalyticsEventInput } from '@/src/features/analytics/analytics';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { QuestionVisibility } from '@/src/features/play/domain/question';
import {
  areCreateQuestionOptionsDifferent,
  normalizeCreateQuestion,
} from '../domain/createQuestion';

interface AskScreenProps {
  canMutate?: boolean;
  source?: OnlineIdentity['source'];
  trackEvent?: (event: AnalyticsEventInput) => Promise<void>;
  registerNotifications?: (options: {
    identity: OnlineIdentity;
    shouldContinue(): boolean;
  }) => Promise<unknown>;
  repository: QuestionRepository;
  userId: string;
}

const SUCCESS_MESSAGE =
  '질문이 등록되었어요. 실제 사용자에게 테스트 노출을 시작합니다.';

export function AskScreen({
  canMutate = true,
  registerNotifications,
  repository,
  source = 'anonymous',
  trackEvent,
  userId,
}: AskScreenProps) {
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('일상');
  const [closesAt, setClosesAt] = useState('');
  const [visibility, setVisibility] = useState<QuestionVisibility>('public');
  const [showOptional, setShowOptional] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const canMutateRef = useRef(canMutate);
  const identityRef = useRef({ source, userId });

  useEffect(() => {
    canMutateRef.current = canMutate;
    identityRef.current = { source, userId };
  }, [canMutate, source, userId]);

  useEffect(() => {
    mounted.current = true;
    const activeGeneration = ++generation.current;
    submissionLock.current = false;
    setSubmitting(false);
    setError(null);
    setMessage(null);
    return () => {
      mounted.current = false;
      if (generation.current === activeGeneration) generation.current += 1;
      submissionLock.current = false;
    };
  }, [repository, userId]);

  const canSubmit = Boolean(
    optionA.trim() &&
      optionB.trim() &&
      areCreateQuestionOptionsDifferent(optionA, optionB),
  );

  const submit = async () => {
    if (!canMutate || !canSubmit || submissionLock.current) return;
    setError(null);
    setMessage(null);

    let input;
    try {
      input = normalizeCreateQuestion({
        optionA,
        optionB,
        description,
        category,
        visibility,
        closesAt: closesAt.trim() || null,
      });
    } catch {
      setError('입력한 내용을 확인해 주세요.');
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    const requestGeneration = generation.current;
    if (trackEvent && source !== 'offline' && isAnalyticsUuid(userId)) {
      void trackEvent({ name: 'question_create_started', userId, source: 'ask' }).catch(() => undefined);
    }
    try {
      const created = await repository.create({ ...input, authorId: userId });
      if (!mounted.current || generation.current !== requestGeneration) return;
      if (trackEvent && source !== 'offline' && isAnalyticsUuid(userId)) {
        void trackEvent({ name: 'question_created', userId, questionId: created.id, source: 'ask' }).catch(() => undefined);
      }
      setOptionA('');
      setOptionB('');
      setDescription('');
      setCategory('일상');
      setClosesAt('');
      setVisibility('public');
      setShowOptional(false);
      setMessage(SUCCESS_MESSAGE);
      if (registerNotifications && canMutateRef.current && source !== 'offline') {
        const expected = identityRef.current;
        void registerNotifications({
          identity: expected,
          shouldContinue: () => mounted.current && canMutateRef.current
            && generation.current === requestGeneration
            && identityRef.current.userId === expected.userId
            && identityRef.current.source === expected.source,
        }).catch(() => undefined);
      }
    } catch {
      if (!mounted.current || generation.current !== requestGeneration) return;
      setError('질문을 등록하지 못했어요. 다시 시도해 주세요.');
    } finally {
      if (!mounted.current || generation.current !== requestGeneration) return;
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>질문 만들기</Text>
      <Text style={styles.title}>둘 중 하나를{`\n`}고르게 해 보세요.</Text>

      <View style={styles.options}>
        <View style={[styles.optionCard, styles.optionA]}>
          <Text style={styles.optionLabel}>A</Text>
          <TextInput
            accessibilityLabel="선택지 A"
            maxLength={40}
            onChangeText={setOptionA}
            placeholder="선택지 A"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={optionA}
          />
        </View>
        <View style={[styles.optionCard, styles.optionB]}>
          <Text style={styles.optionLabel}>B</Text>
          <TextInput
            accessibilityLabel="선택지 B"
            maxLength={40}
            onChangeText={setOptionB}
            placeholder="선택지 B"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={optionB}
          />
        </View>
      </View>

      <Pressable
        accessibilityLabel={showOptional ? '추가 설정 닫기' : '추가 설정'}
        accessibilityRole="button"
        accessibilityState={{ expanded: showOptional }}
        onPress={() => setShowOptional((current) => !current)}
        style={styles.optionalToggle}
      >
        <Text style={styles.optionalToggleText}>
          {showOptional ? '추가 설정 닫기' : '추가 설정'}
        </Text>
      </Pressable>

      {showOptional ? (
        <View style={styles.optionalPanel}>
          <Text style={styles.fieldLabel}>설명</Text>
          <TextInput
            accessibilityLabel="질문 설명"
            maxLength={120}
            multiline
            onChangeText={setDescription}
            placeholder="선택을 돕는 설명을 덧붙여 보세요."
            placeholderTextColor={colors.muted}
            style={[styles.secondaryInput, styles.description]}
            value={description}
          />

          <Text style={styles.fieldLabel}>카테고리</Text>
          <TextInput
            accessibilityLabel="카테고리"
            onChangeText={setCategory}
            placeholder="일상"
            placeholderTextColor={colors.muted}
            style={styles.secondaryInput}
            value={category}
          />

          <Text style={styles.fieldLabel}>마감 시간</Text>
          <TextInput
            accessibilityLabel="마감 시간"
            autoCapitalize="none"
            onChangeText={setClosesAt}
            placeholder="2026-07-31T15:00:00.000Z"
            placeholderTextColor={colors.muted}
            style={styles.secondaryInput}
            value={closesAt}
          />

          <Text style={styles.fieldLabel}>공개 방식</Text>
          <View
            accessibilityLabel="공개 방식"
            accessibilityRole="radiogroup"
            style={styles.visibilityRow}
          >
            <VisibilityButton
              label="전체 공개"
              onPress={() => setVisibility('public')}
              selected={visibility === 'public'}
            />
            <VisibilityButton
              label="링크로만 공개"
              onPress={() => setVisibility('link')}
              selected={visibility === 'link'}
            />
          </View>
        </View>
      ) : null}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {error ? (
        <RetryButton
          accessibilityLabel="질문 등록 다시 시도"
          disabled={!canMutate || !canSubmit || submitting}
          onPress={() => void submit()}
        />
      ) : null}
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.success}>
          {message}
        </Text>
      ) : null}

      <Pressable
        accessibilityLabel="질문 등록"
        accessibilityRole="button"
        disabled={!canMutate || !canSubmit || submitting}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.submit,
          (!canMutate || !canSubmit || submitting) && styles.submitDisabled,
          pressed && canMutate && canSubmit && !submitting && styles.submitPressed,
        ]}
      >
        <Text style={styles.submitText}>{submitting ? '등록 중…' : '질문 등록'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function VisibilityButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.visibilityButton, selected && styles.visibilityButtonSelected]}
    >
      <Text style={[styles.visibilityText, selected && styles.visibilityTextSelected]}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', lineHeight: 39 },
  options: { gap: spacing.md },
  optionCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 5,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  optionA: { borderLeftColor: colors.optionA },
  optionB: { borderLeftColor: colors.optionB },
  optionLabel: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  input: { color: colors.text, fontSize: 20, fontWeight: '700', minHeight: 44, paddingVertical: spacing.sm },
  optionalToggle: { alignItems: 'center', alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, minWidth: 44, paddingHorizontal: spacing.sm },
  optionalToggleText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  optionalPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    gap: spacing.sm,
    padding: spacing.md,
  },
  fieldLabel: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: spacing.xs },
  secondaryInput: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    padding: spacing.md,
  },
  description: { minHeight: 80, textAlignVertical: 'top' },
  visibilityRow: { flexDirection: 'row', gap: spacing.sm },
  visibilityButton: {
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  visibilityButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  visibilityText: { color: colors.text, fontWeight: '700' },
  visibilityTextSelected: { color: colors.surface },
  error: { color: '#B42318' },
  success: { color: '#067647', lineHeight: 21 },
  submit: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    marginTop: 'auto',
    minHeight: 44,
    padding: spacing.md,
  },
  submitDisabled: { opacity: 0.35 },
  submitPressed: { opacity: 0.8 },
  submitText: { color: colors.surface, fontSize: 17, fontWeight: '800' },
});
