import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCompat, type IslandCompat, type IslandCompatContext } from '../services/islandTypeService';

const CONTEXTS: Array<{ key: keyof Pick<IslandCompat, 'romance' | 'friend' | 'work'>; label: string; emoji: string }> = [
  { key: 'romance', label: '연애 궁합', emoji: '💗' },
  { key: 'friend', label: '친구 궁합', emoji: '🤝' },
  { key: 'work', label: '일 궁합', emoji: '💼' }
];

export default function CompatScreen() {
  const params = useLocalSearchParams<{ a: string; b: string }>();
  const a = typeof params.a === 'string' ? params.a : '';
  const b = typeof params.b === 'string' ? params.b : '';
  const [compat, setCompat] = useState<IslandCompat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await fetchCompat(a, b);
        if (active) setCompat(result);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : '궁합을 불러오지 못했어요.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [a, b]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>← 돌아가기</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#0f766e" />
        ) : error || !compat ? (
          <Text style={styles.error}>{error || '궁합 정보를 찾을 수 없어요.'}</Text>
        ) : (
          <>
            <View style={styles.pairRow}>
              <Text style={styles.pairEmoji}>{compat.a.emoji}</Text>
              <Text style={styles.pairX}>×</Text>
              <Text style={styles.pairEmoji}>{compat.b.emoji}</Text>
            </View>
            <Text style={styles.pairName}>
              {compat.a.name} × {compat.b.name}
            </Text>

            {CONTEXTS.map((ctx) => (
              <ContextBlock key={ctx.key} label={ctx.label} emoji={ctx.emoji} data={compat[ctx.key]} />
            ))}

            <Text style={styles.disclaimer}>
              궁합은 진단이 아니라 관계 이해를 돕는 재미예요. 사람은 타입보다 훨씬 풍부하니까요.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContextBlock({ label, emoji, data }: { label: string; emoji: string; data: IslandCompatContext }) {
  const score = Math.max(0, Math.min(100, data.score));
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <Text style={styles.blockTitle}>
          {emoji} {label}
        </Text>
        <Text style={styles.score}>{score}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${score}%` }]} />
      </View>

      {data.harmony.length > 0 ? (
        <View style={styles.lineGroup}>
          <Text style={styles.lineKickerHarmony}>잘 맞는 점</Text>
          {data.harmony.map((line, i) => (
            <Text key={`h${i}`} style={styles.line}>· {line}</Text>
          ))}
        </View>
      ) : null}

      {data.challenge.length > 0 ? (
        <View style={styles.lineGroup}>
          <Text style={styles.lineKickerChallenge}>도전 항로</Text>
          {data.challenge.map((line, i) => (
            <Text key={`c${i}`} style={styles.line}>· {line}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f0fdfa', flex: 1 },
  content: { padding: 20, paddingBottom: 80 },
  back: { color: '#0f766e', fontSize: 14, fontWeight: '900' },
  error: { color: '#be123c', fontSize: 14, fontWeight: '800', marginTop: 30, textAlign: 'center' },
  pairRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 20 },
  pairEmoji: { fontSize: 52 },
  pairX: { color: '#94a3b8', fontSize: 28, fontWeight: '900' },
  pairName: { color: '#083344', fontSize: 20, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  block: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(20,184,166,0.2)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 16
  },
  blockHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  blockTitle: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  score: { color: '#0f766e', fontSize: 18, fontWeight: '900' },
  barTrack: {
    backgroundColor: 'rgba(15,118,110,0.12)',
    borderRadius: 999,
    height: 8,
    marginTop: 10,
    overflow: 'hidden'
  },
  barFill: { backgroundColor: '#0f766e', borderRadius: 999, height: 8 },
  lineGroup: { marginTop: 12 },
  lineKickerHarmony: { color: '#0f766e', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  lineKickerChallenge: { color: '#b45309', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  line: { color: '#334155', fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 2 },
  disclaimer: { color: '#94a3b8', fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 22, textAlign: 'center' }
});
