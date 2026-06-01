import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Profile } from '../../types/database.types';
import {
  DAILY_PARTICIPATION_TARGET,
  GamificationSnapshot,
  fetchGamificationSnapshot,
  signOut,
} from '../../services/gamificationService';

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const formatNumber = (value: number) => value.toLocaleString('ko-KR');

export default function ProfileScreen() {
  const [snapshot, setSnapshot] = useState<GamificationSnapshot | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadSnapshot = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextSnapshot = await fetchGamificationSnapshot();
      setSnapshot(nextSnapshot);
      setIsGuestMode(nextSnapshot.isGuest);
    } catch (error) {
      Alert.alert('프로필을 불러오지 못했어요', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const profile: Profile | null = snapshot?.profile ?? null;
  const todayCount = snapshot?.todayParticipationCount ?? 0;
  const todayProgress = clampPercent((todayCount / DAILY_PARTICIPATION_TARGET) * 100);
  const displayName = profile?.nickname ?? '게스트 탐험가';
  const isGuest = isGuestMode || snapshot?.isGuest;

  const headerStats = useMemo(
    () => [
      {
        key: 'streak',
        label: '연속 참여',
        value: `${profile?.streak_count ?? 0}일`,
        icon: 'flame' as const,
        color: '#FDBA74',
      },
      {
        key: 'shell',
        label: '보유 조개',
        value: `${formatNumber(profile?.shell_balance ?? 0)}개`,
        icon: 'diamond' as const,
        color: '#A5F3FC',
      },
      {
        key: 'total',
        label: '총 참여',
        value: `${formatNumber(profile?.total_participation_count ?? 0)}회`,
        icon: 'checkmark-circle' as const,
        color: '#C4B5FD',
      },
    ],
    [profile?.shell_balance, profile?.streak_count, profile?.total_participation_count],
  );

  const handleGuestEntry = useCallback(() => {
    setIsGuestMode(true);
    Alert.alert('게스트 모드', '로그인 없이도 섬과 프로필을 둘러볼 수 있어요.');
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃할까요?', '현재 계정에서 나가고 게스트 모드로 전환됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);

          try {
            await signOut();
            await loadSnapshot(true);
            setIsGuestMode(true);
          } catch (error) {
            Alert.alert('로그아웃 실패', error instanceof Error ? error.message : String(error));
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  }, [loadSnapshot]);

  if (isLoading && !snapshot) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>마이페이지를 준비하고 있어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor="#0EA5E9"
            colors={['#0EA5E9']}
            onRefresh={() => loadSnapshot(true)}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Ionicons name={isGuest ? 'person-circle' : 'happy'} size={38} color="#0F172A" />
            </View>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.eyebrow}>MY PAGE</Text>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.accountState}>{isGuest ? '게스트로 둘러보는 중' : '밸런스 섬 주민'}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {headerStats.map((item) => (
              <View key={item.key} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={18} color="#0F172A" />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.cardEyebrow}>TODAY QUEST</Text>
              <Text style={styles.cardTitle}>오늘 참여율</Text>
            </View>
            <Text style={styles.progressCount}>
              {Math.min(todayCount, DAILY_PARTICIPATION_TARGET)}/{DAILY_PARTICIPATION_TARGET} 완료
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${todayProgress}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {todayCount >= DAILY_PARTICIPATION_TARGET
              ? '오늘의 조개 보상 루틴을 모두 채웠어요.'
              : `${DAILY_PARTICIPATION_TARGET - todayCount}번 더 참여하면 오늘의 루틴이 완성돼요.`}
          </Text>
        </View>

        <View style={styles.rewardGrid}>
          <View style={styles.rewardCard}>
            <Ionicons name="gift" size={23} color="#0F172A" />
            <Text style={styles.rewardTitle}>다음 보상</Text>
            <Text style={styles.rewardText}>10회 참여마다 조개 보너스</Text>
          </View>
          <View style={styles.rewardCard}>
            <Ionicons name="color-palette" size={23} color="#0F172A" />
            <Text style={styles.rewardTitle}>섬 꾸미기</Text>
            <Text style={styles.rewardText}>성향 점수로 테마 해금</Text>
          </View>
        </View>

        {isGuest ? (
          <View style={styles.guestPanel}>
            <Text style={styles.guestTitle}>게스트 진입</Text>
            <Text style={styles.guestText}>
              로그인 전에도 피드와 섬을 둘러볼 수 있어요. 투표 기록과 조개 보상은 로그인 후 저장됩니다.
            </Text>
            <Pressable onPress={handleGuestEntry} style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}>
              <Ionicons name="compass" size={18} color="#FFFFFF" />
              <Text style={styles.guestButtonText}>게스트로 계속 보기</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={isLoggingOut}
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <>
                <Ionicons name="log-out" size={18} color="#0F172A" />
                <Text style={styles.logoutButtonText}>로그아웃</Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  heroCard: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FDBA74',
    marginRight: 12,
  },
  heroTitleBlock: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EA580C',
  },
  displayName: {
    marginTop: 3,
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  accountState: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minHeight: 106,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  progressCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0891B2',
  },
  cardTitle: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  progressTrack: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CFFAFE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#22D3EE',
  },
  progressHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    color: '#0E7490',
  },
  rewardGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  rewardCard: {
    flex: 1,
    minHeight: 128,
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
  },
  rewardTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  rewardText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  guestPanel: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  guestText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#64748B',
  },
  guestButton: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  pressed: {
    opacity: 0.76,
  },
});
