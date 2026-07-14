import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import type { VoteResult } from '../domain/question';

export function ResultOverlay({ result }: { result: VoteResult }) {
  return (
    <View accessibilityRole="summary" style={styles.overlay}>
      <Text style={styles.percentages}>{result.percentA}% vs {result.percentB}%</Text>
      <Text style={styles.label}>{result.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  percentages: { color: colors.text, fontSize: 24, fontWeight: '700' },
  label: { color: colors.primary, fontSize: 18, marginTop: spacing.sm },
});
