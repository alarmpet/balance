import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import type { VoteChoice } from '../domain/question';

interface VoteSplitBarProps {
  percentA: number;
  percentB: number;
  selected?: VoteChoice | null;
  label?: string;
}

export function isValidVoteSplit(percentA: number, percentB: number) {
  return Number.isInteger(percentA)
    && Number.isInteger(percentB)
    && percentA >= 0
    && percentA <= 100
    && percentB >= 0
    && percentB <= 100
    && percentA + percentB === 100;
}

export function VoteSplitBar({
  label,
  percentA,
  percentB,
  selected = null,
}: VoteSplitBarProps) {
  if (!isValidVoteSplit(percentA, percentB)) {
    if (__DEV__) console.warn('Invalid vote split', { percentA, percentB });
    return (
      <Text accessibilityRole="text" style={styles.fallback}>
        결과를 표시할 수 없어요
      </Text>
    );
  }

  const accessibilityLabel = `A ${percentA}퍼센트, B ${percentB}퍼센트${selected ? `, 내가 선택한 답 ${selected}` : ''}`;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
      style={styles.container}
      testID="vote-split-bar"
    >
      <View style={styles.labels}>
        <Text style={styles.percentA}>{percentA}%</Text>
        <Text style={styles.percentB}>{percentB}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.segmentA, { flex: percentA }]} />
        <View style={[styles.segmentB, { flex: percentB }]} />
      </View>
      {label ? <Text style={styles.resultLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  percentA: { color: colors.optionA, fontSize: 24, fontWeight: '800' },
  percentB: { color: colors.optionB, fontSize: 24, fontWeight: '800' },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.button,
    flexDirection: 'row',
    height: 12,
    overflow: 'hidden',
  },
  segmentA: { backgroundColor: colors.optionA },
  segmentB: { backgroundColor: colors.optionB },
  resultLabel: { color: colors.primary, fontWeight: '700', textAlign: 'center' },
  fallback: { color: colors.muted, textAlign: 'center' },
});
