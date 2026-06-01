import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { fetchGamificationSnapshot, signOut, type GamificationSnapshot } from '../../services/gamificationService';

const DAILY_GOAL = 10;

export default function ProfileScreen() {
  const [snapshot, setSnapshot] = useState<GamificationSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGamificationSnapshot()
      .then(setSnapshot)
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : '프로필을 불러오지 못했습니다.');
      });
  }, []);

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

  const today = Math.min(snapshot.profile.today_participation_count, DAILY_GOAL);
  const progress = `${Math.round((today / DAILY_GOAL) * 100)}%` as DimensionValue;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>마이페이지</Text>
      <Text style={styles.heading}>{snapshot.profile.nickname}</Text>
      <View style={styles.stats}>
        <Stat label="연속 참여" value={`${snapshot.profile.streak_count}일`} />
        <Stat label="보유 조개" value={`${snapshot.profile.shell_balance}개`} />
      </View>
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>오늘 참여율</Text>
        <Text style={styles.progressValue}>{today}/{DAILY_GOAL} 완료</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progress }]} />
        </View>
      </View>
      <Pressable style={styles.logoutButton} onPress={() => signOut()}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  container: {
    backgroundColor: '#fdf2f8',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 56
  },
  error: {
    color: '#be123c',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  heading: {
    color: '#4a102a',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  kicker: {
    color: '#db2777',
    fontSize: 13,
    fontWeight: '900'
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#4a102a',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    marginTop: 16,
    padding: 18
  },
  progressFill: {
    backgroundColor: '#f472b6',
    borderRadius: 999,
    height: '100%'
  },
  progressTitle: {
    color: '#4a102a',
    fontSize: 16,
    fontWeight: '900'
  },
  progressTrack: {
    backgroundColor: '#fce7f3',
    borderRadius: 999,
    height: 14,
    marginTop: 14,
    overflow: 'hidden'
  },
  progressValue: {
    color: '#9d5675',
    fontWeight: '800',
    marginTop: 6
  },
  stat: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    flex: 1,
    padding: 18
  },
  statLabel: {
    color: '#9d5675',
    fontSize: 13,
    fontWeight: '800'
  },
  statValue: {
    color: '#be185d',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  }
});
