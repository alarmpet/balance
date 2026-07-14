import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import type { ValueAxisId } from '../../play/domain/question';
import { calculateBrain, type BrainVote } from '../domain/brain';
import { isAnalyticsUuid, type AnalyticsEventInput } from '@/src/features/analytics/analytics';

const AXIS_LABELS: Record<ValueAxisId, string> = {
  freedom: '자유',
  stability: '안정',
  relationship: '관계',
  reality: '현실',
  emotion: '감성',
  growth: '성장',
  efficiency: '효율',
  fun: '재미',
};

interface BrainScreenProps {
  votes: BrainVote[];
  userId?: string;
  trackEvent?: (event: AnalyticsEventInput) => Promise<void>;
}

export function BrainScreen({ votes, userId, trackEvent }: BrainScreenProps) {
  const summary = calculateBrain(votes);
  const tracked = useRef(new Set<string>());
  const [openAxis, setOpenAxis] = useState<ValueAxisId | null>(null);
  const visibleAxes = summary.topAxes.slice(0, 3);
  const maximum = Math.max(...visibleAxes.map((axis) => summary.axes[axis].score), 1);
  const maximumCategoryScore = Math.max(
    ...summary.categoryProfiles.flatMap((profile) =>
      profile.topAxes.slice(0, 2).map((axis) => profile.axes[axis].score),
    ),
    1,
  );
  useEffect(() => {
    if (!trackEvent || !isAnalyticsUuid(userId)) return;
    const progressKey = `${userId}:progress`;
    if (!tracked.current.has(progressKey)) {
      tracked.current.add(progressKey);
      void trackEvent({ name: 'brain_progress_viewed', userId, source: 'brain' })
        .catch(() => tracked.current.delete(progressKey));
    }
    if (summary.stage === 'type' || summary.stage === 'context') {
      const typeKey = `${userId}:type`;
      if (!tracked.current.has(typeKey)) {
        tracked.current.add(typeKey);
        void trackEvent({ name: 'brain_type_unlocked', userId, source: 'brain' })
          .catch(() => tracked.current.delete(typeKey));
      }
    }
  }, [summary.stage, trackEvent, userId]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>나의 뇌</Text>
      <Text style={styles.title}>선택이 쌓일수록 선명해져요</Text>

      {summary.stage === 'awakening' ? (
        <View style={styles.card}>
          <Text style={styles.progress}>{summary.voteCount}/10 선택</Text>
          <Text style={styles.muted}>첫 성향 축을 깨우는 중이에요.</Text>
        </View>
      ) : (
        <View style={styles.card} testID="brain-axis-bars">
          <Text style={styles.sectionTitle}>지금 두드러진 성향</Text>
          {visibleAxes.map((axis) => {
            const label = AXIS_LABELS[axis];
            const axisScore = summary.axes[axis];
            const isOpen = openAxis === axis;
            return (
              <View key={axis} style={styles.axisRow}>
                <View style={styles.axisHeading}>
                  <Text style={styles.axisLabel}>{label}</Text>
                  <Text style={styles.axisScore}>{axisScore.score}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: 220 * (axisScore.score / maximum) }]}
                  />
                </View>
                <Pressable
                  accessibilityLabel={isOpen ? `${label} 선택 근거 닫기` : `${label} 이 성향을 만든 선택`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => setOpenAxis(isOpen ? null : axis)}
                  style={styles.evidenceControl}
                >
                  <Text style={styles.evidenceButton}>이 성향을 만든 선택</Text>
                </Pressable>
                {isOpen ? (
                  <Text accessibilityLabel={`${label} 선택 근거`} style={styles.evidenceText}>
                    근거 질문 ID:{' '}
                    {axisScore.evidenceIds.length > 0
                      ? axisScore.evidenceIds.join(', ')
                      : '기록된 선택 없음'}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {summary.stage === 'type' || summary.stage === 'context' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>선택 유형</Text>
          <Text style={styles.archetype}>{summary.archetype}</Text>
          <View style={styles.radial} testID="brain-radial-layout">
            {summary.topAxes.map((axis) => {
              return (
                <View
                  key={axis}
                  style={styles.radialNode}
                  testID="brain-radial-node"
                >
                  <Text style={styles.radialLabel}>{AXIS_LABELS[axis]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {summary.stage === 'context' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>카테고리별 비교</Text>
          {summary.categoryProfiles.map((profile) => {
            const topTwo = profile.topAxes.slice(0, 2);
            return (
              <View key={profile.category} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>
                  {profile.category}: {topTwo.map((axis) =>
                    `${AXIS_LABELS[axis]} ${profile.axes[axis].score.toFixed(2)}`
                  ).join(' · ')}
                </Text>
                {topTwo.map((axis) => (
                  <View key={axis} style={styles.barTrack}>
                    <View
                      style={[
                        styles.categoryBar,
                        { width: 220 * (profile.axes[axis].score / maximumCategoryScore) },
                      ]}
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>
        최근 선택에서 보인 경향이며 전문 심리 진단이 아닙니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    gap: spacing.md,
    padding: spacing.lg,
  },
  eyebrow: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  progress: { color: colors.primary, fontSize: 32, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 14 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  axisRow: { gap: spacing.sm },
  axisHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  axisLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  axisScore: { color: colors.muted, fontSize: 14 },
  barTrack: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  barFill: { backgroundColor: colors.primary, borderRadius: 4, height: 8 },
  evidenceButton: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  evidenceControl: { justifyContent: 'center', minHeight: 44 },
  evidenceText: { color: colors.muted, fontSize: 12 },
  archetype: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  radial: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  radialNode: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexBasis: '40%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  radialLabel: { color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  categoryRow: { gap: spacing.sm },
  categoryLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  categoryBar: { backgroundColor: colors.optionA, borderRadius: 4, height: 8 },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
