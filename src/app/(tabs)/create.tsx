import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORY_OPTIONS } from '../../constants/categories';
import { submitUserQuestion } from '../../services/questionService';
import { useAuthStore } from '../../store/authStore';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function friendlySubmitError(error: unknown) {
  const raw = error instanceof Error ? error.message : '';
  const lower = raw.toLowerCase();
  if (lower.includes('authentication') || lower.includes('jwt') || lower.includes('unauthorized')) {
    return '로그인이 만료됐어요. 다시 로그인한 뒤 등록해 주세요.';
  }
  if (lower.includes('title')) return '질문 제목은 4자 이상 160자 이하로 적어 주세요.';
  if (lower.includes('option')) return 'A/B 선택지는 각각 1자 이상 80자 이하로 적어 주세요.';
  if (lower.includes('category')) return '카테고리를 다시 선택해 주세요.';
  return '질문 등록에 실패했어요. 잠시 후 다시 시도해 주세요.';
}

export default function CreateScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [categorySlug, setCategorySlug] = useState(CATEGORY_OPTIONS[1]?.slug ?? 'life');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');
  const [lastSubmissionKey, setLastSubmissionKey] = useState('');
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const bootstrapAuth = useAuthStore((state) => state.bootstrap);

  const selectedCategory = useMemo(
    () => CATEGORY_OPTIONS.find((item) => item.slug === categorySlug) ?? CATEGORY_OPTIONS[0],
    [categorySlug]
  );
  const submissionKey = [title.trim(), optionA.trim(), optionB.trim(), categorySlug].join('|');
  const hasRequiredText = title.trim().length >= 4 && optionA.trim().length > 0 && optionB.trim().length > 0;
  const canSubmit = Boolean(user) && hasRequiredText && submitState !== 'submitting' && submissionKey !== lastSubmissionKey;

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  const handleSubmit = async () => {
    if (!user) {
      setSubmitState('error');
      setMessage('질문을 등록하려면 먼저 로그인해 주세요.');
      return;
    }
    if (!hasRequiredText) {
      setSubmitState('error');
      setMessage('질문 제목과 A/B 선택지를 먼저 채워 주세요.');
      return;
    }
    if (submissionKey === lastSubmissionKey) {
      setSubmitState('success');
      setMessage('방금 같은 질문을 등록했어요. 관리자 검수 큐에서 확인됩니다.');
      return;
    }
    if (submitState === 'submitting') return;

    setSubmitState('submitting');
    setMessage('');

    try {
      await submitUserQuestion({
        title,
        description,
        optionA,
        optionB,
        categorySlug,
        isAnonymous
      });
      setLastSubmissionKey(submissionKey);
      setSubmitState('success');
      setMessage('질문이 관리자 검수 큐에 등록됐어요. 이미지와 성향 태그를 확인한 뒤 공개됩니다.');
      setTitle('');
      setDescription('');
      setOptionA('');
      setOptionB('');
      setIsAnonymous(false);
    } catch (error) {
      setSubmitState('error');
      setMessage(friendlySubmitError(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroller} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>질문 제안</Text>
        <Text style={styles.heading}>밸런스 질문 만들기</Text>
        <Text style={styles.description}>
          먼저 텍스트만 등록돼요. 관리자가 성향 분석 가치, 중복, 위험도를 확인하고 A/B 이미지를 붙인 뒤 공개합니다.
        </Text>

        <Field
          label="질문 제목"
          value={title}
          onChangeText={setTitle}
          placeholder="예: 안정적인 회사원 vs 자유로운 프리랜서"
          maxLength={160}
        />
        <Field
          label="짧은 설명"
          value={description}
          onChangeText={setDescription}
          placeholder="선택의 분위기를 한 문장으로 적어 주세요"
          maxLength={240}
          multiline
        />
        <Field label="선택지 A" value={optionA} onChangeText={setOptionA} placeholder="예: 안정적인 회사원" maxLength={80} />
        <Field label="선택지 B" value={optionB} onChangeText={setOptionB} placeholder="예: 자유로운 프리랜서" maxLength={80} />

        <Text style={styles.label}>카테고리</Text>
        <View style={styles.categoryRow}>
          {CATEGORY_OPTIONS.map((item) => (
            <Pressable
              key={item.slug}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} 카테고리 선택`}
              accessibilityState={{ selected: categorySlug === item.slug }}
              onPress={() => setCategorySlug(item.slug)}
              style={[styles.chip, categorySlug === item.slug && { backgroundColor: item.color }]}
            >
              <Text style={[styles.chipText, categorySlug === item.slug && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.previewCard}>
          <Text style={[styles.previewKicker, { color: selectedCategory.color }]}>{selectedCategory.name}</Text>
          <Text style={styles.previewTitle}>{title.trim() || '질문 제목이 여기에 표시돼요'}</Text>
          {description.trim() ? <Text style={styles.previewDescription}>{description.trim()}</Text> : null}
          <View style={styles.previewOptions}>
            <View style={styles.previewOption}>
              <Text style={styles.previewOptionLabel}>A</Text>
              <Text style={styles.previewOptionText}>{optionA.trim() || '선택지 A'}</Text>
            </View>
            <View style={styles.previewOption}>
              <Text style={styles.previewOptionLabel}>B</Text>
              <Text style={styles.previewOptionText}>{optionB.trim() || '선택지 B'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>익명으로 제안</Text>
            <Text style={styles.switchDescription}>관리자는 검수에 필요한 최소 정보만 확인합니다.</Text>
          </View>
          <Switch
            accessibilityLabel="익명으로 질문 제안"
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: '#dbe6e3', true: '#99f6e4' }}
            thumbColor={isAnonymous ? '#0f766e' : '#f8fafc'}
          />
        </View>

        {!user && !isAuthLoading ? (
          <View style={styles.loginBox}>
            <View style={styles.loginCopy}>
              <Text style={styles.loginTitle}>로그인이 필요해요</Text>
              <Text style={styles.loginDescription}>질문 제안은 검수 큐에 저장되므로 로그인한 계정에서만 등록할 수 있습니다.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="로그인 화면으로 이동"
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>로그인</Text>
            </Pressable>
          </View>
        ) : null}

        {message ? (
          <View style={[styles.messageBox, submitState === 'error' ? styles.errorBox : styles.successBox]}>
            <Text style={[styles.messageText, submitState === 'error' ? styles.errorText : styles.successText]}>{message}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="질문 검수 큐에 등록"
          accessibilityState={{ disabled: !canSubmit, busy: submitState === 'submitting' }}
          disabled={!canSubmit}
          style={[styles.primaryButton, !canSubmit ? styles.disabledButton : null]}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>{submitState === 'submitting' ? '등록 중...' : '검수 큐에 등록'}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="피드로 돌아가기"
          style={styles.secondaryButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.secondaryButtonText}>피드에서 선택 이어가기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  onChangeText: (value: string) => void;
};

function Field({ label, value, placeholder, maxLength, multiline = false, onChangeText }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>{value.length}/{maxLength}</Text>
      </View>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8aa3a1"
        accessibilityLabel={label}
        style={[styles.input, multiline ? styles.multilineInput : null]}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  chip: {
    backgroundColor: '#ffedd5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipText: {
    color: '#7c2d12',
    fontWeight: '900'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  container: {
    backgroundColor: '#f0fdfa',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 104,
    paddingTop: 20
  },
  counter: {
    color: '#7c8f8c',
    fontSize: 12,
    fontWeight: '800'
  },
  description: {
    color: '#46615d',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8
  },
  disabledButton: {
    opacity: 0.48
  },
  errorBox: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3'
  },
  errorText: {
    color: '#be123c'
  },
  field: {
    marginTop: 18
  },
  fieldHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  heading: {
    color: '#083344',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(20, 184, 166, 0.28)',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    marginTop: 8,
    minHeight: 52,
    paddingHorizontal: 14
  },
  kicker: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '900'
  },
  label: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  },
  loginBox: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
    padding: 14
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900'
  },
  loginCopy: {
    flex: 1,
    paddingRight: 12
  },
  loginDescription: {
    color: '#854d0e',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4
  },
  loginTitle: {
    color: '#713f12',
    fontSize: 14,
    fontWeight: '900'
  },
  messageBox: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 14
  },
  messageText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19
  },
  multilineInput: {
    minHeight: 92,
    paddingTop: 14
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderColor: 'rgba(20, 184, 166, 0.28)',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 22,
    padding: 18
  },
  previewDescription: {
    color: '#526966',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8
  },
  previewKicker: {
    fontSize: 12,
    fontWeight: '900'
  },
  previewOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    flex: 1,
    padding: 12
  },
  previewOptionLabel: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '900'
  },
  previewOptionText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginTop: 6
  },
  previewOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  previewTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginTop: 6
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 54
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  },
  scroller: { flex: 1 },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderColor: 'rgba(20, 184, 166, 0.24)',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52
  },
  secondaryButtonText: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '900'
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#99f6e4'
  },
  successText: {
    color: '#0f766e'
  },
  switchCopy: {
    flex: 1,
    paddingRight: 12
  },
  switchDescription: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4
  },
  switchRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(20, 184, 166, 0.22)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
    padding: 14
  },
  switchTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  }
});
