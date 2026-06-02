import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { router, type Href } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useGamificationStore } from '../../store/gamificationStore';

const DAILY_GOAL = 10;
const LOGIN_ROUTE = '/login' as Href;

export default function ProfileScreen() {
  const authSignOut = useAuthStore((state) => state.signOut);
  const {
    snapshot,
    isLoading,
    isMutating,
    error,
    loadSnapshot,
    claimCheckin,
    signOutUser
  } = useGamificationStore();

  useEffect(() => {
    if (!snapshot) {
      void loadSnapshot();
    }
  }, [loadSnapshot, snapshot]);

  if (error && !snapshot) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadSnapshot()}>
          <Text style={styles.retryText}>다시 불러오기</Text>
        </Pressable>
      </View>
    );
  }

  if (!snapshot || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  const isGuest = snapshot.profile.id === 'guest';
  const today = Math.min(snapshot.profile.today_participation_count, DAILY_GOAL);
  const progress = `${Math.round((today / DAILY_GOAL) * 100)}%` as DimensionValue;
  const latestReward = snapshot.latestLedger?.amount && snapshot.latestLedger.amount > 0
    ? `최근 +${snapshot.latestLedger.amount} 조개`
    : '오늘의 섬 보상 준비 완료';

  async function handleSignOut() {
    await authSignOut();
    await signOutUser();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>마이페이지</Text>
          <Text style={styles.heading}>{snapshot.profile.nickname}</Text>
        </View>
        <View style={styles.shellBadge}>
          <Text style={styles.shellIcon}>조개</Text>
          <Text style={styles.shellText}>{snapshot.profile.shell_balance}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="연속 참여" value={`${snapshot.profile.streak_count}일`} />
        <Stat label="총 참여" value={`${snapshot.profile.total_participation_count}개`} />
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressTitle}>오늘 참여율</Text>
            <Text style={styles.progressValue}>{today}/{DAILY_GOAL} 완료</Text>
          </View>
          <Text style={styles.rewardText}>{latestReward}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progress }]} />
        </View>
      </View>

      {isGuest ? (
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>게스트 미리보기 모드</Text>
          <Text style={styles.guestText}>로그인하면 출석, 조개, 성향 펫, 테마 보상이 내 계정에 저장됩니다.</Text>
          <Pressable style={styles.checkinButton} onPress={() => router.push(LOGIN_ROUTE)}>
            <Text style={styles.checkinText}>로그인하고 보상 저장하기</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={[styles.checkinButton, isMutating ? styles.disabledButton : null]} disabled={isMutating} onPress={() => claimCheckin()}>
          <Text style={styles.checkinText}>{isMutating ? '처리 중...' : '출석 보상 받기'}</Text>
        </Pressable>
      )}

      {error ? <Text style={styles.inlineError}>{error}</Text> : null}

      {!isGuest ? (
        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      ) : null}
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
  checkinButton: {
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    borderColor: '#0ea5e9',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 54
  },
  checkinText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
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
  disabledButton: {
    opacity: 0.55
  },
  error: {
    color: '#be123c',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  guestCard: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  guestText: {
    color: '#64748b',
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8
  },
  guestTitle: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '900'
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  heading: {
    color: '#4a102a',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  inlineError: {
    color: '#be123c',
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center'
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
    marginTop: 12,
    minHeight: 52
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderColor: '#f9a8d4',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  progressFill: {
    backgroundColor: '#f472b6',
    borderRadius: 999,
    height: '100%'
  },
  progressHeader: {
    alignItems: 'flex-start',
    gap: 8,
    justifyContent: 'space-between'
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
  retryButton: {
    backgroundColor: '#be185d',
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  rewardText: {
    color: '#0f766e',
    fontWeight: '900'
  },
  shellBadge: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#f9a8d4',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  shellIcon: {
    color: '#be185d',
    fontSize: 13,
    fontWeight: '900'
  },
  shellText: {
    color: '#be185d',
    fontSize: 18,
    fontWeight: '900'
  },
  stat: {
    backgroundColor: '#ffffff',
    borderColor: '#f9a8d4',
    borderRadius: 20,
    borderWidth: 1,
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
