import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { QUESTION_CATEGORIES } from '../domain/questionCategories';
import {
  DEADLINE_PRESETS,
  deadlineToIso,
  type DeadlinePresetId,
} from '../domain/deadlinePresets';
import { CategoryChipGroup } from './CategoryChipGroup';
import { SettingRow } from './SettingRow';

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
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePresetId>('none');
  const [visibility, setVisibility] = useState<QuestionVisibility>('public');
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
        closesAt: deadlineToIso(deadlinePreset),
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
      setDeadlinePreset('none');
      setVisibility('public');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.frame}
    >
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
      >
      <Text accessibilityRole="header" style={styles.title}>밸런스 작성</Text>
      <Text style={styles.subtitle}>헷갈리는 선택을 세상에 물어보세요.</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>밸런스 질문 만들기</Text>
        <View style={styles.options}>
        <View style={[styles.optionCard, styles.optionA]}>
          <Text style={[styles.optionLabel, styles.optionALabel]}>선택 A</Text>
          <TextInput
            accessibilityLabel="선택지 A"
            editable={canMutate && !submitting}
            maxLength={40}
            onChangeText={setOptionA}
            placeholder="선택지 A"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={optionA}
          />
        </View>
        <View style={[styles.optionCard, styles.optionB]}>
          <Text style={[styles.optionLabel, styles.optionBLabel]}>선택 B</Text>
          <TextInput
            accessibilityLabel="선택지 B"
            editable={canMutate && !submitting}
            maxLength={40}
            onChangeText={setOptionB}
            placeholder="선택지 B"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={optionB}
          />
        </View>
      </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>카테고리 선택</Text>
        <CategoryChipGroup
          disabled={!canMutate || submitting}
          onChange={setCategory}
          options={QUESTION_CATEGORIES}
          value={category}
        />
      </View>

      <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>추가 설명 <Text style={styles.optional}>(선택)</Text></Text>
          <TextInput
            accessibilityLabel="질문 설명"
            editable={canMutate && !submitting}
            maxLength={120}
            multiline
            onChangeText={setDescription}
            placeholder="선택을 돕는 설명을 덧붙여 보세요."
            placeholderTextColor={colors.muted}
            style={[styles.secondaryInput, styles.description]}
            value={description}
          />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>공개 및 마감</Text>
        <SettingRow
          disabled={!canMutate || submitting}
          label="공개 방식"
          value={visibility === 'public' ? '전체 공개' : '링크로만 공개'}
          control={(
          <View
            accessibilityLabel="공개 방식"
            accessibilityRole="radiogroup"
            style={styles.visibilityRow}
          >
            <VisibilityButton
              disabled={!canMutate || submitting}
              label="전체 공개"
              onPress={() => setVisibility('public')}
              selected={visibility === 'public'}
            />
            <VisibilityButton
              disabled={!canMutate || submitting}
              label="링크로만 공개"
              onPress={() => setVisibility('link')}
              selected={visibility === 'link'}
            />
          </View>
          )}
        />
        <SettingRow
          disabled={!canMutate || submitting}
          label="마감 시간"
          value={DEADLINE_PRESETS.find(({ id }) => id === deadlinePreset)?.label ?? '마감 없음'}
          control={(
            <View accessibilityLabel="마감 기간" accessibilityRole="radiogroup" style={styles.deadlineRow}>
              {DEADLINE_PRESETS.map((preset) => (
                <DeadlineButton
                  disabled={!canMutate || submitting}
                  key={preset.id}
                  label={preset.label}
                  onPress={() => setDeadlinePreset(preset.id)}
                  selected={deadlinePreset === preset.id}
                />
              ))}
            </View>
          )}
        />
      </View>

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
        accessibilityLabel="게시하기"
        accessibilityRole="button"
        disabled={!canMutate || !canSubmit || submitting}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.submit,
          (!canMutate || !canSubmit || submitting) && styles.submitDisabled,
          pressed && canMutate && canSubmit && !submitting && styles.submitPressed,
        ]}
      >
        <Text style={styles.submitText}>{submitting ? '게시 중…' : '게시하기'}</Text>
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function VisibilityButton({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.visibilityButton, selected && styles.visibilityButtonSelected, disabled && styles.controlDisabled]}
    >
      <Text style={[styles.visibilityText, selected && styles.visibilityTextSelected]}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

function DeadlineButton({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.deadlineButton, selected && styles.deadlineButtonSelected, disabled && styles.controlDisabled]}
    >
      <Text style={[styles.deadlineText, selected && styles.deadlineTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.background, flex: 1 },
  screen: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', lineHeight: 39 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  optional: { color: colors.muted, fontSize: 14, fontWeight: '500' },
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
  optionALabel: { color: colors.optionA },
  optionBLabel: { color: colors.optionB },
  input: { color: colors.text, fontSize: 20, fontWeight: '700', minHeight: 44, paddingVertical: spacing.sm },
  secondaryInput: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    padding: spacing.md,
  },
  description: { minHeight: 80, textAlignVertical: 'top' },
  visibilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
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
  controlDisabled: { opacity: 0.45 },
  deadlineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'flex-end' },
  deadlineButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.button, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  deadlineButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  deadlineText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  deadlineTextSelected: { color: colors.surface },
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
