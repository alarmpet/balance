import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import {
  fetchIslandByAxes,
  submitFriendGuess,
  type IslandAxisGuess,
  type IslandTypeBrief
} from '../../services/islandTypeService';

type AxisKey = keyof IslandAxisGuess;

const QUESTIONS: Array<{ key: AxisKey; q: string; a: string; b: string }> = [
  { key: 'social', q: '이 친구는 어떻게 충전할까요?', a: '혼자서', b: '사람들과' },
  { key: 'curious', q: '이 친구의 취향은?', a: '익숙한 것', b: '새로운 것' },
  { key: 'express', q: '이 친구는 감정을?', a: '담담하게', b: '잘 표현해요' },
  { key: 'flow', q: '이 친구의 스타일은?', a: '계획적', b: '즉흥적' }
];

export default function GuessFriendIslandScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const targetId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const user = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  const [answers, setAnswers] = useState<Partial<IslandAxisGuess>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<IslandTypeBrief | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const allAnswered = QUESTIONS.every((item) => answers[item.key] !== undefined);
  const isSelf = Boolean(user && user.id === targetId);

  const guess = useMemo<IslandAxisGuess | null>(() => {
    if (!allAnswered) return null;
    return {
      social: answers.social!,
      curious: answers.curious!,
      express: answers.express!,
      flow: answers.flow!
    };
  }, [allAnswered, answers]);

  const handleSubmit = async () => {
    if (!guess) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (isSelf) {
      setError('내 섬은 직접 테스트로 찾아보세요! 친구의 섬만 추측할 수 있어요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitFriendGuess(targetId, guess);
      const island = await fetchIslandByAxes(guess);
      setResult(island);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultWrap}>
          <Text style={styles.resultEmoji}>{result.emoji}</Text>
          <Text style={styles.resultKicker}>당신이 본 이 친구는</Text>
          <Text style={styles.resultName}>{result.name}</Text>
          <Text style={styles.resultTagline}>"{result.tagline}"</Text>
          <Text style={styles.resultThanks}>고마워요! 친구의 섬에 한 표를 보탰어요 🗳️</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>나도 내 섬 알아보기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>친구가 보는 섬</Text>
        <Text style={styles.heading}>이 친구는 무슨 섬일까요?</Text>
        <Text style={styles.sub}>당신이 보는 이 친구의 모습을 골라주세요. 친구의 결과에 반영돼요.</Text>

        {QUESTIONS.map((item) => (
          <View key={item.key} style={styles.qBlock}>
            <Text style={styles.qText}>{item.q}</Text>
            <View style={styles.optionRow}>
              {[
                { label: item.a, val: false },
                { label: item.b, val: true }
              ].map((opt) => {
                const selected = answers[item.key] === opt.val;
                return (
                  <Pressable
                    key={String(opt.val)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [item.key]: opt.val }))}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!user ? <Text style={styles.note}>제출하려면 로그인이 필요해요(친구의 섬에 한 표).</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!allAnswered || submitting}
          style={[styles.primaryButton, (!allAnswered || submitting) && styles.disabled]}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? '보내는 중...' : user ? '이 친구의 섬에 한 표' : '로그인하고 한 표'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f0fdfa', flex: 1 },
  content: { padding: 20, paddingBottom: 80 },
  kicker: { color: '#0f766e', fontSize: 13, fontWeight: '900' },
  heading: { color: '#083344', fontSize: 26, fontWeight: '900', marginTop: 4 },
  sub: { color: '#46615d', fontSize: 14, lineHeight: 21, marginTop: 8 },
  qBlock: { marginTop: 22 },
  qText: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  optionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  option: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(20,184,166,0.28)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 56,
    justifyContent: 'center'
  },
  optionSelected: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  optionText: { color: '#0f172a', fontSize: 15, fontWeight: '900' },
  optionTextSelected: { color: '#ffffff' },
  error: { color: '#be123c', fontSize: 13, fontWeight: '800', marginTop: 16 },
  note: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 54
  },
  disabled: { opacity: 0.45 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  resultWrap: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  resultEmoji: { fontSize: 72 },
  resultKicker: { color: '#0f766e', fontSize: 14, fontWeight: '900', marginTop: 12 },
  resultName: { color: '#083344', fontSize: 30, fontWeight: '900', marginTop: 6 },
  resultTagline: { color: '#475569', fontSize: 15, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  resultThanks: { color: '#0f766e', fontSize: 13, fontWeight: '800', marginTop: 18, textAlign: 'center' }
});
