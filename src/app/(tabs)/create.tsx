import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AIRefineResult, CategorySlug } from '../../types/database.types';
import type {
  DuplicateDecision,
  QuestionDraftInput,
} from '../../services/aiService';
import {
  runAIQuestionPipeline,
  submitRefinedQuestion,
} from '../../services/aiService';
import { supabase } from '../../services/questionService';

const categories: Array<{ slug: CategorySlug; label: string; description: string }> = [
  { slug: 'food', label: '푸드', description: '맛과 식습관' },
  { slug: 'life', label: '라이프', description: '일상과 루틴' },
  { slug: 'romance', label: '연애', description: '관계와 마음' },
  { slug: 'career', label: '커리어', description: '일과 성장' },
  { slug: 'culture', label: '문화', description: '취향과 콘텐츠' },
];

const formatSimilarity = (value: number) => `${Math.round(value * 100)}%`;

export default function CreateQuestionScreen() {
  const [title, setTitle] = useState('');
  const [optionAText, setOptionAText] = useState('');
  const [optionBText, setOptionBText] = useState('');
  const [categorySlug, setCategorySlug] = useState<CategorySlug>('life');
  const [refined, setRefined] = useState<AIRefineResult | null>(null);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [duplicateDecision, setDuplicateDecision] = useState<DuplicateDecision | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowWarningSubmit, setAllowWarningSubmit] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const authUser = supabase ? await supabase.auth.getUser() : null;
      if (isMounted) {
        setUserId(authUser?.data.user?.id ?? null);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const draft = useMemo<QuestionDraftInput>(
    () => ({
      title,
      optionAText,
      optionBText,
      categorySlug,
    }),
    [categorySlug, optionAText, optionBText, title],
  );

  const canRefine = title.trim().length >= 4 && optionAText.trim().length >= 2 && optionBText.trim().length >= 2;
  const isBlocked = duplicateDecision?.status === 'blocked';
  const canSubmit = Boolean(refined && embedding && !isBlocked && !isRefining && !isSubmitting);

  const resetAIResult = useCallback(() => {
    setRefined(null);
    setEmbedding(null);
    setDuplicateDecision(null);
    setAllowWarningSubmit(false);
  }, []);

  const handleRefine = useCallback(async () => {
    if (!canRefine) {
      Alert.alert('입력이 조금 부족해요', '제목과 A/B 선택지를 먼저 간단히 적어 주세요.');
      return;
    }

    setIsRefining(true);
    setAllowWarningSubmit(false);

    try {
      const result = await runAIQuestionPipeline(draft);
      setRefined(result.refined);
      setEmbedding(result.embedding);
      setDuplicateDecision(result.duplicateDecision);

      if (result.duplicateDecision.status === 'blocked') {
        Alert.alert(
          '이미 존재하는 유사 질문입니다',
          `가장 높은 유사도: ${formatSimilarity(result.duplicateDecision.highestSimilarity)}\n새로운 관점으로 다시 작성해 주세요.`,
        );
        return;
      }

      if (result.duplicateDecision.status === 'warning') {
        Alert.alert(
          '비슷한 질문이 있어요',
          `가장 높은 유사도: ${formatSimilarity(result.duplicateDecision.highestSimilarity)}\n그래도 이 질문을 등록할까요?`,
          [
            { text: '다시 쓸게요', style: 'cancel', onPress: () => setAllowWarningSubmit(false) },
            { text: '계속 등록', onPress: () => setAllowWarningSubmit(true) },
          ],
        );
      }
    } catch (error) {
      Alert.alert('AI 다듬기에 실패했어요', error instanceof Error ? error.message : String(error));
    } finally {
      setIsRefining(false);
    }
  }, [canRefine, draft]);

  const handleSubmit = useCallback(async () => {
    if (!refined || !embedding) {
      Alert.alert('AI 다듬기가 필요해요', '등록 전에 AI로 문장을 정리하고 중복 검사를 완료해 주세요.');
      return;
    }

    if (duplicateDecision?.status === 'blocked') {
      Alert.alert('이미 존재하는 유사 질문입니다', '유사도 88% 이상인 질문은 등록할 수 없어요.');
      return;
    }

    if (duplicateDecision?.status === 'warning' && !allowWarningSubmit) {
      Alert.alert(
        '비슷한 질문이 있어요',
        '유사도 78% 이상인 질문입니다. 그래도 등록하려면 확인해 주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '그래도 등록', onPress: () => setAllowWarningSubmit(true) },
        ],
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitRefinedQuestion({
        userId,
        refined,
        embedding,
      });

      Alert.alert('질문이 등록됐어요', '검수 후 밸런스 섬 피드에 나타납니다.');
      setTitle('');
      setOptionAText('');
      setOptionBText('');
      setCategorySlug('life');
      resetAIResult();
    } catch (error) {
      Alert.alert('등록에 실패했어요', error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [allowWarningSubmit, duplicateDecision?.status, embedding, refined, resetAIResult, userId]);

  const applyRefinedToInputs = useCallback(() => {
    if (!refined) {
      return;
    }

    setTitle(refined.title);
    setOptionAText(refined.option_a_title);
    setOptionBText(refined.option_b_title);
    setCategorySlug(refined.category_slug);
  }, [refined]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CREATE</Text>
              <Text style={styles.title}>밸런스 질문 만들기</Text>
            </View>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={17} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>카테고리</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const isSelected = category.slug === categorySlug;
                return (
                  <Pressable
                    key={category.slug}
                    onPress={() => {
                      setCategorySlug(category.slug);
                      resetAIResult();
                    }}
                    style={({ pressed }) => [
                      styles.categoryButton,
                      isSelected && styles.categoryButtonSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                      {category.label}
                    </Text>
                    <Text style={[styles.categoryDescription, isSelected && styles.categoryDescriptionSelected]}>
                      {category.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>질문 초안</Text>
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                resetAIResult();
              }}
              placeholder="예: 주말에 하루를 보낸다면?"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              maxLength={80}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInputBox}>
              <Text style={styles.optionLabel}>선택지 A</Text>
              <TextInput
                value={optionAText}
                onChangeText={(value) => {
                  setOptionAText(value);
                  resetAIResult();
                }}
                placeholder="집에서 쉬기"
                placeholderTextColor="#94A3B8"
                style={styles.optionInput}
                multiline
                maxLength={90}
              />
            </View>

            <View style={styles.optionInputBox}>
              <Text style={styles.optionLabel}>선택지 B</Text>
              <TextInput
                value={optionBText}
                onChangeText={(value) => {
                  setOptionBText(value);
                  resetAIResult();
                }}
                placeholder="밖에서 놀기"
                placeholderTextColor="#94A3B8"
                style={styles.optionInput}
                multiline
                maxLength={90}
              />
            </View>
          </View>

          <Pressable
            disabled={!canRefine || isRefining}
            onPress={handleRefine}
            style={({ pressed }) => [
              styles.aiButton,
              (!canRefine || isRefining) && styles.disabledButton,
              pressed && styles.pressed,
            ]}
          >
            {isRefining ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.aiButtonText}>AI로 다듬기</Text>
              </>
            )}
          </Pressable>

          {refined ? (
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>AI 정제 결과</Text>
                <Pressable onPress={applyRefinedToInputs} style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>초안에 반영</Text>
                </Pressable>
              </View>

              <Text style={styles.refinedQuestion}>{refined.title}</Text>
              <Text style={styles.refinedDescription}>{refined.description}</Text>

              <View style={styles.refinedOptions}>
                <View style={styles.refinedOption}>
                  <Text style={styles.refinedOptionSide}>A</Text>
                  <Text style={styles.refinedOptionTitle}>{refined.option_a_title}</Text>
                  <Text style={styles.refinedOptionDescription}>{refined.option_a_description}</Text>
                </View>

                <View style={styles.refinedOption}>
                  <Text style={styles.refinedOptionSide}>B</Text>
                  <Text style={styles.refinedOptionTitle}>{refined.option_b_title}</Text>
                  <Text style={styles.refinedOptionDescription}>{refined.option_b_description}</Text>
                </View>
              </View>

              <View style={styles.tagsRow}>
                {refined.tags.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.traitsBox}>
                <Text style={styles.traitsTitle}>성향 점수 매핑</Text>
                {refined.trait_mapping.map((trait) => (
                  <Text key={`${trait.option_side}-${trait.trait_key}`} style={styles.traitText}>
                    {trait.option_side} · {trait.trait_key} +{trait.weight}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          {duplicateDecision ? (
            <View
              style={[
                styles.duplicateBox,
                duplicateDecision.status === 'blocked' && styles.duplicateBoxBlocked,
                duplicateDecision.status === 'warning' && styles.duplicateBoxWarning,
              ]}
            >
              <Text style={styles.duplicateTitle}>
                {duplicateDecision.status === 'clear'
                  ? '중복 검사 통과'
                  : duplicateDecision.status === 'warning'
                    ? '유사 질문 경고'
                    : '등록 차단'}
              </Text>
              <Text style={styles.duplicateText}>
                최고 유사도 {formatSimilarity(duplicateDecision.highestSimilarity)}
              </Text>
              {duplicateDecision.matches.slice(0, 2).map((match) => (
                <Text key={match.id} style={styles.matchText}>
                  - {match.title} ({formatSimilarity(Number(match.similarity))})
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.disabledSubmitButton,
              pressed && styles.pressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>질문 등록하기</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0EA5E9',
  },
  title: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: '900',
    color: '#0F172A',
  },
  aiBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '900',
    color: '#334155',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '31.8%',
    minHeight: 62,
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
  },
  categoryDescription: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryDescriptionSelected: {
    color: '#BAE6FD',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  optionInputBox: {
    flex: 1,
    minHeight: 128,
    borderRadius: 18,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '900',
    color: '#0EA5E9',
  },
  optionInput: {
    flex: 1,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: '#0F172A',
  },
  aiButton: {
    minHeight: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0EA5E9',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  pressed: {
    opacity: 0.76,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  previewCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0EA5E9',
  },
  applyButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E0F2FE',
  },
  applyButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0369A1',
  },
  refinedQuestion: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
    color: '#0F172A',
  },
  refinedDescription: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#64748B',
  },
  refinedOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  refinedOption: {
    flex: 1,
    minHeight: 128,
    borderRadius: 18,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refinedOptionSide: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  refinedOptionTitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: '#0F172A',
  },
  refinedOptionDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#64748B',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  traitsBox: {
    marginTop: 14,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#F1F5F9',
  },
  traitsTitle: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '900',
    color: '#334155',
  },
  traitText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#475569',
  },
  duplicateBox: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  duplicateBoxWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  duplicateBoxBlocked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  duplicateTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  duplicateText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  matchText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#64748B',
  },
  submitButton: {
    minHeight: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
  },
  disabledSubmitButton: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
