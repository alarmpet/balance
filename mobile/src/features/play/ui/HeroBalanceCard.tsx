import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import type { Question, VoteChoice, VoteResult } from '../domain/question';
import { BalanceChoicePanel } from './BalanceChoicePanel';
import { VoteSplitBar } from './VoteSplitBar';

interface HeroBalanceCardProps {
  question: Question;
  result: VoteResult | null;
  disabled: boolean;
  onVote(choice: VoteChoice): boolean;
  onSkip(): void;
  onNext(): void;
}

export function HeroBalanceCard({
  disabled,
  onNext,
  onSkip,
  onVote,
  question,
  result,
}: HeroBalanceCardProps) {
  const choose = (choice: VoteChoice) => {
    if (disabled || result) return;
    if (onVote(choice)) void Haptics.selectionAsync();
  };

  return (
    <View style={styles.card}>
      {question.isDaily ? (
        <View accessible accessibilityLabel="오늘의 밸런스" style={styles.badge}>
          <Text style={styles.badgeText}>오늘의 밸런스</Text>
        </View>
      ) : null}
      <BalanceChoicePanel
        disabled={disabled || result !== null}
        mode="votable"
        onVote={choose}
        question={question}
        selected={result?.selected ?? null}
        showMedia={question.isDaily}
      />
      {result ? (
        <VoteSplitBar
          label={result.label}
          percentA={result.percentA}
          percentB={result.percentB}
          selected={result.selected}
        />
      ) : null}
      {result ? (
        <Pressable
          accessibilityLabel="다음 질문"
          accessibilityRole="button"
          onPress={onNext}
          style={styles.primaryAction}
        >
          <Text style={styles.primaryActionText}>다음 질문</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="질문 패스"
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onSkip}
          style={[styles.skip, disabled && styles.disabled]}
        >
          <Text style={styles.skipText}>패스</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    gap: spacing.md,
    padding: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: { color: colors.primary, fontWeight: '800' },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  primaryActionText: { color: colors.surface, fontWeight: '800' },
  skip: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
  },
  skipText: { color: colors.muted, fontSize: 16 },
  disabled: { opacity: 0.55 },
});
