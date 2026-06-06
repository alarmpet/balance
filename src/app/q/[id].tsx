import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPublicQuestion, type OptionSide, type PublicQuestion } from '../../services/questionService';

/**
 * 무로그인 도전장 착지. 친구가 공유 링크(`/q/[id]?v=A`)로 들어와 A|B를 고르면
 * 3자 비교(나 / 보낸 사람 / 남들 여론)를 보여주고 앱으로 유도한다.
 * 친구의 선택은 클라이언트에서만 처리(익명 쓰기 없음) → 여론%는 공개 읽기 그대로.
 */
export default function ChallengeQuestionScreen() {
  const params = useLocalSearchParams<{ id: string; v?: string }>();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const senderChoice: OptionSide | null = params.v === 'A' || params.v === 'B' ? params.v : null;

  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myChoice, setMyChoice] = useState<OptionSide | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const q = await fetchPublicQuestion(id);
        if (active) {
          setQuestion(q);
          if (!q) setError('질문을 찾을 수 없어요. 사라졌거나 아직 공개되지 않았어요.');
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : '질문을 불러오지 못했어요.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const total = question ? question.vote_count_a + question.vote_count_b : 0;
  const aPct = total > 0 ? Math.round((question!.vote_count_a / total) * 100) : 50;
  const bPct = 100 - aPct;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#0f766e" />
      </SafeAreaView>
    );
  }

  if (error || !question) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || '질문을 찾을 수 없어요.'}</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>밸런스 아일랜드 가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 투표 전: 큰 A|B 도전장
  if (!myChoice) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>친구가 보낸 질문 👀</Text>
          <Text style={styles.heading}>{question.title}</Text>
          {question.description ? <Text style={styles.sub}>{question.description}</Text> : null}

          <View style={styles.choiceCol}>
            <Pressable style={styles.choiceButton} onPress={() => setMyChoice('A')} accessibilityRole="button">
              <Text style={styles.choiceLabel}>A</Text>
              <Text style={styles.choiceTitle}>{question.option_a_title}</Text>
            </Pressable>
            <Text style={styles.vsText}>VS</Text>
            <Pressable style={styles.choiceButton} onPress={() => setMyChoice('B')} accessibilityRole="button">
              <Text style={styles.choiceLabel}>B</Text>
              <Text style={styles.choiceTitle}>{question.option_b_title}</Text>
            </Pressable>
          </View>

          <Text style={styles.note}>고르면 남들은 어떻게 골랐는지 바로 보여줄게요.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 투표 후: 3자 비교 reveal
  const myPct = myChoice === 'A' ? aPct : bPct;
  const isMinority = myPct < 50;
  const sameAsSender = senderChoice && senderChoice === myChoice;
  const myTitle = myChoice === 'A' ? question.option_a_title : question.option_b_title;
  const senderTitle = senderChoice
    ? senderChoice === 'A'
      ? question.option_a_title
      : question.option_b_title
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>결과 공개 🎉</Text>
        <Text style={styles.heading}>{question.title}</Text>

        <View style={[styles.badge, isMinority ? styles.badgeMinority : styles.badgeMajority]}>
          <Text style={[styles.badgeText, isMinority ? styles.badgeTextMinority : styles.badgeTextMajority]}>
            {isMinority ? `🔥 너는 ${myPct}% 소수파` : `👑 너는 ${myPct}% 다수파`}
          </Text>
        </View>

        {/* 여론 바 */}
        <View style={styles.barCard}>
          <View style={styles.barRow}>
            <Text style={[styles.barLabel, myChoice === 'A' && styles.barLabelMine]} numberOfLines={1}>
              {question.option_a_title}
            </Text>
            <Text style={styles.barPct}>{aPct}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${aPct}%` }, myChoice === 'A' && styles.barFillMine]} />
          </View>
          <View style={[styles.barRow, { marginTop: 12 }]}>
            <Text style={[styles.barLabel, myChoice === 'B' && styles.barLabelMine]} numberOfLines={1}>
              {question.option_b_title}
            </Text>
            <Text style={styles.barPct}>{bPct}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${bPct}%` }, myChoice === 'B' && styles.barFillMine]} />
          </View>
          <Text style={styles.totalText}>{total.toLocaleString('ko-KR')}명 참여</Text>
        </View>

        {/* 3자 비교 */}
        <View style={styles.compareCard}>
          <Text style={styles.compareLine}>
            <Text style={styles.compareWho}>나</Text>는 {myTitle}
          </Text>
          {senderTitle ? (
            <Text style={styles.compareLine}>
              <Text style={styles.compareWho}>친구</Text>는 {senderTitle}
              {sameAsSender ? '  · 똑같네! 🤝' : '  · 갈렸다 😆'}
            </Text>
          ) : null}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>나도 밸런스 더 풀어보기 →</Text>
        </Pressable>
        <Text style={styles.note}>밸런스 아일랜드 · 고르다 보면 나도 몰랐던 내가 보여요</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f0fdfa', flex: 1 },
  content: { padding: 22, paddingBottom: 80 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  kicker: { color: '#0f766e', fontSize: 14, fontWeight: '900' },
  heading: { color: '#083344', fontSize: 25, fontWeight: '900', lineHeight: 33, marginTop: 6 },
  sub: { color: '#46615d', fontSize: 14, lineHeight: 21, marginTop: 10 },
  choiceCol: { alignItems: 'stretch', gap: 8, marginTop: 28 },
  choiceButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(20,184,166,0.3)',
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 92,
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12
  },
  choiceLabel: { color: '#14b8a6', fontSize: 12, fontWeight: '900' },
  choiceTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginTop: 4, textAlign: 'center' },
  vsText: { alignSelf: 'center', color: '#94a3b8', fontSize: 14, fontWeight: '900' },
  note: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 18, textAlign: 'center' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, marginTop: 16, paddingHorizontal: 14, paddingVertical: 8 },
  badgeMinority: { backgroundColor: 'rgba(251,146,60,0.16)', borderColor: 'rgba(234,88,12,0.4)' },
  badgeMajority: { backgroundColor: 'rgba(13,148,136,0.12)', borderColor: 'rgba(13,148,136,0.35)' },
  badgeText: { fontSize: 15, fontWeight: '900' },
  badgeTextMinority: { color: '#c2410c' },
  badgeTextMajority: { color: '#0f766e' },
  barCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(20,184,166,0.2)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 16
  },
  barRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: '#475569', flex: 1, fontSize: 14, fontWeight: '800', marginRight: 8 },
  barLabelMine: { color: '#0f766e' },
  barPct: { color: '#0f172a', fontSize: 15, fontWeight: '900' },
  barTrack: {
    backgroundColor: 'rgba(15,118,110,0.1)',
    borderRadius: 999,
    height: 12,
    marginTop: 6,
    overflow: 'hidden'
  },
  barFill: { backgroundColor: 'rgba(100,116,139,0.45)', borderRadius: 999, height: 12 },
  barFillMine: { backgroundColor: '#0f766e' },
  totalText: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginTop: 12, textAlign: 'right' },
  compareCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(15,118,110,0.18)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 14,
    padding: 16
  },
  compareLine: { color: '#334155', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  compareWho: { color: '#0f766e', fontWeight: '900' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 54
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  errorText: { color: '#be123c', fontSize: 14, fontWeight: '800', textAlign: 'center' }
});
