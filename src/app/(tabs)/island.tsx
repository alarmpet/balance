import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchGamificationSnapshot, type GamificationSnapshot } from '../../services/gamificationService';

function getIslandLevel(count: number) {
  if (count >= 300) return 4;
  if (count >= 100) return 3;
  if (count >= 50) return 2;
  return 1;
}

function getTitle(traits: GamificationSnapshot['traits']) {
  const top = [...traits].sort((a, b) => b.score - a.score).slice(0, 2).map((trait) => trait.trait_key);
  if (top.includes('curious')) return '즉흥 여행가 여우';
  if (top.includes('comfort_seeker')) return '마지막 한 입을 아끼는 철학자 거북이';
  if (top.includes('planner')) return '섬 지도를 그리는 계획가';
  return '새싹 선택 탐험가';
}

export default function IslandScreen() {
  const [snapshot, setSnapshot] = useState<GamificationSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGamificationSnapshot()
      .then(setSnapshot)
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : '섬 정보를 불러오지 못했습니다.');
      });
  }, []);

  const title = useMemo(() => (snapshot ? getTitle(snapshot.traits) : ''), [snapshot]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!snapshot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  const level = getIslandLevel(snapshot.profile.total_participation_count);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>My Island</Text>
      <Text style={styles.heading}>{snapshot.island.island_name}</Text>
      <View style={styles.hero}>
        <Text style={styles.islandEmoji}>{level >= 3 ? '🏝️' : '🌴'}</Text>
        <Text style={styles.level}>Level {level}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>총 참여 {snapshot.profile.total_participation_count}회로 섬이 자라고 있어요.</Text>
      </View>
      {snapshot.traits.length === 0 ? (
        <Text style={styles.empty}>투표를 시작하면 성향 조각이 이곳에 쌓입니다.</Text>
      ) : null}
      {snapshot.traits.map((trait) => (
        <View key={trait.trait_key} style={styles.traitRow}>
          <Text style={styles.traitName}>{trait.trait_key}</Text>
          <Text style={styles.traitScore}>{trait.score}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  container: {
    backgroundColor: '#ecfeff',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 56
  },
  description: {
    color: '#4f7d89',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  },
  empty: {
    color: '#4f7d89',
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center'
  },
  error: {
    color: '#be123c',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  heading: {
    color: '#164e63',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    marginTop: 20,
    padding: 28
  },
  islandEmoji: {
    fontSize: 80
  },
  kicker: {
    color: '#0891b2',
    fontSize: 13,
    fontWeight: '900'
  },
  level: {
    color: '#0891b2',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10
  },
  title: {
    color: '#164e63',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center'
  },
  traitName: {
    color: '#164e63',
    fontWeight: '800'
  },
  traitRow: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 16
  },
  traitScore: {
    color: '#0891b2',
    fontWeight: '900'
  }
});
